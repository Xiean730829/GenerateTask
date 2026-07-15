from __future__ import annotations

import asyncio

from app.callbacks import CallbackClient
from app.config import Settings
from app.messaging import RabbitScriptWorker
from app.model_adapters.text import MockTextAdapter
from app.prompt_service import ScriptPipeline
from app.workers import ScriptWorker


def build_worker(settings: Settings) -> RabbitScriptWorker:
    if settings.text_model_provider != "mock":
        raise RuntimeError("MS1 currently supports TEXT_MODEL_PROVIDER=mock only")
    adapter = MockTextAdapter(settings.mock_scenario)
    pipeline = ScriptPipeline(
        adapter,
        prompt_versions={
            "scriptExpander": settings.prompt_version_expander,
            "scriptGenerator": settings.prompt_version_generator,
            "scriptQualityChecker": settings.prompt_version_quality_checker,
            "scriptRewriter": settings.prompt_version_rewriter,
            "storyBibleExtractor": settings.prompt_version_bible_extractor,
        },
    )
    callback = CallbackClient(
        settings.java_callback_base_url,
        settings.java_internal_token,
        settings.callback_timeout_seconds,
    )
    worker = ScriptWorker(pipeline, callback, settings.worker_id, "ms1")
    return RabbitScriptWorker(
        settings.rabbitmq_url,
        settings.rabbitmq_exchange,
        settings.rabbitmq_queue,
        settings.rabbitmq_routing_key,
        settings.rabbitmq_prefetch_count,
        worker,
    )


def main() -> None:
    asyncio.run(build_worker(Settings()).run())


if __name__ == "__main__":
    main()
