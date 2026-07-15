import json
from pathlib import Path

import pytest

from app.callbacks import RecordingCallbackClient
from app.model_adapters.text import MockTextAdapter
from app.prompt_service import ScriptPipeline
from app.schemas.models import TaskExecution
from app.workers import ScriptWorker

EXAMPLE = Path(__file__).resolve().parents[4] / "packages/contracts/examples/task-execution.json"


def task() -> TaskExecution:
    return TaskExecution.model_validate(json.loads(EXAMPLE.read_text(encoding="utf-8")))


@pytest.mark.asyncio
async def test_happy_path_returns_complete_script_result() -> None:
    result = await ScriptPipeline(MockTextAdapter()).execute(task())
    assert result.script.title
    assert result.script.scenes[0].scene_index == 1
    assert result.quality.passed is True
    assert result.rewrite_count == 0


@pytest.mark.asyncio
async def test_quality_failure_is_rewritten_once() -> None:
    result = await ScriptPipeline(MockTextAdapter("quality_failed")).execute(task())
    assert result.quality.passed is True
    assert result.rewrite_count == 1


@pytest.mark.asyncio
async def test_worker_reports_full_result_to_callback() -> None:
    callback = RecordingCallbackClient()
    worker = ScriptWorker(ScriptPipeline(MockTextAdapter()), callback, "script-worker", "ms1")
    result = await worker.process(task().model_dump(mode="json", by_alias=True))
    assert result.status == "succeeded"
    assert callback.results[0]["result"]["script"]["title"]
