"""Run the complete MS1 pipeline without RabbitMQ or Java."""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from app.callbacks import RecordingCallbackClient
from app.config import Settings
from app.model_adapters.text import MockTextAdapter
from app.prompt_service import ScriptPipeline
from app.schemas.models import TaskExecution
from app.workers import ScriptWorker


async def run(scenario: str) -> None:
    project_root = Path(__file__).resolve().parents[3]
    task_path = project_root / "packages/contracts/examples/task-execution.json"
    task = TaskExecution.model_validate(json.loads(task_path.read_text(encoding="utf-8")))
    settings = Settings(MOCK_SCENARIO=scenario)
    callback = RecordingCallbackClient()
    pipeline = ScriptPipeline(
        MockTextAdapter(settings.mock_scenario),
        prompt_versions={
            "scriptExpander": settings.prompt_version_expander,
            "scriptGenerator": settings.prompt_version_generator,
            "scriptQualityChecker": settings.prompt_version_quality_checker,
            "scriptRewriter": settings.prompt_version_rewriter,
            "storyBibleExtractor": settings.prompt_version_bible_extractor,
        },
    )
    worker = ScriptWorker(pipeline, callback, settings.worker_id, "ms1")
    result = await worker.process(task.model_dump(mode="json", by_alias=True))
    print(json.dumps(result.model_dump(mode="json", by_alias=True), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--scenario",
        choices=["happy_path", "quality_failed", "model_unavailable"],
        default="happy_path",
    )
    args = parser.parse_args()
    asyncio.run(run(args.scenario))
