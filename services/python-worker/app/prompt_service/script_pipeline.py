"""MS1 one-sentence-to-Script business workflow."""

from __future__ import annotations

import json
from typing import Any

from app.errors import QualityCheckFailed, WorkerError
from app.model_adapters.text import TextModelAdapter
from app.prompts.loader import PromptLoader
from app.schemas.models import (
    Script,
    ScriptGenerationResult,
    ScriptQualityResult,
    StoryBible,
    TaskExecution,
    TextContentResult,
)

from .parser import ScriptDraftParser


class ScriptPipeline:
    def __init__(
        self,
        adapter: TextModelAdapter,
        prompt_loader: PromptLoader | None = None,
        prompt_versions: dict[str, str] | None = None,
    ) -> None:
        self.adapter = adapter
        self.prompts = prompt_loader or PromptLoader()
        self.prompt_versions = prompt_versions or {
            "scriptExpander": "v1",
            "scriptGenerator": "v1",
            "scriptQualityChecker": "v1",
            "scriptRewriter": "v1",
            "storyBibleExtractor": "v1",
        }
        self.parser = ScriptDraftParser()

    async def execute(self, task: TaskExecution) -> ScriptGenerationResult:
        if task.task_type != "script.generate":
            raise WorkerError("UNSUPPORTED_TASK_TYPE", f"unsupported taskType: {task.task_type}")

        config_json = json.dumps(task.payload.project_config, ensure_ascii=False, indent=2)
        expanded = await self._model(
            "expander",
            "script_expander_v1.md",
            project_config_json=config_json,
            source_text=task.payload.source_text,
        )
        expanded_result = TextContentResult.model_validate(expanded)

        generated = await self._model(
            "generator",
            "script_generator_v1.md",
            project_config_json=config_json,
            expanded_story=expanded_result.content,
        )
        script = self._parse_script(generated, task.payload.project_config)

        quality = await self._quality(script, config_json)
        rewrite_count = 0
        if not quality.passed:
            rewrite_count = 1
            rewritten = await self._model(
                "rewriter",
                "script_rewriter_v1.md",
                project_config_json=config_json,
                script_draft=script.script_text,
                quality_result_json=quality.model_dump_json(by_alias=True),
            )
            script = self._parse_script(rewritten, task.payload.project_config)
            quality = await self._quality(script, config_json)
            if not quality.passed:
                raise QualityCheckFailed()

        bible_raw = await self._model(
            "bible",
            "story_bible_extractor_v1.md",
            project_config_json=config_json,
            final_script=script.script_text,
        )
        bible = StoryBible.model_validate(bible_raw)
        return ScriptGenerationResult(
            schemaVersion="1.0",
            script=script,
            storyBible=bible,
            quality=quality,
            rewriteCount=rewrite_count,
            promptVersions=self.prompt_versions,
        )

    async def _quality(self, script: Script, config_json: str) -> ScriptQualityResult:
        raw = await self._model(
            "quality",
            "script_quality_checker_v1.md",
            project_config_json=config_json,
            script_draft=script.script_text,
        )
        return ScriptQualityResult.model_validate(raw)

    def _parse_script(self, raw: dict[str, Any], project_config: dict[str, Any]) -> Script:
        content = TextContentResult.model_validate(raw).content
        return self.parser.parse(content, project_config)

    async def _model(self, stage: str, prompt_name: str, **variables: Any) -> dict[str, Any]:
        try:
            prompt = self.prompts.render(prompt_name, **variables)
            return await self.adapter.generate(stage, prompt, context=variables)
        except WorkerError:
            raise
        except Exception as exc:  # Adapter failures are retryable at task level in MS1.
            raise WorkerError("TEXT_MODEL_CALL_FAILED", str(exc), retryable=True) from exc
