import json
from pathlib import Path

from jsonschema import Draft202012Validator

from app.schemas.loader import SchemaRegistry


def test_python_schema_examples_validate() -> None:
    root = Path(__file__).parents[2] / "app/schemas"
    registry = SchemaRegistry(root)
    mapping = {
        "text-content-result.schema.json": [
            "story-expansion-result.example.json",
            "script-draft-text-result.example.json",
        ],
        "script-quality-result.schema.json": [
            "script-quality-failed.example.json",
            "script-quality-passed.example.json",
        ],
        "story-bible.schema.json": ["story-bible.example.json"],
        "script.schema.json": ["script.example.json"],
        "script-generation-result.schema.json": ["script-generation-result.example.json"],
    }
    for schema_name, examples in mapping.items():
        for example in examples:
            instance = json.loads((root / "examples" / example).read_text(encoding="utf-8"))
            registry.validate(schema_name, instance)


def test_task_result_example_contains_valid_python_result() -> None:
    root = Path(__file__).resolve().parents[2]
    project_root = root.parent.parent
    outer_path = (
        project_root / "packages/contracts/json-schema/generation-spec/task-result.schema.json"
    )
    example_path = project_root / "packages/contracts/examples/task-result-succeeded.json"
    outer = json.loads(outer_path.read_text())
    example = json.loads(example_path.read_text())
    assert list(Draft202012Validator(outer).iter_errors(example)) == []
    registry = SchemaRegistry(root / "app/schemas")
    registry.validate("script-generation-result.schema.json", example["result"])
