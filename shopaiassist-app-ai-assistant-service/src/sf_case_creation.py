"""This module provides functionality for creating support cases in Salesforce using the Boomi API services.

Classes:
    - SFCreateCase: Handles the authentication, validation, and creation of support cases in Salesforce by interacting
      with various endpoints.

Key Features:
    - Initializes with Salesforce configuration and validates the required settings.
    - Retrieves access tokens for PAN validation and case creation.
    - Fetches SAP account numbers based on PAN or firm IDs.
    - Prepares and sends requests to Salesforce to create support cases, logging and handling errors as needed.

Attributes:
    - panvalidation_token_endpoint: The endpoint for obtaining the PAN validation token.
    - panvalidation_endpoint: The endpoint for performing PAN validation.
    - case_token_endpoint: The endpoint for obtaining the case creation token.
    - case_create_endpoint: The endpoint for creating support cases in Salesforce.
    - panvalidation_client_id: Client ID used for PAN validation.
    - panvalidation_client_secret: Client secret used for PAN validation.
    - case_client_id: Client ID used for case creation.
    - case_client_secret: Client secret used for case creation.

Functions:
    - _get_access_token: Retrieves an access token for PAN validation or case creation.
    - _get_SAP_account_number: Obtains the SAP account number for a given PAN or firm ID.
    - _print_prepared_POST: Prints a formatted HTTP POST request for debugging.
    - create_support_case: Creates a support case in Salesforce based on the provided request model.

Dependencies:
    - boto3: For interacting with AWS services to retrieve configuration parameters.
    - requests: For making HTTP requests to Salesforce and other endpoints.
    - src.models: Contains data models for support cases and responses.
    - src.utils: Provides utility functions for configuration loading and string validation.

This module assumes that the Salesforce configuration and secrets are correctly set up and that the Boomi API is
accessible.
"""

import traceback
import logging
import requests  # type: ignore
import json
from src.models import SupportCaseModel, SupportCaseResponse, GST_ValidatePANResponse, BoomiTokenResponse
from src.utils import (
    load_config,
    is_string_blank,
    get_parameter_from_secret,
    load_json_from_S3,
    get_dict_which_has_value,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


config = load_config()


class SFCreateCase:
    """A class to create support cases in Salesforce using Boomi API services.

    The class handles authentication, validation, and the creation of support
    cases by interacting with various Salesforce endpoints.

    Attributes:
        panvalidation_token_endpoint (str): Endpoint for PAN validation token.
        panvalidation_endpoint (str): Endpoint for PAN validation.
        case_token_endpoint (str): Endpoint for case token.
        case_create_endpoint (str): Endpoint for creating cases.
        panvalidation_client_id (str): Client ID for PAN validation.
        panvalidation_client_secret (str): Client secret for PAN validation.
        case_client_id (str): Client ID for case creation.
        case_client_secret (str): Client secret for case creation.
    """

    def __init__(self):
        """Initializes SFCreateCase with Salesforce configuration.

        Raises:
            ValueError: If any required configuration is missing or invalid.
        """
        try:
            salesforce_secrets = get_parameter_from_secret(
                config["salesforce_boomi_settings"]["boomi_secret"], config["credentials"]["region_name"]
            )
            self.panvalidation_token_endpoint = config["salesforce_boomi_settings"]["panvalidation_token_endpoint"]
            if is_string_blank(self.panvalidation_token_endpoint):
                raise ValueError("PAN Validation Token Endpoint is not set in the configuration")
            self.panvalidation_endpoint = config["salesforce_boomi_settings"]["panvalidation_endpoint"]
            if is_string_blank(self.panvalidation_endpoint):
                raise ValueError("PAN Validation Endpoint is not set in the configuration")
            self.case_token_endpoint = config["salesforce_boomi_settings"]["case_token_endpoint"]
            if is_string_blank(self.case_token_endpoint):
                raise ValueError("Case Token Endpoint is not set in the configuration")
            self.case_create_endpoint = config["salesforce_boomi_settings"]["case_create_endpoint"]
            if is_string_blank(self.case_create_endpoint):
                raise ValueError("Case Create Endpoint is not set in the configuration")
            self.panvalidation_client_id = salesforce_secrets["panvalidation_token_client_id"]
            if is_string_blank(self.panvalidation_client_id):
                raise ValueError("Client ID is not set in the configuration")
            self.panvalidation_client_secret = salesforce_secrets["panvalidation_client_secret"]
            if is_string_blank(self.panvalidation_client_secret):
                raise ValueError("Client Secret is not set in the configuration")
            self.case_client_id = salesforce_secrets["case_token_client_id"]
            if is_string_blank(self.panvalidation_client_id):
                raise ValueError("Client ID is not set in the configuration")
            self.case_client_secret = salesforce_secrets["case_client_secret"]
            if is_string_blank(self.panvalidation_client_secret):
                raise ValueError("Client Secret is not set in the configuration")
        except KeyError as e:
            traceback.print_exception(e)
            raise ValueError("Error in reading configuration for: " + e.args[0]) from e

    async def _get_access_token(self, client_id: str, client_secret: str) -> BoomiTokenResponse:
        try:
            # Get the token for PANValidation and Case Creation
            logging.info("Getting PAN validation token")
            url = self.panvalidation_token_endpoint
            data = {"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret}
            response = requests.post(url, data=data)
            tokenValidationResponse = BoomiTokenResponse(**json.loads(response.text))
            if not tokenValidationResponse or not tokenValidationResponse.access_token:
                raise ValueError("PAN Validation token not found")
            print("access_token - ", tokenValidationResponse.access_token)
            return tokenValidationResponse
        except Exception as e:
            traceback.print_exception(e)
            raise ValueError("Error fetching validation token") from e

    async def _get_SAP_account_number(self, pan_number: str, panvalidation_token: str) -> GST_ValidatePANResponse:
        try:
            # Get the SAP account number for the given PAN/Firm ID
            print("Getting SAP account Number for PAN - ", pan_number)
            url = self.panvalidation_endpoint + pan_number + "/GSTProductAccountNumber"
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {panvalidation_token}"}
            response = requests.get(url, headers=headers)
            accountdata = GST_ValidatePANResponse(**json.loads(response.text).get("GST_ValidatePANResponse"))
            if not accountdata or not accountdata.accountNumber:
                raise ValueError("SAP Account number not found")
            print("SAP account_id - ", accountdata.accountNumber)
            return accountdata
        except Exception as e:
            traceback.print_exception(e)
            raise ValueError("Error fetching SAP account number") from e

    def _print_prepared_POST(self, req):
        print(
            "{}\n{}\r\n{}\r\n\r\n{}".format(
                "-----------START-----------",
                req.method + " " + req.url,
                "\r\n".join("{}: {}".format(k, v) for k, v in req.headers.items()),
                req.body,
            )
        )

    async def create_support_case(self, request: SupportCaseModel) -> SupportCaseResponse:
        """Create a support case in Salesforce.

        Args:
            request (SupportCaseModel): The request model containing support case details.

        Raises:
            ValueError: If the support case cannot be created.
        """
        logging.info("Creating support case")

        # Get the token for PANValidation
        panvalidation_token = await self._get_access_token(
            self.panvalidation_client_id, self.panvalidation_client_secret
        )
        # get the SAP account id
        if len(request.firm_id) == 4:
            sap_account_id = await self._get_SAP_account_number(request.firm_id, panvalidation_token.access_token)
        else:
            sap_account_id = GST_ValidatePANResponse(isValidPAN=True, accountNumber=request.firm_id)

        # get the token for case creation
        case_token = await self._get_access_token(self.case_client_id, self.case_client_secret)

        # create the support case in salesforce

        try:
            self.salesforce_prod_mapping = load_json_from_S3(
                config["salesforce_boomi_settings"]["product_mapping_json_path"]
            )
            salesforce_mapping_dict = get_dict_which_has_value(
                self.salesforce_prod_mapping, "standard_product_name", request.product
            )
            if not salesforce_mapping_dict:
                salesforce_mapping_dict = {"salesforce_product_title": request.product}  # default to the product name
                logger.warn("Product not found in salesforce mapping:", request.product)

            url = (
                self.case_create_endpoint
                + "companies/"
                + request.company_id
                + "/accounts/"
                + str(sap_account_id.accountNumber)
                + "/contact/"
                + request.contact_id
                + "/cases"
            )

            headers = {"Content-Type": "text/plain", "Authorization": f"Bearer {case_token.access_token}"}
            params = {"segment": request.segment, "operation": request.operation, "productBrand": request.productBrand}

            payload = {
                "reasonCode": request.reason_id,
                "categoryCode": "",
                "category": "",
                "currentFormUrl": request.currentform_url,
                "queryDescription": "",
                "language": request.language,
                "phone": "",
                "alternateEmailAddress": "",
                "disputeReason": "",
                "invoiceNumbers": "",
                "transcriptDetails": "",
                "contactFirstName": "." if not request.contact_first_name else request.contact_first_name,
                "contactLastName": "." if not request.contact_last_name else request.contact_last_name,
                "contactEmail": request.contact_email,
                "subject": request.case_subject,
                "description": request.case_description,
                "productName": salesforce_mapping_dict["salesforce_product_title"],
            }
            json_req_body = json.dumps(payload)
            http_session = requests.Session()
            req = requests.Request("POST", url, headers=headers, data=json_req_body, params=params)
            # response = requests.request("POST", url, headers=headers, data=payload)
            prepared_request = req.prepare()
            # self.pretty_print_POST(prepared)
            response = http_session.send(prepared_request)
            data = response.json()
            if not data or "code" not in data:
                print("Product sent to salesforce: ", payload["productName"])
                raise ValueError("Salesforce ticket not created. Error: ", data)
            print("Salesforce ticket code: ", data["code"], "Salesforce ticket id: ", data["id"])
            # for some reason, the Boomi API's response for code is the integer ticket ID and the "id" is the ticket
            # code. switching the values in the response to make it easier to read
            response_data = SupportCaseResponse(salesforce_ticket_code=data["id"], salesforce_ticket_id=data["code"])
            return response_data
        except Exception as e:
            traceback.print_exception(e)
            raise ValueError("Error creating support case") from e
