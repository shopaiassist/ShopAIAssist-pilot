"""Chat Summarization Module.

This module provides a function to summarize a chat conversation by generating a title based on the content
of the messages.
"""
from loguru import logger
from typing import List
from src.models import ChatMessage


async def summarize_chat(openai_chat, chat_history: List[ChatMessage]) -> str:
    """Summarize the chat conversation by generating a title based on the content of the messages.

    Args:
        openai_chat: The OpenAI chat client instance.
        chat_history (List[ChatMessage]): The chat history to be summarized.

    Returns:
        str: The generated title for the chat conversation.
    """
    system_prompt = """You are a conversation naming assistant. Your task is to review the messages sent so far and \
        respond just with a brief title based on the content of the conversation.

Follow these instructions when composing a response:
1. Keep the title brief, use as few words as possible while still providing enough information to distinguish the \
    content of this conversation from other conversations.
2. Return your response as plain text, do not enclose it in quotation marks (even if it is a citation).
3. Keep the title in the same language as the message sent.
4. Make sure the response is appropriate and professional, avoiding any offensive or inappropriate language."""
    messages = [
        {"role": "system", "content": system_prompt},
    ]
    # Process the first 5 messages from chat history
    messages.extend(message.model_dump() for message in chat_history[:5])

    response = None
    try:
        response = await openai_chat.chat_completion(
            messages=messages,
            model="gpt-4o",
            temperature=0.0,
        )
        title: str = response[0].choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error in summarize_chat: {e}")
        if response:
            logger.error(f"OpenAI response content: {response.choices[0].message.content}")
            logger.error(f"OpenAI finish reason: {response.choices[0].finish_reason}")
        title = ""

    return title
