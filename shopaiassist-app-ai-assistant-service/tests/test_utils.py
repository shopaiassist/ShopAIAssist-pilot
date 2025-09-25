from src.utils import ttl_cache, is_string_blank, get_salesforce_products_in_env, get_dict_which_has_value


@ttl_cache(ttl=1)
def dummy_function():
    return 42


def test_ttl_cache():
    assert dummy_function() == 42
    assert dummy_function() == 42  # return cached value


def test_is_string_blank():
    assert is_string_blank("") is True
    assert is_string_blank("  ") is True
    assert is_string_blank("Hello") is False


def test_get_salesforce_products_in_env():
    salesforce_prod_mapping = {
        "ProductA": {"standard_product_name": "Standard Product A", "envs_salesforce_mapping": ["dev", "prod"]},
        "ProductB": {"standard_product_name": "Standard Product B", "envs_salesforce_mapping": ["dev", "qa"]},
        "ProductC": {"standard_product_name": "Standard Product C", "envs_salesforce_mapping": ["prod"]},
        "ProductD": {"standard_product_name": "Standard Product D", "envs_salesforce_mapping": ["dev", "prod"], "org_ids": [2]},
        "ProductE": {"standard_product_name": "Standard Product E", "envs_salesforce_mapping": ["dev", "qa"], "org_ids": [1]},
        "ProductF": {"standard_product_name": "Standard Product F", "envs_salesforce_mapping": ["prod"], "org_ids": [1]},
    }
    assert get_salesforce_products_in_env(salesforce_prod_mapping, current_env="dev") == [
        "Standard Product A",
        "Standard Product B",
        "Standard Product E",
    ]
    assert get_salesforce_products_in_env(salesforce_prod_mapping, current_env="prod") == [
        "Standard Product A",
        "Standard Product C",
        "Standard Product F",
    ]
    assert get_salesforce_products_in_env(salesforce_prod_mapping, current_env="dev", org_id=1) == [
        "Standard Product A",
        "Standard Product B",
        "Standard Product E",
    ]
    assert get_salesforce_products_in_env(salesforce_prod_mapping, current_env="prod", org_id=2) == [
        "Standard Product D"
    ]


def test_get_dict_which_has_value():
    dictionary = {
        "key1": {"name": "John", "age": 25},
        "key2": {"name": "Jane", "age": 30},
        "key3": {"name": "Bob", "age": 35},
    }
    assert get_dict_which_has_value(dictionary, "name", "Jane") == dictionary["key2"]
    assert get_dict_which_has_value(dictionary, "age", 35) == dictionary["key3"]
    assert get_dict_which_has_value(dictionary, "name", "Alice") is None
    assert get_dict_which_has_value(dictionary, "age", 40) is None
