import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock, AsyncMock

from src.main import AIAssistantAPI, create_app


# Mock boto3 client
@pytest.fixture(autouse=True)
def mock_boto3():
    with patch("boto3.client") as mock_client:
        mock_secrets_manager = Mock()
        mock_secrets_manager.get_secret_value.return_value = {
            "SecretString": '{"api_key": "test_key", "chat_model_endpoint": "test_model", "api_version": "2020-09-03"}'
        }
        mock_client.return_value = mock_secrets_manager
        yield mock_client


# Mock OpenaiUtils
@pytest.fixture
def mock_openai_utils():
    with patch("src.openai_utils.OpenaiUtils") as mock_openai:
        mock_instance = Mock()
        mock_instance.get_parameter_from_secret.return_value = {
            "api_key": "test_key",
            "chat_model_endpoint": "test_model",
            "api_version": "2020-09-03",
            "chat_model_name": "test_model_name",
        }
        mock_instance.chat_completion_stream.return_value = AsyncMock()
        mock_openai.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_chat_logger():
    with patch("src.s3_logging.S3Logger") as mock_chat_logger:
        mock_instance = AsyncMock()
        mock_chat_logger.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_count_tokens():
    with patch("src.count_tokens.CountTokens") as mock_count_tokens:
        mock_instance = AsyncMock()
        mock_instance.count_tokens.return_value = 10
        mock_count_tokens.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_load_config():
    return {
        "credentials": {
            "chat_model_secret": "test_secret",
            "region_name": "test_region",
        },
        "model_settings": {
            "num_docs_to_retrieve": 5,
            "model_temperature": 0.7,
        },
        "retrieval_settings": {
            "title_column": "title",
            "text_column": "text",
            "url_column": "url",
            "product_name_column": "Product",
        },
    }


@pytest.fixture
def mock_salesforce_prod_mapping():
    with patch("src.main.load_json_from_S3") as mock_load_json_from_S3:
        mock_load_json_from_S3.return_value = {
            "indirect-tax": {"standard_product_name": "Indirect Tax", "salesforce_product_title": "Indirect Tax"}
        }
        yield mock_load_json_from_S3


@pytest.fixture
def api(mock_load_config, mock_openai_utils, mock_hybrid_llm_rerank, mock_salesforce_prod_mapping):
    return AIAssistantAPI(mock_load_config, mock_openai_utils, mock_salesforce_prod_mapping)


@pytest.fixture
def client(mock_hybrid_llm_rerank, mock_openai_utils, mock_chat_logger, mock_count_tokens):
    with patch("src.main.salesforce_products", return_value=mock_hybrid_llm_rerank), patch(
        "src.main.OpenaiUtils", return_value=mock_openai_utils
    ), patch("src.main.S3Logger", return_value=mock_chat_logger):
        app = create_app()
        return TestClient(app)
