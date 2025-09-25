"""Product Support Stream Utilities.

This module provides utility functions to handle streaming responses from the product support API.
"""

from collections.abc import AsyncIterable
import asyncio
import httpx
from src.models import SimpleResponseChunkProductSupport, AIMessage, ResponseChunkProductSupport
from loguru import logger
import json
from typing import Any


async def ingest_response_chunk_product_support(
    response_chunk: ResponseChunkProductSupport, complete_response: ResponseChunkProductSupport
) -> ResponseChunkProductSupport | SimpleResponseChunkProductSupport | None:
    """Ingest a response chunk from the product support model and return a streamable AI message.

    Add also the chunk to the complete response object.

    Args:
        response_chunk (ResponseChunkProductSupport): The response chunk to ingest.
        complete_response (ResponseChunkProductSupport): The complete response object.

    Returns:
        AIMessage | None: A streamable AI message or None.
    """
    if response_chunk.retrieved_urls is not None and complete_response.message:
        complete_response.ai_message = complete_response.message
        complete_response.message = "## message\n" + complete_response.message
        markdown_string = ""
        for item in response_chunk.retrieved_urls:
            title = item["title"]
            url = item["url"]
            markdown_string += f"- [{title}]({url})\n"
        complete_response.retrieved_urls = response_chunk.retrieved_urls
        complete_response.message += "\n## retrieved_urls\n" + markdown_string
        return None
    if response_chunk.open_ticket is not None:
        complete_response.message += "\n## open_ticket"
        if (
            response_chunk.open_ticket
            and response_chunk.ticket_subject
            and response_chunk.ticket_description
            and response_chunk.ticket_product
        ):
            complete_response.message += (
                "\n|Key | Value|"
                + "\n|---|---|"
                + "\n|case_subject |"
                + response_chunk.ticket_subject
                + "|"
                + "\n|case_description|"
                + response_chunk.ticket_description
                + "|"
                + "\n|product|"
                + response_chunk.ticket_product
                + "|"
            )
            complete_response.open_ticket = True
            complete_response.ticket_subject = response_chunk.ticket_subject
            complete_response.ticket_description = response_chunk.ticket_description
            complete_response.ticket_product = response_chunk.ticket_product
        else:
            complete_response.open_ticket = False
        return complete_response
    if response_chunk.reformulated_query is not None:
        complete_response.reformulated_query_raw = response_chunk.reformulated_query
        complete_response.reformulated_query = "## reformulated_query\n" + str(response_chunk.reformulated_query)
        return complete_response

    if response_chunk.message:
        simple_response_chunk = SimpleResponseChunkProductSupport(
            id=complete_response.id, message=response_chunk.message
        )
        complete_response.message += response_chunk.message
        return simple_response_chunk
    return None


async def fetch_data(
    url: str,
    headers: dict[str, str],
    data: dict[str, Any],
    complete_response: ResponseChunkProductSupport,
) -> AsyncIterable[str | None]:
    """Fetch data from the given URL using HTTP POST method and stream the response.

    Args:
        url (str): The URL to send the request to.
        headers (dict[str, str]): The headers to include in the request.
        data (dict[str, Any]): The data to include in the request body.

    Returns:
        AsyncIterable[AIMessage | None]: An asynchronous iterable of AIMessage or None.
    """
    logger.debug(f"Product Support request\n: {data}")
    async with httpx.AsyncClient(timeout=180) as client:
        async with client.stream("POST", url, headers=headers, json=data) as response:
            if response.status_code == 200:
                buffer = ""
                async for chunk in response.aiter_bytes():
                    logger.debug(f"ONESOURCE response chunk: {chunk.decode('utf-8')}")
                    buffer += chunk.decode("utf-8")

                    # Process each complete line in the buffer
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        if not line:
                            continue

                        try:
                            resp_json = json.loads(line)
                            response_chunk = ResponseChunkProductSupport(**resp_json)
                            streamable_response = await ingest_response_chunk_product_support(
                                response_chunk=response_chunk,
                                complete_response=complete_response,
                            )

                            # If we have a streamable response, yield it immediately
                            # and ensure it's flushed to the client
                            if streamable_response:
                                yield streamable_response.model_dump_json()
                                # Force a small delay to ensure chunks are sent separately
                                await asyncio.sleep(0.01)
                        except json.JSONDecodeError:
                            logger.error(f"Failed to parse JSON from ONESOURCE: {line}")
                            continue

                # Process any remaining data in the buffer
                if buffer:
                    try:
                        resp_json = json.loads(buffer)
                        response_chunk = ResponseChunkProductSupport(**resp_json)
                        streamable_response = await ingest_response_chunk_product_support(
                            response_chunk=response_chunk,
                            complete_response=complete_response,
                        )
                        if streamable_response:
                            yield streamable_response.model_dump_json()
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse JSON from ONESOURCE: {buffer}")
            else:
                yield AIMessage(message="Sorry, something went wrong. Please try again.").model_dump_json()
