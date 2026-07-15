from __future__ import annotations

from typing import Any

import httpx

from app.schemas.models import TaskResult


class CallbackClient:
    def __init__(self, base_url: str, token: str = "", timeout_seconds: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout_seconds = timeout_seconds

    async def report(self, task_id: str, result: TaskResult) -> None:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["X-Internal-Api-Key"] = self.token
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/internal/tasks/{task_id}/result",
                json=result.model_dump(mode="json", by_alias=True, exclude_none=True),
                headers=headers,
            )
            response.raise_for_status()


class RecordingCallbackClient:
    """In-memory callback sink used by local Mock tests."""

    def __init__(self) -> None:
        self.results: list[dict[str, Any]] = []

    async def report(self, task_id: str, result: TaskResult) -> None:
        self.results.append(result.model_dump(mode="json", by_alias=True, exclude_none=True))
