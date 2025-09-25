"""Module providing functionality for counting the number of tokens in messages and tools using the tiktoken library.

The module includes a `CountTokens` class that provides methods to:
- Count tokens in a list of messages.
- Count tokens in a list of tools.
- Calculate the total number of tokens used by both messages and tools.

The tokenization process is managed through the `tiktoken` library, specifically using the 'o200k_base' encoding. This
is useful for applications that need to estimate or manage the token usage, such as in natural language processing
tasks where token limits are imposed by APIs.

Classes:
    CountTokens: A class to encapsulate the token counting logic.

Example usage:
    counter = CountTokens()
    messages = [{"content": "Hello world", "name": "greeting"}]
    tools = [{"function": {"name": "example_tool", "description": "Example tool",
            "parameters": {"param1": {"type": "string", "description": "A parameter"}}}}]
    num_tokens = await counter.get_count_tokens(messages, tools)
    print(f"Total tokens used: {num_tokens}")

Dependencies:
    - tiktoken: A library for text encoding and token counting.

This module assumes that the message and tool inputs are structured as dictionaries with specific keys,
such as 'content', 'name', and 'description'.
"""
import tiktoken


class CountTokens:
    """A class to count the number of tokens used in messages and tools.

    This class utilizes the tiktoken library to encode text and calculate the
    number of tokens used in a given set of messages or tools.
    """

    def __init__(self):
        """Initializes CountTokens with a specific encoding.

        The encoding is set to 'o200k_base', which is used for tokenization
        of messages and tools.
        """
        # cl100k_base = tiktoken.get_encoding("cl100k_base")
        # Models covered: gpt-4, gpt-3.5-turbo, text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
        cl200k_base = tiktoken.get_encoding("o200k_base")
        self.encoding = cl200k_base

    async def num_tokens_from_messages(self, messages):
        """Calculate the number of tokens used by a list of messages.

        Args:
            messages (list): A list of message dictionaries to be tokenized.

        Returns:
            int: The total number of tokens used by the messages.
        """
        # Refer sample notebook from openai for logic:
        # https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
        tokens_per_message = 3
        tokens_per_name = 1
        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += len(self.encoding.encode(value))
                if key == "name":
                    num_tokens += tokens_per_name
        num_tokens += 3
        return num_tokens

    async def count_tools(self, tools):
        """Calculate the number of tokens used by a list of tools.

        Args:
            tools (list): A list of tool dictionaries, each containing a function with parameters.

        Returns:
            int: The total number of tokens used by the tools.
        """
        tokens_per_tool = 3
        num_tokens = 0
        for tool in tools:
            num_tokens += tokens_per_tool
            for key, value in tool["function"].items():
                if key == "name" or key == "description":
                    num_tokens += len(self.encoding.encode(value))
                if key == "parameters":
                    num_tokens += 2
                    for _param_key, param_value in value["properties"].items():
                        for param_key_1, param_value_1 in param_value.items():
                            if param_key_1 == "type":
                                pass
                            if param_key_1 == "description":
                                num_tokens += len(self.encoding.encode(param_value_1))

        return num_tokens

    async def get_count_tokens(self, messages, tools):
        """Calculate the total number of tokens used by messages and tools combined.

        Args:
            messages (list): A list of message dictionaries to be tokenized.
            tools (list): A list of tool dictionaries, each containing a function with parameters.

        Returns:
            int: The total number of tokens used by both the messages and tools.
        """
        num_tokens = await self.num_tokens_from_messages(messages)
        num_tokens += await self.count_tools(tools)
        return num_tokens
