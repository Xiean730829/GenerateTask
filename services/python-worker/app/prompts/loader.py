"""Versioned Markdown prompt loader."""

from pathlib import Path
from typing import Any

from jinja2 import Environment, StrictUndefined


class PromptLoader:
    def __init__(self, directory: Path | None = None) -> None:
        self.directory = directory or Path(__file__).resolve().parent
        self.environment = Environment(undefined=StrictUndefined, autoescape=False)

    def render(self, prompt_name: str, **variables: Any) -> str:
        path = self.directory / prompt_name
        template = self.environment.from_string(path.read_text(encoding="utf-8"))
        return template.render(**variables)
