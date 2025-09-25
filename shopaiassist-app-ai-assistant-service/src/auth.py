"""This module provides functionality for authenticating users based on a UDS long token.

The module includes:
- An exception class "UDSLongTokenException" for handling authentication errors.
- An asynchronous "authorize" function that attempts to validate a UDS Long token
  and returns an "Authentication" object upon successful validation.
- An internal asynchronous function "auth" that communicates with the
   authentication API to verify user tokens.

The module relies on several external packages and modules, such as:
- "httpx" for making asynchronous HTTP requests.
- "fastapi.Cookie" for handling cookie-based token retrieval.

Usage of this module assumes the presence of a configuration file that specifies
the  authentication URL under the 'authentication' section.

Example usage:
    uds_long_token = "your_token_here"
    auth = await authorize(uds_long_token)
    if auth:
        print("User authenticated:", auth)
    else:
        print("Authentication failed")

Exception Handling:
    - "UDSLongTokenException" is raised when authentication fails due to an invalid
      token or any other error during the authentication process. The exception
      message provides details about the failure reason.
"""
import json
import urllib.parse
import httpx
from fastapi import Cookie, Header, HTTPException
import logging
import datetime

from src.utils import load_config, parse_x500_string
from src.models import Authentication, BearerToken


config = load_config()


class UDSLongTokenException(Exception):
    """Exception raised for UDSLongToken Authentication errors."""

    pass


class BearerException(Exception):
    """Exception raised for  Bearer Token errors."""

    pass


class GlobalTradeJWTError(Exception):
    """Exception raised for Global Trade JWT Authentication errors."""

    pass


def get_org_id_by_host_product(host_product: str) -> int:
    """Get organization ID based on host product.

    Args:
        host_product (str): The host product identifier.

    Returns:
        int: The organization ID corresponding to the host product.
    """
    host_product_org_mapping = {
        "os": 1,
        "gtm": 2,
        "trust-tax": 3,
    }
    return host_product_org_mapping.get(host_product, 1)  # Default to 1 if not found


async def authorize(
    uds_long_token: str = Cookie(None, alias="UDSLongToken"),
    jwt_token: str = Header(None, alias="Authorization"),
    host_product: str = Header("os", alias="x-host-product"),
    account_type: str = Header("external", alias="x-account-type"),
) -> Authentication | None:
    """Authorize a user based on either UDSLongToken or JWT token.

    This function attempts to authenticate a user using either the UDSLongToken or JWT token.
    It will try both methods and only fail if both authentication methods fail.

    Args:
        uds_long_token (str): The UDS long token used for authentication,
            retrieved from a cookie with the alias "UDSLongToken". Defaults to None.
        jwt_token (str): The JWT token used for authentication,
            retrieved from the Authorization header. Defaults to None.
        host_product (str): The host product identifier ('os', 'trust-tax', or 'gtm'),
            retrieved from the x-host-product header. Defaults to 'os' if not provided.
        account_type (str): The account type ('external' or 'internal'),
            retrieved from the x-account-type header. Defaults to 'external'.

    Returns:
        Authentication: An Authentication object if either token is valid.

    Raises:
        HTTPException: With status code 401 if both authentication methods fail.
    """
    if host_product == "os" or host_product == "trust-tax":
        if uds_long_token:
            try:
                auth = await auth(uds_long_token, host_product)
                logging.info("UDSLongToken authenticated successfully")

                # Anything that isn't "internal" (e.g., "customer") is "external"
                auth.account_type = "external" if account_type.lower() != "internal" else "internal"

                return auth

            except UDSLongTokenException as e:
                err = f"UDSLongToken auth failed: {str(e)}"
                logging.error(err)
                raise HTTPException(status_code=401, detail=err)

        else:
            raise HTTPException(status_code=401, detail="UDSLongToken not provided.")

    elif host_product == "gtm":
        if jwt_token:
            jwt_token = jwt_token.replace("Bearer ", "")
            try:
                auth = await auth_global_trade(jwt_token)
                logging.info("JWT token authenticated successfully")

                # Anything that isn't "internal" (e.g., "customer") is "external"
                auth.account_type = "external" if account_type.lower() != "internal" else "internal"

                return auth
            except GlobalTradeJWTError as e:
                err = f"JWT auth failed: {str(e)}"
                logging.error(err)
                raise HTTPException(status_code=401, detail=err)

        else:
            raise HTTPException(status_code=401, detail="JWT token not provided")

    else:
        raise HTTPException(
            status_code=401, detail="Valid x-host-product not provided. Must be either os, trust-tax, or gtm."
        )


async def auth(uds_long_token: str, host_product: str) -> Authentication:
    """Authenticates a given user in . Add the  user details to the Authentication object.

    :param uds_long_token: The token to authenticate the user in .
    :param _params: The parameters to authenticate the user in . string that needs to be parsed into
        a json object.
    :return: User details on success. Otherwise, False.
    """
    try:
        _auth_api_url = urllib.parse.urljoin(
            f"{config['authentication']['_auth_url']:}/", uds_long_token
        )

        async with httpx.AsyncClient() as client:
            r = await client.get(_auth_api_url)

            logging.debug(f"HTTP Status Code: {r.status_code}")

            if r.status_code != 200:
                raise UDSLongTokenException(f"UDSLongToken auth failed: Received non-200 status code: {r.status_code}")

            if not r.content:
                raise UDSLongTokenException("UDSLongToken auth failed: Received 200 status but with no content.")

            user_details = json.loads(r.content.decode())

            if user_details is None:
                raise UDSLongTokenException("UDSLongToken auth failed: Received empty user details")

            org_id = get_org_id_by_host_product(host_product)
            auth = Authentication(org_id=org_id, **user_details)

            user_details = parse_x500_string(auth.UserX500)
            auth.user_id = user_details.get("uid")
            auth.tenant_id = user_details.get("ou")
            return auth

    except json.JSONDecodeError as e:
        raise UDSLongTokenException("UDSLongToken auth failed: Failed to decode JSON.") from e

    except httpx.RequestError as e:
        raise UDSLongTokenException("UDSLongToken auth failed: HTTP request failed.") from e

    except UDSLongTokenException as e:
        raise e

    except Exception as e:
        raise UDSLongTokenException("UDSLongToken auth failed: An unexpected error occurred.") from e


async def auth_global_trade(jwt_token: str) -> Authentication:
    """Validate Global Trade JWT Token.

    Args:
        jwt_token (str): The JWT token to validate.

    Returns:
        Authentication: An Authentication object if the token is valid.

    Raises:
        GlobalTradeJWTError: If the token is invalid or another error occurs.
    """
    gtm_auth_url = config["authentication"]["global_trade_auth_url"]
    gtm_user_url = config["authentication"]["global_trade_user_url"]
    headers = {"accept": "application/json", "Authorization": f"Bearer {jwt_token}"}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(gtm_auth_url, headers=headers)
            logging.debug(f"HTTP Status Code: {r.status_code}")

            if r.status_code != 200 or r.text != "true":
                raise GlobalTradeJWTError("Invalid token. JWT Auth failed.")

            r = await client.get(gtm_user_url, headers=headers)
            logging.debug(f"User Response: {r.text}")
            if r.status_code == 200:
                user_info = r.json()
                return Authentication(
                    FirstName=user_info["firstName"],
                    LastName=user_info["lastName"],
                    EmailAddress=user_info["email"],
                    Status="Authenticated",
                    UserCategory="GTMUser",
                    org_id=2,
                )
            else:
                raise GlobalTradeJWTError("Authentication Failed: Unable to get user details.")

    except json.JSONDecodeError as e:
        raise GlobalTradeJWTError("JWT auth failed: Failed to decode JSON.") from e

    except httpx.RequestError as e:
        raise GlobalTradeJWTError("JWT auth failed: HTTP request failed.") from e

    except GlobalTradeJWTError as e:
        raise e

    except Exception as e:
        raise GlobalTradeJWTError("JWT auth failed: An unexpected error occurred.") from e


async def request__bearer_token(config: dict) -> tuple[str, int]:
    """Request a bearer token from the  authentication server.

    Args:
        config (dict): The configuration dictionary containing  credentials.

    Returns:
        tuple[str, int]: The bearer token and its expiration time in seconds.
    """
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "client_id": config["authentication"]["jwt_"]["client_id"],
        "client_secret": config["authentication"]["jwt_"]["client_secret"],
        "grant_type": "client_credentials",
    }
    async with httpx.AsyncClient() as client:
        bearer_response = await client.post(config["authentication"]["_jwt_url"], headers=headers, data=data)
        if bearer_response.status_code != 200:
            raise BearerException(
                (
                    "Authentication failed: Received non-200 status code from  jwt server: "
                    f"{bearer_response.status_code}"
                )
            )
        try:
            bearer_response_json = bearer_response.json()
        except BearerException as e:
            raise BearerException(
                "Authentication failed: Invalid JSON response from  \
                                           jwt server."
            ) from e

        if "access_token" not in bearer_response_json:
            raise BearerException(
                "Authentication failed: Access token missing from  \
                                           jwt client response."
            )
    return bearer_response_json["access_token"], bearer_response_json["expires_in"]


async def get__bearer_token(config: dict) -> str:
    """Obtain bearer token to be used for subsequent requests to ML API.

    Args:
        config (dict): The configuration dictionary containing  credentials.

    Returns:
        str: The bearer token.
    """
    # Check if the bearer token is expired, give 1 minute of margin
    if "_BEARER" not in config:
        config["_BEARER"] = BearerToken()
    if datetime.datetime.now() + datetime.timedelta(0, 60) > config["_BEARER"].expiration_date:
        bearer_token, expires_in = await request__bearer_token(config)
        config["_BEARER"].bearer_token = bearer_token
        config["_BEARER"].expiration_date = datetime.datetime.now() + datetime.timedelta(seconds=expires_in)
    else:
        bearer_token = config["_BEARER"].bearer_token
    return bearer_token
