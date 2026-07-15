from __future__ import annotations

import json
from pathlib import Path

from .base import TextModelAdapter


class MockTextAdapter(TextModelAdapter):
    """Deterministic adapter for local development and contract tests."""

    def __init__(self, scenario: str = "happy_path") -> None:
        self.scenario = scenario
        self.quality_calls = 0
        self.examples = Path(__file__).resolve().parents[2] / "schemas" / "examples"

    def _load(self, filename: str) -> dict:
        return json.loads((self.examples / filename).read_text(encoding="utf-8"))

    async def generate(self, stage: str, prompt: str, *, context: dict) -> dict:
        if self.scenario == "model_unavailable":
            raise RuntimeError("mock model unavailable")
        if stage == "expander":
            return self._load("story-expansion-result.example.json")
        if stage in {"generator", "rewriter"}:
            script = self._load("script.example.json")
            content = script["scriptText"]
            if "[STORY_PROMISE]" not in content:
                content = content.replace(
                    "[STORY_SUMMARY]",
                    "[STORY_PROMISE]\n" + script["storyPromise"] + "\n\n[STORY_SUMMARY]",
                    1,
                )
                content = content.replace(
                    "[CHARACTERS]",
                    "[FINAL_OUTCOME]\n" + script["finalOutcome"] + "\n\n[CHARACTERS]",
                    1,
                )
            return {"content": content}
        if stage == "quality":
            self.quality_calls += 1
            filename = (
                "script-quality-failed.example.json"
                if self.scenario == "quality_failed" and self.quality_calls == 1
                else "script-quality-passed.example.json"
            )
            return self._load(filename)
        if stage == "bible":
            return self._load("story-bible.example.json")
        raise ValueError(f"unsupported mock stage: {stage}")
