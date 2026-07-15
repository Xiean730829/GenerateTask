import json
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


def _contract_registry(contract_root: Path) -> Registry:
    registry = Registry()
    for path in [
        *contract_root.joinpath("business").glob("*.schema.json"),
        *contract_root.joinpath("generation-spec").glob("*.schema.json"),
    ]:
        schema = json.loads(path.read_text(encoding="utf-8"))
        registry = registry.with_resource(schema["$id"], Resource.from_contents(schema))
    return registry


def test_successful_task_result_matches_shared_script_generation_contract() -> None:
    worker_root = Path(__file__).resolve().parents[2]
    project_root = worker_root.parent.parent
    contract_root = project_root / "packages/contracts/json-schema"
    result_schema_path = contract_root / "generation-spec/script-generation-result.schema.json"
    example_path = project_root / "packages/contracts/examples/task-result-succeeded.json"

    schema = json.loads(result_schema_path.read_text(encoding="utf-8"))
    example = json.loads(example_path.read_text(encoding="utf-8"))
    errors = list(
        Draft202012Validator(schema, registry=_contract_registry(contract_root)).iter_errors(
            example["result"]
        )
    )

    assert errors == []


def test_python_shot_list_example_matches_shared_v2_contract() -> None:
    worker_root = Path(__file__).resolve().parents[2]
    project_root = worker_root.parent.parent
    contract_root = project_root / "packages/contracts/json-schema"
    schema_path = contract_root / "generation-spec/shot-list.schema.json"
    example_path = project_root / "packages/contracts/examples/shot-list-v2.json"

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    example = json.loads(example_path.read_text(encoding="utf-8"))
    errors = list(
        Draft202012Validator(schema, registry=_contract_registry(contract_root)).iter_errors(
            example
        )
    )

    assert errors == []
