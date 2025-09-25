"""Product Support Skill.

This module provides a function to generate a product support response based on the user's message.
It uses the OpenAI API to summarize the chat and fetch data from the product support API.
"""

import uuid
from datetime import datetime, timezone
from typing import AsyncIterable, List, Dict, Optional
from src.models import (
    UserMessageRequest,
    ResponseChunkProductSupport,
    Authentication,
    ChatMetadata,
    HumanMessage,
)
from src.auth import get_onesource_bearer_token
from src.skills_backend.product_support.stream_utils import fetch_data
from src.db import ChatManagement


def format_message_with_markdown(
    message: str,
    ticket_info: Dict[str, str],
    retrieved_urls: Optional[List[Dict[str, str]]] = None,
    open_ticket: Optional[bool] = None,
) -> str:
    """Format a message with markdown headers similar to product support.

    Args:
        message (str): The original message content.
        ticket_info (Dict[str, str]): Prepopulated information about the support ticket.
        retrieved_urls (Optional[List[Dict[str, str]]]): List of retrieved URLs.
        reformulated_query (Optional[str]): The reformulated query.
        ticket_info (Optional[SupportCaseModel]): Ticket information.

    Returns:
        str: Formatted message with markdown headers.
    """
    if message.startswith("## message"):
        return message

    formatted_message = "## message\n" + message

    # Add retrieved URLs if available
    if retrieved_urls:
        markdown_string = ""
        for item in retrieved_urls:
            title = item["title"]
            url = item["url"]
            markdown_string += f"- [{title}]({url})\n"
        formatted_message += "\n## retrieved_urls\n" + markdown_string

    # Add ticket information if available
    if open_ticket is not None:
        formatted_message += "\n## open_ticket"
        if (
            open_ticket
            and "case_subject" in ticket_info
            and "case_description" in ticket_info
            and "product" in ticket_info
        ):
            formatted_message += (
                "\n|Key | Value|"
                + "\n|---|---|"
                + "\n|case_subject |"
                + ticket_info["case_subject"]
                + "|"
                + "\n|case_description|"
                + ticket_info["case_description"]
                + "|"
                + "\n|product|"
                + ticket_info["product"]
                + "|"
            )

    return formatted_message


async def product_support(
    chat: ChatMetadata,
    user_message_req: UserMessageRequest,
    products: List[str],
    auth: Authentication,
    config: dict,
    openai_chat,
    chat_mngmt: ChatManagement,
) -> AsyncIterable:
    """Generate a product support response based on the user's message.

    Args:
        chat (ChatMetadata): The chat metadata containing information about the conversation.
        user_message_req (str): The user's message requesting product support.
        auth (Authentication): The authentication object.
        config (dict): The configuration dictionary containing API URLs and keys.
        openai_chat: The OpenAI chat object for generating responses.

    Returns:
        AsyncIterable: A stream of product support responses.
    """
    user_query_id, bot_resp_id = str(uuid.uuid4()), str(uuid.uuid4())
    data = {
        "query": user_message_req.user_message.message,
        # Convert to list of dicts for JSON serializability
        "chat_history": [hist_item.model_dump() for hist_item in user_message_req.chat_history],
        "products": products,
        "internal": True if auth.account_type == "internal" else False,
        "chat_id": str(chat.id),
        "user_query_id": user_query_id,
        "bot_resp_id": bot_resp_id,
        "document_id": user_message_req.user_message.document_id,
        "search_scope": user_message_req.user_message.search_scope,
        "user_id": auth.user_id,
        "tenant_id": auth.tenant_id,
        "email_address": auth.EmailAddress,
    }

    await chat_mngmt.log_product_support_query(chat, data, user_message_req, auth, chat_mngmt.conn_write)

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + await get_onesource_bearer_token(config),
    }
    complete_response = ResponseChunkProductSupport(id=bot_resp_id, user_query_id=user_query_id)
    complete_response.chat_title = chat.name

    # Send back first user message
    yield HumanMessage(
        id=user_query_id,
        message=user_message_req.user_message.message,
        sent_time=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    ).model_dump_json()

    async for line in fetch_data(
        # config["ml_api"]["onesource_product_support_url"] + "/product_support",
        config["ml_api"]["onesource_product_support_url"] + "/entry_router",
        headers,
        data,
        complete_response,
    ):
        if line:
            yield line

    # Log response after completion
    await chat_mngmt.log_product_support_ai_response(
        chat, data, user_message_req, complete_response, auth, chat_mngmt.conn_write
    )
