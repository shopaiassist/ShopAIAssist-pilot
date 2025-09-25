"""Data models for managing Salesforce-related operations and user feedback.

This module defines various data models using Pydantic.

Classes:
    SalesforceProducts: Represents the products available in Salesforce, with an option to refresh the list.
    SupportCaseModel: Defines the structure for a Salesforce support case, including product and user information.
    SupportCaseResponse: Represents the response model for a Salesforce support ticket, containing ticket code and ID.
    FeedbackResponse: Represents the model for feedback responses, indicating if feedback was received.
    GST_ValidatePANResponse: Represents response model for validating GST PAN, including validity and account number.
    BoomiTokenResponse: Represents the response model for Boomi tokens, detailing API product list and token details.
    FeedbackModel: Captures user feedback, including symbols, chat details, and user comments.
    Authentication: Represents user authentication details, including session information and IP-related data.

Dependencies:
    - pydantic: Used for defining data models with type validation.
    - typing: Provides type annotations for list and other types.
    - datetime: Handles date and time-related attributes.
"""
from pydantic import BaseModel, Field
from typing import List, Union, Dict, Optional, Any, Literal
from datetime import datetime, timezone
import uuid
from enum import Enum


class SHOPAIASSISTBearerToken(BaseModel):
    """Model representing the SHOPAIASSIST bearer token and its expiration date."""

    bearer_token: str = ""
    expiration_date: datetime = datetime.min


class SalesforceProducts(BaseModel):
    """Represents the products available in Salesforce.

    Attributes:
        products (List[str]): A list of product names.
        refresh (bool): Indicates if the product list should be refreshed.
    """

    products: List[str]
    refresh: bool = False


class SupportCaseModel(BaseModel):
    """Represents the Salesforce support ticket model.

    Attributes:
        segment             (str): The source product for which the support case is for.    Allowed value - SHOPAIASSIST
        source              (str): Related to the segment.                                  Allowed value -
                                                                                                    SHOPAIASSIST
        company_id          (str): Company identifier used for Boomi/Salesforce access?     Allowed value - TA78
        business_unit       (str): Represents the business unit in Salesforce.              Allowed value -
                                                                                                    TAXPROFESSIONAL
        operation           (str): The type of api operation.                               Allowed value - CREATECASE
        reason_id           (str): The reason for the support ticket create.                Allowed value -
                                                                                                    SHOPAIASSISTREASON01
        language            (str): ISO Language code.                                       Allowed value - en-us
        currentform_url     (str): Represents a link to the UI form. Not used now.          Allowed value - SHOPAIASSIST
        contact_id          (str): A Salesforce contact id.                                 Allowed value -
                                                                                                    SHOPAIASSIST
        firm_id             (str): The PAN Numberor SAP account numbe that represents customer's firm   User based
        product             (str): The product for which the support case is for.           User based
        contact_first_name  (str): The first name of the logged on user.                    User based - Obtained from
                                                                                                    UDS authentication
        contact_last_name   (str): The last name of the logged on user.                     User based - Obtained from
                                                                                                    UDS authentication
        contact_email       (str): Email address of the logged on user.                     User based - Obtained from
                                                                                                    UDS authentication
        case_subject        (str): The subject of the support case.                         Used based
        case_description    (str): The description/details for the support case.            User based
    """

    segment: str = "SHOPAIASSIST"
    source: str = "SHOPAIASSIST"
    company_id: str = "TA78"
    business_unit: str = "TAXPROFESSIONAL"
    operation: str = "CREATECASE"
    reason_id: str = "SHOPAIASSISTREASON01"
    language: str = "en-us"
    currentform_url: str = "SHOPAIASSIST"
    contact_id: str = "SHOPAIASSIST"
    productBrand: str = "SHOPAIASSIST"
    firm_id: str 
    product: str 
    contact_first_name: str = "None"
    contact_last_name: str = "None"
    contact_email: str = "None"
    case_subject: str
    case_description: str
    chat_id: str | None = None
    user_query_id: str | None = None
    bot_resp_id: str | None = None


class SupportCaseResponse(BaseModel):
    """Represents the response model for the Salesforce support ticket.

    Attributes:
        code (str): The ticket code.
        id (str): The ticket id.
    """

    salesforce_ticket_code: str
    salesforce_ticket_id: str


class FeedbackResponse(BaseModel):
    """Represents the response model for the Feedback.

    Attributes:
        feedback_recieved (bool): Indicates if the feedback is recieved.
    """

    feedback_recieved: bool


class GST_ValidatePANResponse(BaseModel):
    """Represents the response model for the GST PAN validation."""

    isValidPAN: bool
    accountNumber: str


class BoomiTokenResponse(BaseModel):
    """Represents the response model for the Boomi token."""

    api_product_list: str
    issued_at: int
    access_token: str
    expires_in: int
    token_type: str


class FeedbackModel(BaseModel):
    """Represents the feedback model.

    Attributes:
        feedback_symbol (str): The feedback (Positive or Negative).
        chat_id (str): The chat id.
        user_query (str): User's message
        ai_message (str): The bot's response to the user query.
        comments (str): The feedback message.
        user_query_id (str): The user query id.
        bot_resp_id (str): The bot response id.
        feedback_date (str): The feedback date.
        tenant_id (str): The tenant id.
        email_address (str): The email address of the user.
        chat_duration (int): The chat duration.
    """

    feedback_symbol: str  # "positive" or "negative"
    chat_id: str
    user_query: str | None = "None"
    ai_message: str | None = "None"
    tenant_id: str | None = "unknown"
    comments: str | None = None
    user_query_id: str | None = None
    bot_resp_id: str | None = None
    feedback_date: datetime | None = None
    email_address: str | None = None
    chat_duration: int | None = None


class Authentication(BaseModel):
    """Represents the authentication model.

    Attributes:
        SessionId (str): The session ID.
        DemNextId (str): The next ID for the DEM.
        EventManagerId (str): The event manager ID.
        Site (str): The site identifier.
        Status (str): The authentication status.
        LongToken (str): The long token for authentication.
        ExpiresReason (str): The reason for expiration.
        SessionEndedReason (str): The reason for session end.
        FullName (str): The full name of the user.
        FirstName (str): The first name of the user.
        LastName (str): The last name of the user.
        EmailAddress (str): The email address of the user.
        SHOPAIASSISTUserX500 (str): The SHOPAIASSIST user X500.
        CreatedDateTime (str): The date and time when the session was created.
        ExpiresDateTime (str): The date and time when the session expires.
        OrphanExpiresDateTime (str): The date and time for orphan expiration.
        SessionEndedDateTime (str): The date and time when the session ended.
        SessionExpiresDateTime (str): The date and time when the session expires.
        Tier (int): The tier level.
        SessionSource (int): The source of the session.
        IpAddress (str): The IP address of the user.
        IPAuthenticationEnabled (bool): Indicates if IP authentication is enabled.
        AuthenticatedIP (str): The authenticated IP address.
        UserObjectId (str): The user object ID.
        UserCategory (str): The category of the user.
        Browser (str): The browser information.
        IsSSoLogin (bool): Indicates if it is a SSO login.
        SSONetwork (str): The SSO network information.
    """

    SessionId: str | None = "None"  # "c853316854984db9aafb98f779fd92fd",
    DemNextId: str | None = "None"  # "f3286e6058fd48f7a494bad6b32813e7",
    EventManagerId: str | None = "None"  # "UNKNOWN_ID",
    Site: str | None = "None"  # "EAG",
    Status: str | None = "None"  # "Authenticated",
    LongToken: str | None = "None"  # "DEV2-S8Y6ESvAO6qBdswlfPArxlUo1hdqoX-6-vS6mHmvM9jIjma18z4KO7ptSR3vK5LN",
    ExpiresReason: str | None = "None"  # "UserInactivity",
    SessionEndedReason: str | None = "None"  # "NotSet",
    FullName: str = "None"  # "Daniel Gonzalez Jucla",
    FirstName: str = "None"  # "Daniel",
    LastName: str = "None"  # "Jucla",
    EmailAddress: str = "None"  # "daniel.gonzalezjucla@thomsonreuters.com",
    SHOPAIASSISTUserX500: str | None = "None"  # "uid=daniel.gonzalezjucla.v9m, o=SHOPAIASSIST, ou=V9M",
    CreatedDateTime: str | None = "None"  # "2024-12-24T16:39:08.6765847Z",
    ExpiresDateTime: str | None = "None"  # "2024-12-25T16:39:08.6765847Z",
    OrphanExpiresDateTime: str | None = "None"  # "2024-12-24T17:09:08.6765847Z",
    SessionEndedDateTime: str | None = "None"  # null,
    SessionExpiresDateTime: str | None = "None"  # "2024-12-25T16:39:08.6765847Z",
    Tier: int | None = None  # 0,
    SessionSource: int | None = None  # 1,
    IpAddress: str | None = "None"  # "51.11.177.77",
    IPAuthenticationEnabled: bool | None = None  # false,
    AuthenticatedIP: str | None = "None"  # "51.11.177.77",
    UserObjectId: str | None = "None"  # "",
    UserCategory: str | None = "None"  # "NormalUser",
    Browser: str | None = "None"  # null,
    IsSSoLogin: bool | None = None  # false,
    SSONetwork: str | None = "None"  # null
    org_id: int = 1  # 1: SHOPAIASSIST, 2: GTM
    tenant_id: str | None = "None"
    user_id: str | None = "None"
    account_type: str | None = "None"  # "Internal", "External"


class EntryPointModel(BaseModel):
    """Represents the entry point logging model.

    Attributes:
        entry_point (str): The product name that represents the entry point.
        bot_resp_id (str): Id of the message for which we are logging the entry point.
    """

    entry_point: str
    bot_resp_id: str
    tenant_id: str


class UserInfo(BaseModel):
    """Represents user information associated with a chat.

    Attributes:
        user_name (str): The name of the user.
    """

    user_name: str = ""


class HumanMessage(BaseModel):
    """Represents a human message in a chat.

    Attributes:
        id (str): The ID of the message.
        sent_time (str): The date and time when the message was sent.
        sender (str): The sender of the message.
        message_type (str): The type of the message (text or file).
        message (str): The content of the message.
        role (str): The role of the sender.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sent_time: str = ""
    sender: str = "user"
    message_type: str = "text"
    message: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)
    document_id: str | None = None


class FileMessage(BaseModel):
    """Represents a file message in a chat.

    Attributes:
        id (str): The ID of the message.
        sent_time (str): The date and time when the message was sent.
        sender (str): The sender of the message.
        message_type (str): Always "file" for file messages.
        message (str): The content of the message (usually the filename).
        document_id (str): The ID of the document.
        filename (str): The name of the file.
        filetype (str): The type of the file.
        is_active (bool): Whether the document is still active/available.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sent_time: str = ""
    sender: str = "user"
    message_type: str = "files"
    message: str = ""
    document_id: str
    filename: str | None
    filetype: str | None
    is_active: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AIMessage(BaseModel):
    """Represents an AImessage in a chat.

    Attributes:
        id (str): The ID of the message.
        sent_time (str): The date and time when the message was sent.
        sender (str): The sender of the message.
        message_type (str): The type of the message.
        message (str): The content of the message.
        role (str): The role of the sender.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sent_time: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    sender: str = "ai"
    message_type: str = "text"
    message: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)
    document_id: str | None = None


class ChatMetadata(BaseModel):
    """Represents the chat information. Messages are not included in this model.

    Attributes:
        id (str): The ID of the chat.
        createdAt (str): The date and time when the chat was created.
        updatedAt (str): The date and time when the chat was last updated.
    """

    id: str = ""
    createdAt: str = ""
    updatedAt: str = ""
    name: str = ""
    treeItemId: str = id
    type: str = "chat"
    uid: str | None = ""


class Chat(BaseModel):
    """Represents a chat.

    Attributes:
        id (str): The ID of the chat.
        messages (List[Message]): The list of messages in the chat.
        createdAt (str): The date and time when the chat was created.
        updatedAt (str): The date and time when the chat was last updated.
        name (str): The name of the chat.
        user_id (str): The ID of the user.
        org_id (int): The ID of the organization.
        user_info (UserInfo): The user information associated with the chat.
    """

    id: str = ""
    messages: List[Union[AIMessage, HumanMessage, FileMessage]] = []
    createdAt: str = ""
    updatedAt: str = ""
    name: str = ""
    suggested_actions: List[str] = []
    user_id: str | None = ""
    org_id: int = 1
    matter_id: Optional[Any] = None
    originating_source: str = "SHOPAIASSIST"
    user_info: Optional[Any] = None
    chat_mode: str = "default"
    parent_id: Optional[Any] = None


class CreateMessageResponse(BaseModel):
    """Represents the response model for creating a message.

    Attributes:
        id (str): The ID of the message.
        chat_id (str): The ID of the chat.
        user_id (str): The ID of the user.
        message (str): The message.
        createdAt (str): The date and time when the message was created.
    """

    message: AIMessage = AIMessage()


class SearchScope(str, Enum):
    """Defines the scope of search for knowledge retrieval.

    This enum specifies where to search for information when responding to user queries.

    Attributes:
        DOCUMENT_ONLY: Search only within the specified document.
        KB_ONLY: Search only within the knowledge base.
        DOCUMENT_AND_KB: Search both within the specified document and the knowledge base.
    """

    DOCUMENT_ONLY = "document_only"
    KB_ONLY = "kb_only"
    DOCUMENT_AND_KB = "document_and_kb"
    WHOLE_DOCUMENT = "whole_document"


class UserMessageContent(BaseModel):
    """Represents the structure of a user message content."""

    message: str
    message_type: str
    document_id: str | None = None
    search_scope: SearchScope = SearchScope.KB_ONLY


class ChatMessage(BaseModel):
    """Represents a single message in chat history."""

    role: Literal["user", "assistant"]
    content: str


class UserMessageRequest(BaseModel):
    """Represents the user message request model.

    Attributes:
        allowed_skills (str): List of skills allowed for the AI to use.
        user_message (str): The message content.
    """

    allowed_skills: List[str] = []
    chat_history: List[ChatMessage] = []
    user_message: UserMessageContent


class AIMessageRequest(BaseModel):
    """Represents the AI message request model.

    Attributes:
        chat_id (str): AI message to add to the chat.
    """

    ai_message: AIMessage


class SimpleResponseChunkProductSupport(BaseModel):
    """Represents the response chunk for product support.

    Attributes:
        id (str): The ID of the message.
        message_type (str): The type of the message.
        message (str): The message content.
    """

    id: str = str(uuid.uuid4())
    message: str = ""
    message_type: str = "fragment"


class ResponseChunkProductSupport(BaseModel):
    """Represents the response chunk for product support.

    Attributes:
        id (str): The ID of the ai response.
        user_query_id (str): The ID of the user query.
        chat_title (str): The name of the chat.
        retrieved_urls (List[Dict[str, str]]): List of retrieved URLs.
        reformulated_query (str): The reformulated query.
        message (str): The message content.
        open_ticket (bool): Indicates if a ticket should be opened.
        ticket_subject (str): The subject of the ticket.
        ticket_description (str): The description of the ticket.
        ticket_product (str): The product associated with the ticket.
    """

    id: str = str(uuid.uuid4())
    user_query_id: str | None = None
    chat_title: str | None = None
    retrieved_urls: list[dict[str, str]] | None = None
    reformulated_query: str | None = None
    reformulated_query_raw: Optional[str] = None
    message: str = ""  # Contains basenji's format with all the information (## retrieved_urls, ...)
    ai_message: str | None = None
    open_ticket: bool | None = None
    ticket_subject: str | None = None
    ticket_description: str | None = None
    ticket_product: str | None = None
    message_type: str = "text"
    sent_time: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    sender: str = "ai"
    system_flags: list = []
    invite_file_upload: bool = False
    invite_db_selection: bool = False


class RenameChatRequest(BaseModel):
    """Represents the request model for renaming a chat.

    Attributes:
        new_name (str): The new name for the chat.
    """

    new_name: str


class GenerateNameRequest(BaseModel):
    """Represents the request model for generating a chat name.

    Attributes:
        chat_history (List[Dict[str, str]]): The chat history to generate a name from.
    """

    chat_history: List[ChatMessage]


class GenerateNameResponse(BaseModel):
    """Represents the response model for generating a chat name.

    Attributes:
        name (str): The generated chat name.
    """

    name: str


class DocumentUploadResponse(BaseModel):
    """Represents the response model for document upload.

    Attributes:
        document_id (str): The ID of the uploaded document.
        filename (str): The name of the uploaded file.
        status (str): The status of the upload operation.
        message (str): A message describing the result of the operation.
    """

    document_id: str
    filename: str | None
    status: str
    message: str


class DocumentDeleteResponse(BaseModel):
    """Represents the response model for document deletion.

    Attributes:
        document_id (str): The ID of the deleted document.
        status (str): The status of the deletion operation.
        message (str): A message describing the result of the operation.
    """

    document_id: str
    status: str
    message: str
