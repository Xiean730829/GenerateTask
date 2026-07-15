"""Local JSON Schema loading and validation without network lookups."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


class SchemaRegistry:
    def __init__(self, directory: Path | None = None) -> None:
        self.directory = directory or Path(__file__).resolve().parent
        self.schemas: dict[str, dict[str, Any]] = {}
        self.registry = Registry()
        self._load()

    def _load(self) -> None:
        for path in self.directory.glob("*.schema.json"):
            schema = json.loads(path.read_text(encoding="utf-8"))
            self.schemas[path.name] = schema
            resource = Resource.from_contents(schema)
            self.registry = self.registry.with_resource(schema["$id"], resource)
            self.registry = self.registry.with_resource(path.name, resource)

    def validate(self, schema_name: str, instance: Any) -> None:
        schema = self.schemas[schema_name]
        errors = sorted(
            Draft202012Validator(schema, registry=self.registry).iter_errors(instance),
            key=lambda error: list(error.path),
        )
        if errors:
            details = "; ".join(f"{list(error.path)}: {error.message}" for error in errors[:5])
            raise ValueError(f"schema validation failed for {schema_name}: {details}")
