"""Parser for the stable ScriptDraft text grammar."""

from __future__ import annotations

import re
from typing import Any

from app.schemas.models import (
    ActionElement,
    Character,
    DialogueElement,
    Scene,
    Script,
)


def _section(text: str, marker: str, next_markers: list[str]) -> str:
    following = "|".join(re.escape(marker) for marker in next_markers)
    pattern = re.escape(marker) + rf"\s*\n([\s\S]*?)(?=\n(?:{following})\s*\n|\Z)"
    match = re.search(pattern, text)
    if not match:
        raise ValueError(f"missing marker {marker}")
    return match.group(1).strip()


class ScriptDraftParser:
    def parse(self, content: str, project_config: dict[str, Any] | None = None) -> Script:
        if not content.startswith("[TITLE]") or "[END_SCRIPT]" not in content:
            raise ValueError("ScriptDraft must start with [TITLE] and end with [END_SCRIPT]")
        title = _section(content, "[TITLE]", ["[LOGLINE]"])
        logline = _section(content, "[LOGLINE]", ["[STORY_PROMISE]", "[STORY_SUMMARY]"])
        story_promise = self._optional_section(content, "[STORY_PROMISE]", ["[STORY_SUMMARY]"])
        story_summary = _section(content, "[STORY_SUMMARY]", ["[FINAL_OUTCOME]", "[CHARACTERS]"])
        final_outcome = self._optional_section(content, "[FINAL_OUTCOME]", ["[CHARACTERS]"])
        characters_text = _section(content, "[CHARACTERS]", ["[SCRIPT]"])
        script_body = _section(content, "[SCRIPT]", ["[END_SCRIPT]"])

        characters = self._parse_characters(characters_text)
        scenes = self._parse_scenes(script_body)
        project_config = project_config or {}
        return Script(
            title=title,
            logline=logline,
            storyPromise=story_promise or logline,
            storySummary=story_summary,
            finalOutcome=final_outcome or story_summary,
            targetDurationSeconds=int(project_config.get("targetDurationSeconds", 60)),
            language=str(project_config.get("language", "zh-CN")),
            genre=str(project_config.get("genre", "短剧")),
            style=str(project_config.get("style", "写实、克制的短剧视觉风格")),
            characters=characters,
            scenes=scenes,
            scriptText=content,
        )

    def _optional_section(self, content: str, marker: str, next_markers: list[str]) -> str | None:
        if marker not in content:
            return None
        return _section(content, marker, next_markers)

    def _parse_characters(self, text: str) -> list[Character]:
        result: list[Character] = []
        for line in text.splitlines():
            line = line.strip()
            if not line or not line.startswith("-"):
                continue
            parts = [part.strip() for part in line[1:].split("｜")]
            if len(parts) < 3:
                raise ValueError(f"invalid character line: {line}")
            result.append(
                Character(
                    name=parts[0],
                    narrativeRole=parts[1],
                    description=parts[2],
                    relationships=parts[3:] or [],
                )
            )
        if not result:
            raise ValueError("[CHARACTERS] must contain at least one character")
        return result

    def _parse_scenes(self, text: str) -> list[Scene]:
        matches = re.findall(r"\[SCENE\s+(\d+)\]([\s\S]*?)\[END_SCENE\]", text)
        if not matches:
            raise ValueError("ScriptDraft must contain at least one scene")
        scenes: list[Scene] = []
        for raw_index, body in matches:
            action_match = re.search(
                r"\[ACTION\]\s*\n([\s\S]*?)(?=\n\[(?:DIALOGUE|END_SCENE)\]|\Z)",
                body,
            )
            elements: list[ActionElement | DialogueElement] = []
            if action_match:
                elements.append(ActionElement(type="action", content=action_match.group(1).strip()))
            for dialogue in re.finditer(
                r"\[DIALOGUE\]\s*\n([\s\S]*?)(?=\n\[(?:ACTION|END_SCENE)\]|\Z)", body
            ):
                for line in dialogue.group(1).strip().splitlines():
                    match = re.match(r"([^（(:]+)(?:（([^）]+)）)?\s*[:：]\s*(.+)", line.strip())
                    if match:
                        elements.append(
                            DialogueElement(
                                type="dialogue",
                                speaker=match.group(1).strip(),
                                performanceCue=match.group(2),
                                text=match.group(3).strip(),
                            )
                        )
            scenes.append(
                Scene(
                    sceneIndex=int(raw_index),
                    slugline=self._field(body, "SLUGLINE"),
                    purpose=self._field(body, "SCENE_PURPOSE"),
                    dramaticChange=self._field(body, "DRAMATIC_CHANGE"),
                    environment=self._field(body, "ENVIRONMENT"),
                    characterState=self._field(body, "CHARACTER_STATE"),
                    elements=elements,
                )
            )
        return scenes

    @staticmethod
    def _field(body: str, name: str) -> str:
        match = re.search(rf"^{re.escape(name)}:\s*(.+)$", body, re.MULTILINE)
        if not match:
            raise ValueError(f"scene is missing {name}")
        return match.group(1).strip()
