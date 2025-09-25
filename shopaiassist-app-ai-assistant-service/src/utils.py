"""This module provides utility functions for configuration management, caching, and data retrieval from AWS services.

Functions:
    - load_json_from_S3: Loads a JSON object from a specified S3 URI.
    - load_config: Loads configuration settings from a YAML file based on environment variables.
    - is_string_blank: Checks if a given string is blank.
    - _ttl_hash_gen: Generates a hash for implementing time-to-live (TTL) caching.
    - ttl_cache: Decorator function that provides caching with TTL for any callable.
    - get_parameter_from_secret: Retrieves parameters stored in AWS Secrets Manager.
    - get_salesforce_products_in_env: Retrieves Salesforce products available in the current environment.
    - get_dict_which_has_value: Finds a key in a dictionary where a nested dictionary contains a specified value.

Constants:
    - all_intents_and_ticket: A mapping of intents to their ticket creation status and details.

Dependencies:
    - boto3: For interacting with AWS services such as S3 and Secrets Manager.
    - yaml: For parsing YAML configuration files.
    - json: For handling JSON data.
    - logging: For logging error messages.
    - os: For accessing environment variables.
    - functools: Provides utilities for caching.
    - typing: Provides type annotations for function signatures.

This module assumes the presence of environment-specific configuration files and valid AWS credentials for accessing
S3 and Secrets Manager.
"""
import yaml  # type: ignore
import os
from typing import List, Dict, Callable, Any, Union
import boto3
import time
from functools import lru_cache, update_wrapper
import logging
import json
from math import floor


def load_json_from_S3(s3_uri):
    """Load a JSON object from an S3 URI.

    Args:
        s3_uri (str): The S3 URI of the JSON object.

    Returns:
        Dict: The JSON object as a dictionary.
    """
    s3 = boto3.client("s3")
    bucket = s3_uri.split("/")[2]
    key = "/".join(s3_uri.split("/")[3:])
    obj = s3.get_object(Bucket=bucket, Key=key)
    return json.loads(obj["Body"].read().decode("utf-8"))


def load_config():
    """Load configuration from a YAML file based on the environment variables.

    Returns:
        Dict: The configuration settings.
    """
    with open(
        f"configs/config-{os.getenv('techopsEnvironment', 'dev')}-{os.getenv('techopsRegion', 'us-east-1')}.yaml", "r"
    ) as file:
        config = yaml.safe_load(file)

    # Add ONESOURCE JWT "client_id" and "client_secret" to the config
    config["authentication"]["jwt_onesource"] = get_parameter_from_secret(
        config["authentication"]["jwt_onesource_secret"], config["credentials"]["region_name"]
    )

    return config


def is_string_blank(s):
    """Check if a string is blank.

    Args:
        s (str): The string to check.

    Returns:
        bool: True if the string is blank, False otherwise.
    """
    return not (s and s.strip())


def _ttl_hash_gen(seconds: int):
    """Generate a hash for time-to-live caching.

    Args:
        seconds (int): The number of seconds for the TTL.

    Yields:
        int: The current hash value.
    """
    start_time = time.time()

    while True:
        yield floor((time.time() - start_time) / seconds)


def ttl_cache(maxsize: int = 128, typed: bool = False, ttl: int = -1):
    """Cache function with time to live feature.

    Args:
        maxsize (int, optional): Max size of cache. Defaults to 128.
        typed (bool, optional): Whether to use typed cache. Defaults to False.
        ttl (int, optional): Time to live in seconds. Defaults to -1.

    Returns:
        wrapper: Decorated function.
    """
    if ttl <= 0:
        ttl = 86400

    hash_gen = _ttl_hash_gen(ttl)

    def wrapper(func: Callable) -> Callable:
        @lru_cache(maxsize, typed)
        def ttl_func(ttl_hash, *args, **kwargs):
            return func(*args, **kwargs)

        def wrapped(*args, **kwargs) -> Any:
            th = next(hash_gen)
            return ttl_func(th, *args, **kwargs)

        return update_wrapper(wrapped, func)

    return wrapper


# Define for each intent whether a ticket should be created or not.
all_intents_and_ticket = {
    "Unrelated to TR": {"open_ticket": False},
    "Other TR Products": {"open_ticket": False},
    "Unsupported Product": {
        "open_ticket": True,
        "ticket_subject": "",
        "ticket_description": "",
        "ticket_product": "Administration",
    },
    "Ticket": {"open_ticket": True, "ticket_subject": "", "ticket_description": "", "ticket_product": "Administration"},
    "CSM Information": {"open_ticket": False},
    "Media": {"open_ticket": False},
    "PII": {"open_ticket": False},
    "Toxic": {"open_ticket": False},
    "Product Training": {"open_ticket": False},
    "3rd Party": {  # Let the Assistant try to answer and guess the right product
        "open_ticket": True,
        "ticket_subject": "",
        "ticket_description": "",
        "ticket_product": "Administration",
    },
    "API": {  # Let the Assistant try to answer and guess the right product
        "open_ticket": True,
        "ticket_subject": "",
        "ticket_description": "",
        "ticket_product": "Administration",
    },
    "Data Privacy": {"open_ticket": False},
    "How to use ShopAIAssist": {"open_ticket": False},
    "Unsupported feature": {"open_ticket": False},
}


def get_parameter_from_secret(secret_name, region_name="us-east-1"):
    """Retrieve a parameter from AWS Secrets Manager.

    Args:
        secret_name (str): The name of the secret.
        region_name (str, optional): The AWS region name. Defaults to "us-east-1".

    Returns:
        Dict: The secret value as a dictionary.

    Raises:
        Exception: If there is an error retrieving the secret.
    """
    client = boto3.client(service_name="secretsmanager", region_name=region_name)

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except Exception as e:
        logging.error(f"Error retrieving secret: {e}")
        raise e

    return json.loads(get_secret_value_response["SecretString"])


def get_salesforce_products_in_env(
    salesforce_prod_mapping: Dict[str, Dict], current_env: Union[str, None] = None, org_id: int = 1
) -> List[str]:
    """Get Salesforce products available in the current environment.

    Args:
        salesforce_prod_mapping (Dict[str, Dict]): Mapping of Salesforce products.
        current_env (Union[str, None], optional): The current environment. Defaults to None.
        org_id (int, optional): The organization ID. Defaults to 1 (ONESOURCE).

    Returns:
        List[str]: List of Salesforce products available in the current environment.
    """
    # salesforce_prod_mapping is a dictionary with product names as keys and dictionaries with details about each
    # product as values. Return all these "standard_product_name" where the current environment is inside the list
    # "envs_salesforce_mapping".

    if current_env is None:
        current_env = os.getenv("techopsEnvironment", "dev")
    products_with_mapping = []
    for prod in salesforce_prod_mapping.keys():
        org_ids = salesforce_prod_mapping[prod].get("org_ids", [1])
        if current_env in salesforce_prod_mapping[prod]["envs_salesforce_mapping"] and org_id in org_ids:
            products_with_mapping.append(salesforce_prod_mapping[prod]["standard_product_name"])
    return products_with_mapping


def get_dict_which_has_value(dict: Dict[str, Dict], key_name: str, value: str) -> dict[str, str] | None:
    """Get the key of a dictionary that contains a specified value.

    Args:
        dict (Dict[str, Dict]): A dictionary containing dictionaries as values.
        key_name (str): The key name to look for within the nested dictionaries.
        value (str): The value to match.

    Returns:
        str: The key of the dictionary that has the given value.
    """
    for _key, dict_val in dict.items():
        if dict_val[key_name] == value:
            return dict_val
    return None


def parse_x500_string(x500_string):
    """Parse an X.500 string into a dictionary.

    Args:
        x500_string (str): The X.500 string to parse.

    Returns:
        dict: A dictionary containing the parsed key-value pairs.
    """
    if x500_string == "None":
        return {}

    # Split by comma and trim whitespace
    parts = [part.strip() for part in x500_string.split(",")]

    # Create a dictionary from key-value pairs
    return {key.strip(): value.strip() for part in parts for key, value in [part.split("=", 1)]}


def parse_ONESOURCEx500_string(x500_string):
    """Parse an X.500 string into a dictionary."""
    if x500_string == "None":
        return {}

    # Split by comma and trim whitespace
    parts = [part.strip() for part in x500_string.split(",")]

    # Create a dictionary from key-value pairs
    return {key.strip(): value.strip() for part in parts for key, value in [part.split("=", 1)]}
