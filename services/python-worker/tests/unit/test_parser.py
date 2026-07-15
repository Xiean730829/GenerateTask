import json
from pathlib import Path

from app.prompt_service import ScriptDraftParser


def test_parser_reads_golden_script() -> None:
    path = Path(__file__).parents[2] / "app/schemas/examples/script.example.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    script = ScriptDraftParser().parse(
        data["scriptText"], {"targetDurationSeconds": 60, "style": "写实"}
    )
    assert script.title == data["title"]
    assert len(script.scenes) == 3
    assert script.scenes[0].elements[0].type == "action"
