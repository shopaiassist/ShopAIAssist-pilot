import urllib3
import os
import json
from urllib.parse import urlparse
from .layout_reader import Document, DocTree
from typing import Union, List, Tuple, Dict


class LayoutPDFReader:
    """
    Reads PDF content and understands hierarchical layout of the document sections and structural components such as paragraphs, sentences, tables, lists, sublists

    Parameters
    ----------
    parser_api_url: str
        API url for LLM Sherpa. Use customer url for your private instance here

    """

    def __init__(self, parser_api_url):
        """
        Constructs a LayoutPDFReader from a parser endpoint.

        Parameters
        ----------
        parser_api_url: str
            API url for LLM Sherpa. Use customer url for your private instance here
        """
        self.parser_api_url = parser_api_url
        self.download_connection = urllib3.PoolManager()
        self.api_connection = urllib3.PoolManager()

    def _download_pdf(self, pdf_url):
        # some servers only allow browers user_agent to download
        user_agent = (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
        )
        # add authorization headers if using external API (see upload_pdf for an example)
        download_headers = {"User-Agent": user_agent}
        download_response = self.download_connection.request("GET", pdf_url, headers=download_headers)
        file_name = os.path.basename(urlparse(pdf_url).path)
        # note you can change the file name here if you'd like to something else
        if download_response.status == 200:
            pdf_file = (file_name, download_response.data, "application/pdf")
        return pdf_file

    def _parse_pdf(self, pdf_file):
        auth_header = {}
        parser_response = self.api_connection.request("POST", self.parser_api_url, fields={"file": pdf_file})
        return parser_response

    def read_pdf(self, path_or_url, contents=None):
        """
        Reads pdf from a url or path

        Parameters
        ----------
        path_or_url: str
            path or url to the pdf file e.g. https://someexapmple.com/myfile.pdf or /home/user/myfile.pdf
        contents: bytes
            contents of the pdf file. If contents is given, path_or_url is ignored. This is useful when you already have the pdf file contents in memory such as if you are using streamlit or flask.
        """
        # file contents were given
        if contents is not None:
            pdf_file = (path_or_url, contents, "application/pdf")
        else:
            # Improved URL detection - only consider common URL schemes
            is_url = urlparse(path_or_url).scheme.lower() in ["http", "https", "ftp"]
            if is_url:
                pdf_file = self._download_pdf(path_or_url)
            else:
                file_name = os.path.basename(path_or_url)
                with open(path_or_url, "rb") as f:
                    file_data = f.read()
                    pdf_file = (file_name, file_data, "application/pdf")
        parser_response = self._parse_pdf(pdf_file)
        response_json = json.loads(parser_response.data.decode("utf-8"))
        blocks = response_json["return_dict"]["result"]["blocks"]
        return Document(blocks)


class DocTreePDFReader(LayoutPDFReader):
    """
    Reads PDF content and generates a document tree from the document.

    Refer [this](https://github.com/tr/labs_onesource-smartPDFParser) for more details.
    """

    def get_doc_tree(
        self,
        path_or_url: str,
        tokenizer=None,
        file_name: Union[str, None] = None,
        section_only_chunking: bool = True,
        contents=None,
    ):
        """
        Generates a document tree from a PDF file.

        Parameters
        ----------
        `path_or_url`: str
            path or url to the PDF file e.g. https://someexapmple.com/myfile.pdf or /home/user/myfile.pdf
        `tokenizer`: object, optional
            A tokenizer object containing the `encode` and `decode` methods. The `encode` method takes a string as an input and returns a list of tokens. The `decode` method takes a list of tokens as an input and returns a string.
            If not provided, chunking will not be available. But the content of the document in text/html format can still be accessed. Different blocks such as sections, tables can also be accessed.
        `file_name`: str, optional
            The name of the PDF file. If not provided, the file name will be extracted from the `path_or_url` parameter.
        `section_only_chunking`: bool, default True
            If True, then the chunking is done only at the section level. If False, then other blocks such as paragraphs, lists, and tables are also chunked when necessary.
        `contents`: bytes
            contents of the pdf file. If contents is given, `path_or_url` is ignored. This is useful when you already have the pdf file contents in memory such as if you are using streamlit or flask.

        Returns
        -------
        `DocTree`
            The generated document tree object.

        Refer [this](https://github.com/tr/labs_onesource-smartPDFParser) for more details.
        """
        doc = self.read_pdf(path_or_url, contents=contents)

        if file_name is None:
            file_name = os.path.basename(path_or_url)

        doc_tree = DocTree(
            doc=doc, tokenizer=tokenizer, file_name=file_name, section_only_chunking=section_only_chunking
        )
        return doc_tree
