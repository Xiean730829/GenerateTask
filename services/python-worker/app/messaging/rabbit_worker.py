from __future__ import annotations

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from app.workers.script_worker import ScriptWorker


class RabbitScriptWorker:
    def __init__(
        self,
        url: str,
        exchange_name: str,
        queue_name: str,
        routing_key: str,
        prefetch_count: int,
        worker: ScriptWorker,
    ) -> None:
        self.url = url
        self.exchange_name = exchange_name
        self.queue_name = queue_name
        self.routing_key = routing_key
        self.prefetch_count = prefetch_count
        self.worker = worker

    async def run(self) -> None:
        connection = await aio_pika.connect_robust(self.url)
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=self.prefetch_count)
        exchange = await channel.declare_exchange(
            self.exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )
        queue = await channel.declare_queue(self.queue_name, durable=True)
        await queue.bind(exchange, routing_key=self.routing_key)

        async with queue.iterator() as messages:
            async for message in messages:
                await self._handle(message)

    async def _handle(self, message: AbstractIncomingMessage) -> None:
        async with message.process(requeue=False):
            await self.worker.process(message.body)
