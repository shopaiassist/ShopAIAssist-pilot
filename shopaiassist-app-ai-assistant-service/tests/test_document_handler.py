import uuid
import pytest
import pandas as pd
from io import BytesIO
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import UploadFile, HTTPException
import xml.etree.ElementTree as ET

from src.skills_backend.document_qa.document_handler import DocumentHandler, FileParseError


@pytest.fixture
def document_handler():
    """Fixture to create a DocumentHandler instance with mocked dependencies."""
    with patch("src.skills_backend.document_qa.document_handler.load_config") as mock_load_config, patch(
        "src.skills_backend.document_qa.document_handler.boto3.client"
    ) as mock_boto3_client, patch(
        "src.skills_backend.document_qa.document_handler.OpenaiUtils"
    ) as mock_openai_utils, patch(
        "src.skills_backend.document_qa.document_handler.DocTreePDFReader"
    ) as mock_pdf_reader:
        #  patch("src.skills_backend.document_qa.document_handler.tiktoken.encoding_for_model") as mock_tokenizer:

        # Configure mocks
        mock_load_config.return_value = {
            "document_qa": {
                "document_upload_dir": "s3://test-bucket/documents",
                "chunk_size": 1000,
                "embedding_model": "text-embedding-ada-002",
                "pdf_parser_url": "http://test-url.com",
            }
        }

        mock_s3 = MagicMock()
        mock_boto3_client.return_value = mock_s3

        mock_openai = MagicMock()
        mock_openai_utils.return_value = mock_openai
        mock_openai.get_embedding.return_value = [0.1, 0.2, 0.3]

        mock_pdf = MagicMock()
        mock_pdf_reader.return_value = mock_pdf

        mock_tokenizer_instance = MagicMock()
        # mock_tokenizer.return_value = mock_tokenizer_instance

        handler = DocumentHandler()

        # Set the mocks as attributes for access in tests
        handler.mock_s3 = mock_s3
        handler.mock_openai = mock_openai
        handler.mock_pdf = mock_pdf
        handler.mock_tokenizer = mock_tokenizer_instance

        yield handler


@pytest.fixture
def mock_upload_file():
    """Fixture to create a mock UploadFile object."""
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test_document.pdf"
    mock_file.file = BytesIO(b"test content")
    mock_file.read = AsyncMock(return_value=b"test content")
    return mock_file


class TestDocumentHandler:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "file_size,file_extension,expected_result,should_raise",
        [
            (5 * 1024 * 1024, ".pdf", True, False),  # Valid PDF file
            (5 * 1024 * 1024, ".xml", True, False),  # Valid XML file
            (15 * 1024 * 1024, ".pdf", None, True),  # File too large
            (5 * 1024 * 1024, ".docx", None, True),  # Unsupported file type
        ],
    )
    async def test_validate_document(
        self, document_handler, mock_upload_file, file_size, file_extension, expected_result, should_raise
    ):
        """Test document validation with various file sizes and types."""
        # Setup
        mock_upload_file.filename = f"test_document{file_extension}"
        mock_upload_file.file.seek = MagicMock()
        mock_upload_file.file.tell = MagicMock(return_value=file_size)

        # Mock the content validation methods
        with patch.object(document_handler, "validate_pdf", return_value=(True, "")) as mock_validate_pdf, patch.object(
            document_handler, "validate_xml", return_value=(True, "")
        ) as mock_validate_xml:
            # Test
            if should_raise:
                with pytest.raises(HTTPException):
                    await document_handler.validate_document(mock_upload_file)
            else:
                result = await document_handler.validate_document(mock_upload_file)
                assert result == expected_result

                # Verify the appropriate validation method was called
                if file_extension == ".pdf" and not should_raise:
                    mock_validate_pdf.assert_called_once_with(mock_upload_file)
                    mock_validate_xml.assert_not_called()
                elif file_extension == ".xml" and not should_raise:
                    mock_validate_xml.assert_called_once_with(mock_upload_file)
                    mock_validate_pdf.assert_not_called()

    @pytest.mark.asyncio
    async def test_validate_pdf_valid(self, document_handler, mock_upload_file):
        """Test PDF validation with a valid PDF file."""
        # Setup - Create a mock for PyPDF2
        mock_pdf_reader = MagicMock()
        mock_pdf_reader.pages = [MagicMock()]

        # Mock PyPDF2 PdfReader
        with patch("PyPDF2.PdfReader", return_value=mock_pdf_reader):
            # Execute
            is_valid, error_message = await document_handler.validate_pdf(mock_upload_file)

            # Assert
            assert is_valid is True
            assert error_message == ""

    @pytest.mark.asyncio
    async def test_validate_pdf_no_pages(self, document_handler, mock_upload_file):
        """Test PDF validation with a PDF file that has no pages."""
        # Setup - Create a mock for PyPDF2
        mock_pdf_reader = MagicMock()
        mock_pdf_reader.pages = []  # No pages

        # Mock PyPDF2 PdfReader
        with patch("PyPDF2.PdfReader", return_value=mock_pdf_reader):
            # Execute
            is_valid, error_message = await document_handler.validate_pdf(mock_upload_file)

            # Assert
            assert is_valid is False
            assert "contains no pages" in error_message

    @pytest.mark.asyncio
    async def test_validate_pdf_error(self, document_handler, mock_upload_file):
        """Test PDF validation with an error during processing."""
        # Mock PyPDF2 PdfReader to raise an exception
        with patch("PyPDF2.PdfReader", side_effect=Exception("Test error")):
            # Execute
            is_valid, error_message = await document_handler.validate_pdf(mock_upload_file)

            # Assert
            assert is_valid is False
            assert "PDF validation failed" in error_message

    @pytest.mark.asyncio
    async def test_validate_xml_valid(self, document_handler, mock_upload_file):
        """Test XML validation with a valid XML file."""
        # Setup - Valid XML content
        mock_upload_file.read.return_value = b"<root><child>Test content</child><child>More content</child></root>"

        # Execute
        is_valid, error_message = await document_handler.validate_xml(mock_upload_file)

        # Assert
        assert is_valid is True
        assert error_message == ""

    @pytest.mark.asyncio
    async def test_validate_xml_malformed(self, document_handler, mock_upload_file):
        """Test XML validation with malformed XML."""
        # Setup - Malformed XML content
        mock_upload_file.read.return_value = b"<root><child>Test content</child><child>More content</root>"

        # Execute
        is_valid, error_message = await document_handler.validate_xml(mock_upload_file)

        # Assert
        assert is_valid is False
        assert "XML syntax error" in error_message

    @pytest.mark.asyncio
    async def test_validate_xml_empty(self, document_handler, mock_upload_file):
        """Test XML validation with empty XML."""
        # Setup - Empty XML content
        mock_upload_file.read.return_value = b"<root></root>"

        # Execute
        is_valid, error_message = await document_handler.validate_xml(mock_upload_file)

        # Assert
        assert is_valid is False
        assert "empty or contains no meaningful content" in error_message

    @pytest.mark.asyncio
    async def test_validate_xml_minimal_content(self, document_handler, mock_upload_file):
        """Test XML validation with minimal content."""
        # Setup - XML with minimal content
        mock_upload_file.read.return_value = b"<root><a>x</a></root>"

        # Execute
        is_valid, error_message = await document_handler.validate_xml(mock_upload_file)

        # Assert
        assert is_valid is False
        assert "empty or contains no meaningful content" in error_message

    @pytest.mark.asyncio
    async def test_validate_xml_invalid_encoding(self, document_handler, mock_upload_file):
        """Test XML validation with invalid encoding."""
        # Setup - Mock a UnicodeDecodeError
        mock_upload_file.read.return_value = b"invalid encoding"
        with patch("xml.etree.ElementTree.fromstring", side_effect=UnicodeDecodeError("utf-8", b"", 0, 1, "invalid")):
            # Execute
            is_valid, error_message = await document_handler.validate_xml(mock_upload_file)

            # Assert
            assert is_valid is False
            assert "invalid character encoding" in error_message

    @pytest.mark.asyncio
    async def test_pdf_embeddings(self, document_handler, mock_upload_file):
        """Test PDF processing and embedding generation."""
        # Setup
        mock_upload_file.filename = "test.pdf"

        # Mock the PDF parser's return values
        doc_tree = MagicMock()
        document_handler.mock_pdf.get_doc_tree.return_value = doc_tree

        chunks = [
            {"start_page": 1, "end_page": 1, "content": "Test content page 1"},
            {"start_page": 2, "end_page": 2, "content": "Test content page 2"},
        ]
        doc_tree.get_chunks.return_value = chunks

        # Mock tempfile and open
        with patch("tempfile.TemporaryDirectory"), patch("os.path.join", return_value="temp/test.pdf"), patch(
            "builtins.open", MagicMock()
        ), patch("os.makedirs"):
            # Execute
            result = await document_handler.pdf_embeddings(mock_upload_file)

            # Assert
            assert isinstance(result, pd.DataFrame)
            assert len(result) == 2  # Two chunks
            assert "open_ai_embeddings" in result.columns
            assert "raw_text" in result.columns
            assert "chunk_id" in result.columns

            # Verify the PDF parser was called correctly
            document_handler.mock_pdf.get_doc_tree.assert_called_once()
            assert document_handler.mock_openai.get_embedding.call_count == 2

    @pytest.mark.asyncio
    async def test_extract_text_from_xml(self, document_handler, mock_upload_file):
        """Test XML text extraction and embedding generation."""
        # Setup
        mock_upload_file.filename = "test.xml"

        # Mock the XML parser
        xml_chunks = [
            {"content": "XML content 1", "file_type": "XML Section 1"},
            {"content": "XML content 2", "file_type": "XML Section 2"},
        ]

        with patch("src.skills_backend.document_qa.document_handler.parse_xml_file", return_value=xml_chunks):
            # Execute
            result = await document_handler.extract_text_from_xml(mock_upload_file)

            # Assert
            assert isinstance(result, pd.DataFrame)
            assert len(result) == 2  # Two chunks
            assert "open_ai_embeddings" in result.columns
            assert "raw_text" in result.columns
            assert "chunk_id" in result.columns
            assert document_handler.mock_openai.get_embedding.call_count == 2

    @pytest.mark.asyncio
    async def test_extract_text_from_xml_invalid_xml(self, document_handler, mock_upload_file):
        """Test handling of invalid XML files."""
        # Setup
        mock_upload_file.filename = "invalid.xml"

        # Mock XML parser to raise ParseError
        with patch(
            "src.skills_backend.document_qa.document_handler.parse_xml_file", side_effect=ET.ParseError("Invalid XML")
        ):
            # Execute & Assert
            with pytest.raises(HTTPException) as exc_info:
                await document_handler.extract_text_from_xml(mock_upload_file)

            assert exc_info.value.status_code == 400
            assert "Invalid XML file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_save_to_s3(self, document_handler):
        """Test saving document data to S3."""
        # Setup
        test_df = pd.DataFrame({"raw_text": ["Test content"], "open_ai_embeddings": [[0.1, 0.2, 0.3]]})

        tenant_id = "test-tenant"
        user_id = "test-user"
        document_id = "test-doc-id"
        filename = "test.pdf"

        # Execute
        result = await document_handler.save_to_s3(test_df, tenant_id, user_id, document_id, filename)

        # Assert
        expected_path = f"s3://test-bucket/tenant_id={tenant_id}/user_id={user_id}/{document_id}_test.pkl"
        assert result == expected_path

        # Verify S3 client was called correctly
        document_handler.mock_s3.upload_fileobj.assert_called_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "s3_response,expected_result",
        [
            ({"Contents": [{"Key": "test-key-1"}, {"Key": "test-key-2"}]}, True),  # Files found and deleted
            ({}, False),  # No files found
        ],
    )
    async def test_delete_from_s3(self, document_handler, s3_response, expected_result):
        """Test deleting document files from S3."""
        # Setup
        tenant_id = "test-tenant"
        user_id = "test-user"
        document_id = "test-doc-id"

        document_handler.mock_s3.list_objects_v2.return_value = s3_response

        # Execute
        result = await document_handler.delete_from_s3(tenant_id, user_id, document_id)

        # Assert
        assert result == expected_result

        # Verify S3 client was called correctly
        document_handler.mock_s3.list_objects_v2.assert_called_once()

        if expected_result:
            # Verify delete_object was called for each key
            assert document_handler.mock_s3.delete_object.call_count == len(s3_response["Contents"])

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "file_extension,expected_exception",
        [
            (".pdf", None),  # Valid PDF
            (".xml", None),  # Valid XML
            (".docx", HTTPException),  # Unsupported type
        ],
    )
    async def test_process_document(self, document_handler, mock_upload_file, file_extension, expected_exception):
        """Test the full document processing workflow."""
        # Setup
        mock_upload_file.filename = f"test_document{file_extension}"
        tenant_id = "test-tenant"
        user_id = "test-user"

        # Mock UUID generation
        test_uuid = "12345678-1234-5678-1234-567812345678"
        with patch("uuid.uuid4", return_value=uuid.UUID(test_uuid)):
            # Mock validation
            with patch.object(document_handler, "validate_document", new_callable=AsyncMock) as mock_validate:
                mock_validate.return_value = True

                # Mock processing methods
                with patch.object(
                    document_handler, "pdf_embeddings", new_callable=AsyncMock
                ) as mock_pdf_process, patch.object(
                    document_handler, "extract_text_from_xml", new_callable=AsyncMock
                ) as mock_xml_process, patch.object(
                    document_handler, "save_to_s3", new_callable=AsyncMock
                ) as mock_save:
                    test_df = pd.DataFrame({"test": ["data"]})
                    mock_pdf_process.return_value = test_df
                    mock_xml_process.return_value = test_df
                    mock_save.return_value = "s3://test-path"

                    # Execute
                    if expected_exception:
                        with pytest.raises(expected_exception):
                            await document_handler.process_document(mock_upload_file, tenant_id, user_id)
                    else:
                        result = await document_handler.process_document(mock_upload_file, tenant_id, user_id)

                        # Assert
                        assert result["document_id"] == test_uuid
                        assert result["filename"] == mock_upload_file.filename
                        assert result["status"] == "success"
                        assert "s3_path" in result

                        # Verify appropriate processing method was called
                        if file_extension == ".pdf":
                            mock_pdf_process.assert_called_once()
                            mock_xml_process.assert_not_called()
                        elif file_extension == ".xml":
                            mock_xml_process.assert_called_once()
                            mock_pdf_process.assert_not_called()

    @pytest.mark.asyncio
    async def test_process_document_error_handling(self, document_handler, mock_upload_file):
        """Test error handling in the document processing workflow."""
        # Setup
        mock_upload_file.filename = "test.pdf"
        tenant_id = "test-tenant"
        user_id = "test-user"

        # Mock validation to raise an exception
        with patch.object(document_handler, "validate_document", side_effect=FileParseError("Test error")):
            # Execute & Assert
            with pytest.raises(HTTPException) as exc_info:
                await document_handler.process_document(mock_upload_file, tenant_id, user_id)

            assert exc_info.value.status_code == 500
            assert "Error processing document" in str(exc_info.value.detail)

        # Test general exception handling
        with patch.object(document_handler, "validate_document", return_value=True), patch.object(
            document_handler, "pdf_embeddings", side_effect=Exception("General error")
        ):
            # Execute & Assert
            with pytest.raises(HTTPException) as exc_info:
                await document_handler.process_document(mock_upload_file, tenant_id, user_id)

            assert exc_info.value.status_code == 500
            assert "Error processing document" in str(exc_info.value.detail)
