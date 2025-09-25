import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
import json
import datetime

from src.auth import (
    authorize,
    auth_onesource,
    auth_global_trade,
    request_onesource_bearer_token,
    get_onesource_bearer_token,
    UDSLongTokenException,
    ONESOURCEBearerException,
    GlobalTradeJWTError
)
from src.models import Authentication, OnesourceBearerToken


class TestAuthorize:
    """Test cases for the authorize function."""

    @pytest.mark.asyncio
    async def test_authorize_onesource_success(self):
        """Test successful authorization with UDSLongToken for ONESOURCE."""
        mock_auth = Authentication(
            org_id=1,
            FirstName="John",
            LastName="Doe",
            EmailAddress="john.doe@example.com",
            Status="Authenticated",
            OneSourceUserX500="uid=john123,ou=tenant1,dc=example,dc=com"
        )
        
        with patch('src.auth.auth_onesource', return_value=mock_auth) as mock_auth_os:
            result = await authorize(
                uds_long_token="valid_token",
                jwt_token=None,
                host_product="os",
                account_type="External"
            )
            
            assert result == mock_auth
            assert result.account_type == "external"
            mock_auth_os.assert_called_once_with("valid_token", "os")

    @pytest.mark.asyncio
    async def test_authorize_trust_tax_success(self):
        """Test successful authorization with UDSLongToken for Trust Tax."""
        mock_auth = Authentication(
            org_id=3,
            FirstName="Jane",
            LastName="Smith",
            EmailAddress="jane.smith@example.com",
            Status="Authenticated"
        )
        
        with patch('src.auth.auth_onesource', return_value=mock_auth) as mock_auth_os:
            result = await authorize(
                uds_long_token="valid_token",
                jwt_token=None,
                host_product="trust-tax",
                account_type=None
            )
            
            assert result == mock_auth
            assert result.account_type is None
            mock_auth_os.assert_called_once_with("valid_token", "trust-tax")

    @pytest.mark.asyncio
    async def test_authorize_gtm_success(self):
        """Test successful authorization with JWT token for Global Trade."""
        mock_auth = Authentication(
            org_id=2,
            FirstName="Bob",
            LastName="Johnson",
            EmailAddress="bob.johnson@example.com",
            Status="Authenticated",
            UserCategory="GTMUser"
        )
        
        with patch('src.auth.auth_global_trade', return_value=mock_auth) as mock_auth_gtm:
            result = await authorize(
                uds_long_token=None,
                jwt_token="Bearer valid_jwt_token",
                host_product="gtm",
                account_type="Internal"
            )
            
            assert result == mock_auth
            assert result.account_type == "internal"
            mock_auth_gtm.assert_called_once_with("valid_jwt_token")

    @pytest.mark.asyncio
    async def test_authorize_default_host_product(self):
        """Test authorization with default host product."""
        mock_auth = Authentication(org_id=1, Status="Authenticated")
        
        with patch('src.auth.auth_onesource', return_value=mock_auth):
            result = await authorize(
                uds_long_token="valid_token",
                jwt_token=None,
                host_product=None,  # Should default to "os"
                account_type=None
            )
            
            assert result is not None

    @pytest.mark.asyncio
    async def test_authorize_no_uds_token_for_onesource(self):
        """Test authorization failure when no UDS token provided for ONESOURCE."""
        with pytest.raises(HTTPException) as exc_info:
            await authorize(
                uds_long_token=None,
                jwt_token=None,
                host_product="os",
                account_type=None
            )
        
        assert exc_info.value.status_code == 401
        assert "UDSLongToken not provided" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_authorize_no_jwt_token_for_gtm(self):
        """Test authorization failure when no JWT token provided for GTM."""
        with pytest.raises(HTTPException) as exc_info:
            await authorize(
                uds_long_token=None,
                jwt_token=None,
                host_product="gtm",
                account_type=None
            )
        
        assert exc_info.value.status_code == 401
        assert "JWT token not provided" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_authorize_invalid_host_product(self):
        """Test authorization failure with invalid host product."""
        with pytest.raises(HTTPException) as exc_info:
            await authorize(
                uds_long_token="valid_token",
                jwt_token=None,
                host_product="invalid_product",
                account_type=None
            )
        
        assert exc_info.value.status_code == 401
        assert "Valid x-host-product not provided" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_authorize_uds_token_exception(self):
        """Test authorization failure when UDS token authentication fails."""
        with patch('src.auth.auth_onesource', side_effect=UDSLongTokenException("Invalid token")):
            with pytest.raises(HTTPException) as exc_info:
                await authorize(
                    uds_long_token="invalid_token",
                    jwt_token=None,
                    host_product="os",
                    account_type=None
                )
            
            assert exc_info.value.status_code == 401
            assert "UDSLongToken auth failed: Invalid token" in str(exc_info.value.detail)


class TestAuthOnesource:
    """Test cases for the auth_onesource function."""

    @pytest.mark.asyncio
    async def test_auth_onesource_success(self):
        """Test successful ONESOURCE authentication."""
        mock_response_data = {
            "FirstName": "John",
            "LastName": "Doe",
            "EmailAddress": "john.doe@example.com",
            "Status": "Authenticated",
            "OneSourceUserX500": "uid=john123,ou=tenant1,dc=example,dc=com"
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = json.dumps(mock_response_data).encode()
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_onesource("valid_token", "os")
            
            assert result.FirstName == "John"
            assert result.LastName == "Doe"
            assert result.EmailAddress == "john.doe@example.com"
            assert result.org_id == 1
            assert result.user_id == "john123"
            assert result.tenant_id == "tenant1"

    @pytest.mark.asyncio
    async def test_auth_onesource_trust_tax_org_id(self):
        """Test ONESOURCE authentication sets correct org_id for trust-tax."""
        mock_response_data = {
            "FirstName": "Jane",
            "LastName": "Smith",
            "EmailAddress": "jane.smith@example.com",
            "Status": "Authenticated",
            "OneSourceUserX500": "uid=jane456,ou=tenant2,dc=example,dc=com"
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = json.dumps(mock_response_data).encode()
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_onesource("valid_token", "trust-tax")
            
            assert result.org_id == 3

    @pytest.mark.asyncio
    async def test_auth_onesource_non_200_status(self):
        """Test ONESOURCE authentication failure with non-200 status."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            with pytest.raises(UDSLongTokenException) as exc_info:
                await auth_onesource("invalid_token", "os")
            
            assert "Received non-200 status code: 401" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_auth_onesource_empty_content(self):
        """Test ONESOURCE authentication failure with empty content."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b""
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            with pytest.raises(UDSLongTokenException) as exc_info:
                await auth_onesource("valid_token", "os")
            
            assert "Received 200 status but with no content" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_auth_onesource_invalid_json(self):
        """Test ONESOURCE authentication failure with invalid JSON."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"invalid json"
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            with pytest.raises(UDSLongTokenException) as exc_info:
                await auth_onesource("valid_token", "os")
            
            assert "Failed to decode JSON" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_auth_onesource_http_error(self):
        """Test ONESOURCE authentication failure with HTTP error."""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.RequestError("Connection error")
            
            with pytest.raises(UDSLongTokenException) as exc_info:
                await auth_onesource("valid_token", "os")
            
            assert "HTTP request failed" in str(exc_info.value)


class TestAuthGlobalTrade:
    """Test cases for the auth_global_trade function."""

    @pytest.mark.asyncio
    async def test_auth_global_trade_success(self):
        """Test successful Global Trade authentication."""
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.text = "true"
        
        mock_user_response = MagicMock()
        mock_user_response.status_code = 200
        mock_user_response.json.return_value = {
            "firstName": "Bob",
            "lastName": "Johnson",
            "email": "bob.johnson@example.com"
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = [
                mock_auth_response, mock_user_response
            ]
            
            result = await auth_global_trade("valid_jwt_token")
            
            assert result.FirstName == "Bob"
            assert result.LastName == "Johnson"
            assert result.EmailAddress == "bob.johnson@example.com"
            assert result.org_id == 2
            assert result.UserCategory == "GTMUser"

    @pytest.mark.asyncio
    async def test_auth_global_trade_invalid_token(self):
        """Test Global Trade authentication failure with invalid token."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "false"
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            with pytest.raises(GlobalTradeJWTError) as exc_info:
                await auth_global_trade("invalid_token")
            
            assert "Invalid token. JWT Auth failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_auth_global_trade_user_details_failure(self):
        """Test Global Trade authentication failure when getting user details."""
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.text = "true"
        
        mock_user_response = MagicMock()
        mock_user_response.status_code = 500
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = [
                mock_auth_response, mock_user_response
            ]
            
            with pytest.raises(GlobalTradeJWTError) as exc_info:
                await auth_global_trade("valid_token")
            
            assert "Unable to get user details" in str(exc_info.value)


class TestBearerToken:
    """Test cases for bearer token functions."""

    @pytest.mark.asyncio
    async def test_request_onesource_bearer_token_success(self):
        """Test successful bearer token request."""
        mock_config = {
            "authentication": {
                "jwt_onesource": {
                    "client_id": "test_client_id",
                    "client_secret": "test_client_secret"
                },
                "onesource_jwt_url": "https://example.com/token"
            }
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "bearer_token_123",
            "expires_in": 3600
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            token, expires_in = await request_onesource_bearer_token(mock_config)
            
            assert token == "bearer_token_123"
            assert expires_in == 3600

    @pytest.mark.asyncio
    async def test_request_onesource_bearer_token_failure(self):
        """Test bearer token request failure."""
        mock_config = {
            "authentication": {
                "jwt_onesource": {
                    "client_id": "test_client_id",
                    "client_secret": "test_client_secret"
                },
                "onesource_jwt_url": "https://example.com/token"
            }
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 401
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            with pytest.raises(ONESOURCEBearerException) as exc_info:
                await request_onesource_bearer_token(mock_config)
            
            assert "Received non-200 status code" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_onesource_bearer_token_cached(self):
        """Test getting cached bearer token."""
        mock_config = {
            "ONESOURCE_BEARER": OnesourceBearerToken(
                bearer_token="cached_token",
                expiration_date=datetime.datetime.now() + datetime.timedelta(hours=1)
            )
        }
        
        token = await get_onesource_bearer_token(mock_config)
        
        assert token == "cached_token"

    @pytest.mark.asyncio
    async def test_get_onesource_bearer_token_expired(self):
        """Test getting new bearer token when cached token is expired."""
        mock_config = {
            "authentication": {
                "jwt_onesource": {
                    "client_id": "test_client_id",
                    "client_secret": "test_client_secret"
                },
                "onesource_jwt_url": "https://example.com/token"
            },
            "ONESOURCE_BEARER": OnesourceBearerToken(
                bearer_token="expired_token",
                expiration_date=datetime.datetime.now() - datetime.timedelta(hours=1)
            )
        }
        
        with patch('src.auth.request_onesource_bearer_token', return_value=("new_token", 3600)):
            token = await get_onesource_bearer_token(mock_config)
            
            assert token == "new_token"
            assert mock_config["ONESOURCE_BEARER"].bearer_token == "new_token"


# Pytest fixtures for mocking
@pytest.fixture
def mock_config():
    """Fixture providing mock configuration."""
    return {
        "authentication": {
            "onesource_auth_url": "https://example.com/auth/",
            "global_trade_auth_url": "https://gtm.example.com/validate",
            "global_trade_user_url": "https://gtm.example.com/user",
            "onesource_jwt_url": "https://example.com/token",
            "jwt_onesource": {
                "client_id": "test_client_id",
                "client_secret": "test_client_secret"
            }
        }
    }


# Parametrized tests for edge cases
@pytest.mark.parametrize("host_product,expected_org_id", [
    ("os", 1),
    ("trust-tax", 3),
])
@pytest.mark.asyncio
async def test_auth_onesource_org_id_mapping(host_product, expected_org_id):
    """Test that org_id is correctly set based on host_product."""
    mock_response_data = {
        "FirstName": "Test",
        "LastName": "User",
        "EmailAddress": "test@example.com",
        "Status": "Authenticated",
        "OneSourceUserX500": "uid=test,ou=tenant,dc=example,dc=com"
    }
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = json.dumps(mock_response_data).encode()
    
    with patch('httpx.AsyncClient') as mock_client:
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        
        result = await auth_onesource("valid_token", host_product)
        
        assert result.org_id == expected_org_id