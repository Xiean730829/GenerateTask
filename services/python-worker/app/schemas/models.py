"""Runtime models for the Python Worker content and task contracts."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class TextContentResult(StrictModel):
    content: str = Field(min_length=1)


class Character(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    narrative_role: str = Field(alias="narrativeRole", min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=3000)
    relationships: list[str] = Field(default_factory=list)


class ActionElement(StrictModel):
    type: Literal["action"]
    content: str = Field(min_length=1, max_length=4000)


class DialogueElement(StrictModel):
    type: Literal["dialogue"]
    speaker: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=1, max_length=2000)
    performance_cue: str | None = Field(default=None, alias="performanceCue")


class Scene(StrictModel):
    scene_index: int = Field(alias="sceneIndex", ge=1)
    slugline: str = Field(min_length=1, max_length=500)
    purpose: str = Field(min_length=1, max_length=1000)
    dramatic_change: str = Field(alias="dramaticChange", min_length=1, max_length=1000)
    environment: str = Field(min_length=1, max_length=4000)
    character_state: str = Field(alias="characterState", min_length=1, max_length=4000)
    elements: list[ActionElement | DialogueElement] = Field(min_length=1)

    @model_validator(mode="after")
    def require_action(self) -> Scene:
        if not any(element.type == "action" for element in self.elements):
            raise ValueError("each scene must contain at least one action element")
        return self


class Script(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    logline: str = Field(min_length=1, max_length=1000)
    story_promise: str = Field(alias="storyPromise", min_length=1, max_length=1000)
    story_summary: str = Field(alias="storySummary", min_length=1)
    final_outcome: str = Field(alias="finalOutcome", min_length=1, max_length=2000)
    target_duration_seconds: int = Field(alias="targetDurationSeconds", ge=1, le=3600)
    language: str = Field(pattern=r"^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")
    genre: str = Field(min_length=1, max_length=100)
    style: str = Field(min_length=1, max_length=1000)
    characters: list[Character] = Field(min_length=1)
    scenes: list[Scene] = Field(min_length=1)
    script_text: str = Field(alias="scriptText", min_length=1)

    @field_validator("scenes")
    @classmethod
    def scene_indexes_are_contiguous(cls, scenes: list[Scene]) -> list[Scene]:
        indexes = [scene.scene_index for scene in scenes]
        if indexes != list(range(1, len(indexes) + 1)):
            raise ValueError("sceneIndex values must start at 1 and be contiguous")
        return scenes

    @field_validator("script_text")
    @classmethod
    def script_text_has_boundaries(cls, value: str) -> str:
        if not value.startswith("[TITLE]") or "[END_SCRIPT]" not in value:
            raise ValueError("scriptText must contain [TITLE] and [END_SCRIPT] markers")
        return value


class QualityProblem(StrictModel):
    code: str = Field(pattern=r"^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$", max_length=80)
    severity: Literal["blocking", "major", "minor"]
    evidence: str = Field(min_length=1, max_length=2000)
    repair_instruction: str = Field(alias="repairInstruction", min_length=1, max_length=2000)


class ScriptQualityResult(StrictModel):
    passed: bool
    score: int = Field(ge=0, le=100)
    problems: list[QualityProblem] = Field(max_length=8)
    summary: str = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def enforce_quality_gate(self) -> ScriptQualityResult:
        blocking = {"blocking", "major"}
        if self.passed and (self.score < 80 or any(p.severity in blocking for p in self.problems)):
            raise ValueError(
                "passed quality result requires score >= 80 and no blocking/major problems"
            )
        return self


class StoryBibleMetadata(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    logline: str = Field(min_length=1, max_length=1000)
    genre: str = Field(min_length=1, max_length=100)
    language: str = Field(pattern=r"^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")
    target_duration_seconds: int = Field(alias="targetDurationSeconds", ge=1, le=3600)
    aspect_ratio: str = Field(alias="aspectRatio", pattern=r"^[1-9][0-9]*:[1-9][0-9]*$")
    tone: str = Field(min_length=1, max_length=500)
    visual_style: str = Field(alias="visualStyle", min_length=1, max_length=1000)
    directorial_voice: str = Field(alias="directorialVoice", min_length=1, max_length=1000)


class WorldSettings(StrictModel):
    time_period: str = Field(alias="timePeriod", min_length=1, max_length=500)
    geography: str = Field(min_length=1, max_length=1000)
    social_context: str = Field(alias="socialContext", min_length=1, max_length=2000)
    world_rules: list[str] = Field(alias="worldRules", max_length=20)
    environment_baseline: str = Field(alias="environmentBaseline", min_length=1, max_length=2000)
    color_and_light_baseline: str = Field(
        alias="colorAndLightBaseline", min_length=1, max_length=2000
    )
    core_themes: list[str] = Field(alias="coreThemes", min_length=1, max_length=10)
    forbidden_contradictions: list[str] = Field(
        alias="forbiddenContradictions", max_length=20
    )


class StoryBible(StrictModel):
    metadata: StoryBibleMetadata
    world_settings: WorldSettings = Field(alias="worldSettings")


class PromptVersions(StrictModel):
    script_expander: str = Field(alias="scriptExpander", pattern=r"^v[1-9][0-9]*$")
    script_generator: str = Field(alias="scriptGenerator", pattern=r"^v[1-9][0-9]*$")
    script_quality_checker: str = Field(
        alias="scriptQualityChecker", pattern=r"^v[1-9][0-9]*$"
    )
    script_rewriter: str = Field(alias="scriptRewriter", pattern=r"^v[1-9][0-9]*$")
    story_bible_extractor: str = Field(
        alias="storyBibleExtractor", pattern=r"^v[1-9][0-9]*$"
    )


class ScriptGenerationResult(StrictModel):
    schema_version: Literal["1.0"] = Field(alias="schemaVersion")
    script: Script
    story_bible: StoryBible = Field(alias="storyBible")
    quality: ScriptQualityResult
    rewrite_count: int = Field(alias="rewriteCount", ge=0, le=1)
    prompt_versions: PromptVersions = Field(alias="promptVersions")


class TaskPayload(StrictModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    source_text: str = Field(alias="sourceText", min_length=1)
    project_config: dict[str, Any] = Field(alias="projectConfig")


class TaskExecution(StrictModel):
    message_id: str = Field(alias="messageId", min_length=1)
    task_id: str = Field(alias="taskId", min_length=1)
    task_type: str = Field(alias="taskType", min_length=1)
    project_id: str = Field(alias="projectId", min_length=1)
    episode_id: str = Field(alias="episodeId", min_length=1)
    attempt: int = Field(ge=0)
    trace_id: str = Field(alias="traceId", min_length=1)
    created_at: datetime = Field(alias="createdAt")
    payload: TaskPayload


class CallbackError(StrictModel):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)
    retryable: bool


class WorkerMetadata(StrictModel):
    name: str = Field(min_length=1)
    version: str = Field(min_length=1)


class TaskResult(StrictModel):
    message_id: str = Field(alias="messageId", min_length=1)
    task_id: str = Field(alias="taskId", min_length=1)
    episode_id: str = Field(alias="episodeId", min_length=1)
    status: Literal["running", "succeeded", "failed"]
    attempt: int = Field(ge=0)
    progress: int = Field(ge=0, le=100)
    result: dict[str, Any] | None = None
    error: CallbackError | None = None
    worker: WorkerMetadata | None = None
    reported_at: datetime = Field(alias="reportedAt")

    @model_validator(mode="after")
    def validate_status_shape(self) -> TaskResult:
        if self.status == "succeeded" and (self.result is None or self.error is not None):
            raise ValueError("succeeded result requires result and forbids error")
        if self.status == "failed" and (self.error is None or self.result is not None):
            raise ValueError("failed result requires error and forbids result")
        if self.status in {"succeeded", "failed"} and self.progress != 100:
            raise ValueError("terminal task results must report progress=100")
        if self.status == "running" and (self.result is not None or self.error is not None):
            raise ValueError("running result forbids result and error")
        return self
