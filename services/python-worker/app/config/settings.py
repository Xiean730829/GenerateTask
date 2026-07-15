"""Environment-backed Worker settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="local", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    worker_id: str = Field(default="script-worker-local", alias="WORKER_ID")

    rabbitmq_url: str = Field(
        default="amqp://auto_drama:auto_drama_dev@localhost:5672/", alias="RABBITMQ_URL"
    )
    rabbitmq_exchange: str = Field(default="drama.tasks", alias="RABBITMQ_EXCHANGE")
    rabbitmq_queue: str = Field(default="drama.task.execute", alias="RABBITMQ_QUEUE")
    rabbitmq_routing_key: str = Field(default="task.execute", alias="RABBITMQ_ROUTING_KEY")
    rabbitmq_prefetch_count: int = Field(default=1, alias="RABBITMQ_PREFETCH_COUNT", ge=1)

    # Java owns retry state transitions. This value mirrors the shared MS1
    # policy so local Worker configuration and task creation use the same cap.
    max_retries: int = Field(default=3, alias="MAX_RETRIES", ge=0)

    java_callback_base_url: str = Field(
        default="http://localhost:8080", alias="JAVA_CALLBACK_BASE_URL"
    )
    java_internal_token: str = Field(default="", alias="JAVA_INTERNAL_TOKEN")
    callback_timeout_seconds: float = Field(default=10.0, alias="CALLBACK_TIMEOUT_SECONDS", gt=0)

    text_model_provider: str = Field(default="mock", alias="TEXT_MODEL_PROVIDER")
    text_model_name: str = Field(default="mock-text-v1", alias="TEXT_MODEL_NAME")
    text_model_base_url: str = Field(default="", alias="TEXT_MODEL_BASE_URL")
    text_model_api_key: str = Field(default="", alias="TEXT_MODEL_API_KEY")
    text_model_timeout_seconds: float = Field(
        default=60.0, alias="TEXT_MODEL_TIMEOUT_SECONDS", gt=0
    )
    mock_scenario: str = Field(default="happy_path", alias="MOCK_SCENARIO")

    prompt_version_expander: str = Field(default="v1", alias="PROMPT_VERSION_EXPANDER")
    prompt_version_generator: str = Field(default="v1", alias="PROMPT_VERSION_GENERATOR")
    prompt_version_quality_checker: str = Field(
        default="v1", alias="PROMPT_VERSION_QUALITY_CHECKER"
    )
    prompt_version_rewriter: str = Field(default="v1", alias="PROMPT_VERSION_REWRITER")
    prompt_version_bible_extractor: str = Field(
        default="v1", alias="PROMPT_VERSION_BIBLE_EXTRACTOR"
    )
