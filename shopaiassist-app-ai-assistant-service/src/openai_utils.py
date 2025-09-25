"""Utilities for interacting with OpenAI's API via Azure, focusing on chat completions and text embeddings.

Classes:
    - OpenaiUtils: A utility class that handles authentication with OpenAI via Azure and provides methods for chat
    completions and retrieving embeddings.

Functions:
    - authenticate_openai: Authenticates and initializes the OpenAI client for chat models.
    - authenticate_openai_embedding: Authenticates and initializes the OpenAI client for embedding models.
    - get_parameter_from_secret: Retrieves configuration parameters from AWS Secrets Manager.
    - chat_completion: Performs chat completions with specified parameters and returns the response and token count.
    - chat_completion_stream: Performs streaming chat completions and yields parts of the response.
    - get_embedding: Retrieves text embeddings using specified OpenAI models.

Dependencies:
    - boto3: For accessing AWS Secrets Manager.
    - openai: For interacting with OpenAI's models via Azure.
    - tenacity: For retry logic in API requests.
    - src.utils: Custom utility functions for loading configurations and caching.
    - src.count_tokens: A module for counting tokens in messages.

The module relies on environment-specific configurations loaded from secrets and assumes the presence of specific
models and credentials.
"""
from typing import Dict, List, Optional, Any, Tuple, AsyncGenerator
from loguru import logger
import boto3
from openai import AsyncAzureOpenAI, AzureOpenAI
from tenacity import retry, stop_after_attempt, wait_random_exponential
import json
from src.utils import load_config, ttl_cache
from src import count_tokens


class OpenaiUtils:
    """Utility class for interacting with OpenAI's API via Azure.

    This class handles authentication and provides methods to perform chat
    completions and retrieve embeddings using OpenAI models.
    """

    def __init__(self):
        """Initializes OpenaiUtils with configurations and authenticates OpenAI."""
        self.models = {
            "gpt-4": "gpt-4",
        }
        self.ct = count_tokens.CountTokens()
        self.config = load_config()
        self.authenticate_openai()
        self.authenticate_openai_embedding()

    @ttl_cache(ttl=1800)
    def authenticate_openai_embedding(self):
        """Authenticate with Azure OpenAI for embedding models.

        Retrieves secrets from AWS Secrets Manager and initializes the
        AzureOpenAI client for embedding models.
        """
        embedding_model_secrets = self.get_parameter_from_secret(
            self.config["credentials"]["embedding_model_secret"],
            self.config["credentials"]["region_name"],
        )
        OPENAI_API_KEY = embedding_model_secrets["api_key"]
        api_version = embedding_model_secrets["api_version"]
        azure_endpoint = embedding_model_secrets["embedding_model_endpoint"]
        self.openai_sync_client = AzureOpenAI(
            api_key=OPENAI_API_KEY, api_version=api_version, azure_endpoint=azure_endpoint
        )

    @ttl_cache(ttl=1800)
    def authenticate_openai(self):
        """Authenticate with Azure OpenAI for chat models.

        Retrieves secrets from AWS Secrets Manager and initializes the
        AsyncAzureOpenAI client for chat models.
        """
        chat_model_secret = self.get_parameter_from_secret(
            self.config["credentials"]["chat_model_secret"],
            self.config["credentials"]["region_name"],
        )
        OPENAI_API_KEY = chat_model_secret["api_key"]
        api_version = chat_model_secret["api_version"]
        azure_endpoint = chat_model_secret["chat_model_endpoint_gpt-4.1"]
        self.openai_client = AsyncAzureOpenAI(
            api_key=OPENAI_API_KEY, api_version=api_version, azure_endpoint=azure_endpoint
        )

    def get_parameter_from_secret(self, secret_name, region_name="us-east-1"):
        """Retrieve secrets from AWS Secrets Manager.

        Args:
            secret_name (str): The name of the secret to retrieve.
            region_name (str, optional): The AWS region. Defaults to "us-east-1".

        Returns:
            dict: The secret as a dictionary.

        Raises:
            Exception: If there is an error retrieving the secret.
        """
        try:
            # Create a Secrets Manager client
            client = boto3.client(service_name="secretsmanager", region_name=region_name)
            get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        except Exception as e:
            print(f"Error retrieving secret: {e}")
            raise

        return json.loads(get_secret_value_response["SecretString"])

    @retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
    async def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str = "gpt-4",
        temperature: float = 0.0,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Any = None,
    ) -> Tuple[Any, int]:
        """Perform a chat completion with OpenAI models.

        Args:
            messages (List[Dict[str, Any]]): The list of messages for the chat.
            model (str, optional): The model to use. Defaults to "gpt-4".
            temperature (float, optional): The sampling temperature. Defaults to 0.0.
            tools (Optional[List[Dict[str, Any]]], optional): A list of tools to use. Defaults to None.
            tool_choice (Any, optional): Specific tool choice. Defaults to None.

        Returns:
            Tuple[Any, int]: The response from the model and the token count.
        """
        token_count = await self.ct.get_count_tokens(messages, tools or [])

        try:
            self.authenticate_openai()
            response = await self.openai_client.chat.completions.create(
                model=model,
                temperature=temperature,
                messages=messages,
                stream=False,
                tools=tools,
                tool_choice=tool_choice,
            )
        except Exception as e:
            logger.error(f"Error in chat_completion: {e}")

        return response, token_count

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, Any]],
        model: str = "gpt-4",
        temperature: float = 0.0,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[str, None]:
        """Perform a streaming chat completion with OpenAI models.

        Args:
            messages (List[Dict[str, Any]]): The list of messages for the chat.
            model (str, optional): The model to use. Defaults to "gpt-4".
            temperature (float, optional): The sampling temperature. Defaults to 0.0.
            tools (Optional[List[Dict[str, Any]]], optional): A list of tools to use. Defaults to None.

        Yields:
            str: The content of each message part from the stream.
        """
        try:
            stream = await self.openai_client.chat.completions.create(
                model=model, temperature=temperature, messages=messages, stream=True, tools=tools
            )
            async for resp in stream:
                try:
                    content = resp.choices[0].delta.content or ""
                    yield content
                except Exception as e:
                    logger.error(f"Error in chat_completion_stream: {e}")
        except Exception as e:
            logger.error(f"Error in chat_completion_stream: {e}")

    @retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
    def get_embedding(self, text: str, model="text-embedding-ada-002") -> List[float]:
        """Retrieve embeddings for a given text using OpenAI models.

        Args:
            text (str): The text to embed.
            model (str, optional): The embedding model to use. Defaults to "text-embedding-ada-002".

        Returns:
            List[float]: The embedding vector.
        """
        try:
            self.authenticate_openai_embedding()
            response = self.openai_sync_client.embeddings.create(
                model=model,
                input=[text],
            )
        except Exception as e:
            logger.error(f"Error in get_embedding: {e}")

        return response.data[0].embedding
