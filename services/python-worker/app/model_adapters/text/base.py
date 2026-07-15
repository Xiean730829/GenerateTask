from __future__ import annotations

from abc import ABC, abstractmethod


class TextModelAdapter(ABC):
    @abstractmethod
    async def generate(self, stage: str, prompt: str, *, context: dict) -> dict:
        """Return a JSON-compatible model response for a pipeline stage."""
