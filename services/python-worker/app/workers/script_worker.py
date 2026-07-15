from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol

from app.errors import WorkerError
from app.prompt_service import ScriptPipeline
from app.schemas.models import TaskExecution, TaskResult, WorkerMetadata


class ResultReporter(Protocol):
    async def report(self, task_id: str, result: TaskResult) -> None: ...


class ScriptWorker:
    def __init__(
        self, pipeline: ScriptPipeline, reporter: ResultReporter, worker_name: str, version: str
    ) -> None:
        self.pipeline = pipeline
        self.reporter = reporter
        self.worker_name = worker_name
        self.version = version

    async def process(self, payload: bytes | str | dict) -> TaskResult:
        import json

        try:
            raw = json.loads(payload) if isinstance(payload, (bytes, str)) else payload
            task = TaskExecution.model_validate(raw)
            generation = await self.pipeline.execute(task)
            result = TaskResult(
                messageId=task.message_id,
                taskId=task.task_id,
                episodeId=task.episode_id,
                status="succeeded",
                attempt=task.attempt,
                progress=100,
                result=generation.model_dump(mode="json", by_alias=True),
                worker=WorkerMetadata(name=self.worker_name, version=self.version),
                reportedAt=datetime.now(UTC),
            )
        except WorkerError as exc:
            result = self._failed_result(
                raw if "raw" in locals() and isinstance(raw, dict) else {}, exc
            )
        except Exception as exc:
            result = self._failed_result(
                raw if "raw" in locals() and isinstance(raw, dict) else {},
                WorkerError("WORKER_VALIDATION_FAILED", str(exc), retryable=False),
            )
        task_id = result.task_id
        await self.reporter.report(task_id, result)
        return result

    def _failed_result(self, raw: dict, error: WorkerError) -> TaskResult:
        return TaskResult(
            messageId=str(raw.get("messageId", "unknown")),
            taskId=str(raw.get("taskId", "unknown")),
            episodeId=str(raw.get("episodeId", "unknown")),
            status="failed",
            attempt=int(raw.get("attempt", 0)),
            progress=100,
            error={"code": error.code, "message": str(error), "retryable": error.retryable},
            worker=WorkerMetadata(name=self.worker_name, version=self.version),
            reportedAt=datetime.now(UTC),
        )
