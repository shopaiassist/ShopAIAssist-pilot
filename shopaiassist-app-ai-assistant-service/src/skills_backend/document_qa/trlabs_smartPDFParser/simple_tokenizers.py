import re


class TokenizerBase:
    def encode(self, text: str):
        """
        Encodes text into tokens.

        Parameters
        ----------
        text: str
            The text to be encoded.

        Returns
        -------
        list
            A list of tokens.
        """
        pass

    def decode(self, tokens: list):
        """
        Decodes tokens into text.

        Parameters
        ----------
        tokens: list
            A list of tokens.

        Returns
        -------
        str
            The decoded text.
        """
        pass


class DelimiterTokenizer(TokenizerBase):
    """
    This tokenizer splits text into tokens based on a delimiter.
    The default delimiter is a space character.
    """

    def __init__(self, delimiter: str = " "):
        self.delimiter = delimiter

    def encode(self, text: str):
        return text.split(self.delimiter)

    def decode(self, tokens: list):
        return self.delimiter.join(tokens)
