"""A FastAPI application for an AI Assistant API.

This module manages support cases, feedback, and product information.

The API includes endpoints for:
    - Health checks.
    - Creating support cases in Salesforce.
    - Providing user feedback.
    - Retrieving available Salesforce products for users.

Classes:
    AIAssistantAPI: Handles the setup of routes and middleware, and implements the API logic for managing support
        cases, feedback, and product information.

Functions:
    create_app: Initializes and configures the FastAPI application.

Dependencies:
    - fastapi: For building the API endpoints.
    - httpx: For making HTTP requests.
    - pydantic: For data validation and settings management.
    - src.utils: Contains utility functions for loading configurations and data from S3.
    - src.models: Contains data models for support cases, feedback, and authentication.
    - src.sf_case_creation: Manages Salesforce case creation logic.
    - src.openai_utils: Provides OpenAI-related utilities.
    - src.auth: Manages user authentication.

The module assumes the presence of configuration settings for Salesforce and OpenAI integrations, and it uses logging
to track API activity and errors.
"""
from fastapi import FastAPI, HTTPException, UploadFile, Depends, Header, Query, APIRouter
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import urllib.parse
import json
import os
import uuid
from loguru import logger
from typing import Dict, Any, List, Optional
import traceback
from datetime import datetime
from sse_starlette.sse import EventSourceResponse

from src.models import (
    SupportCaseModel,
    SupportCaseResponse,
    FeedbackModel,
    SalesforceProducts,
    Authentication,
    EntryPointModel,
    ChatMetadata,
    Chat,
    UserMessageRequest,
    AIMessage,
    RenameChatRequest,
    GenerateNameRequest,
    GenerateNameResponse,
    DocumentUploadResponse,
    DocumentDeleteResponse,
)
from src.db import ChatManagement
from src.utils import load_config, load_json_from_S3, get_salesforce_products_in_env
from src.sf_case_creation import SFCreateCase
from src.openai_utils import OpenaiUtils
from src.auth import authorize
from src.s3_logging import S3Logger
from src.skills_backend.document_qa.document_handler import DocumentHandler
from src.skills_backend.product_support.product_support import product_support, format_message_with_markdown
from src.skills_backend.chat_summarization.summarize_chat import summarize_chat


class AIAssistantAPI:
    """API for AI Assistant to manage support cases, feedback, and product information."""

    def __init__(self, config, openai_chat, salesforce_prod_mapping, chat_logger, chat_mngmt):
        """Initialize the AI Assistant API with configuration, OpenAI chat, and Salesforce product mapping.

        Args:
            config (dict): Configuration settings for the API.
            openai_chat (OpenaiUtils): OpenAI utility for chat operations.
            salesforce_prod_mapping (dict): Mapping of Salesforce products.
            chat_logger (S3Logger): S3 logger for chat logs.
            chat_mngmt (ChatManagement): Chat management instance for handling chat operations.
        """
        self.app = FastAPI(
            title="AI Assistant API",
            description="AI Assistant API",
            version="0.1.0",
            docs_url="/assisvc/docs",
            redoc_url="/assisvc/redoc",
            openapi_url="/assisvc/openapi.json",
        )
        self.config = config
        self.openai_chat = openai_chat
        self.chat_logger = chat_logger
        self.chat_mngmt = chat_mngmt
        self.salesforce_prod_mapping = salesforce_prod_mapping
        self.document_handler = DocumentHandler()
        self.chat_model_secrets = openai_chat.get_parameter_from_secret(
            config["credentials"]["chat_model_secret"],
            config["credentials"]["region_name"],
        )
        self.setup_middleware()
        self.setup_routes()

    def setup_middleware(self):
        """Set up middleware for the FastAPI application."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=self.config["allowed_origins"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        """Set up API routes for the FastAPI application using APIRouters."""
        # Create routers
        health_router = self._create_health_router()
        chat_router = self._create_chat_router()
        document_router = self._create_document_router()
        support_router = self._create_support_router()
        
        # Include routers with prefix
        self.app.include_router(health_router, prefix="/assisvc")
        self.app.include_router(chat_router, prefix="/assisvc")
        self.app.include_router(document_router, prefix="/assisvc")
        self.app.include_router(support_router, prefix="/assisvc")

    def _create_health_router(self) -> APIRouter:
        """Create router for health check endpoints."""
        router = APIRouter(tags=["Health"])
        router.get("/actuator/health")(self.health_check)
        return router

    def _create_chat_router(self) -> APIRouter:
        """Create router for chat management endpoints."""
        router = APIRouter(tags=["Chat Management"])
        router.get("/chat")(self.get_chats)
        router.post("/chat")(self.create_chat)
        router.get("/chat/{chat_id}")(self.get_chat_info)
        router.delete("/chat/{chat_id}")(self.delete_chat)
        router.get("/chat/{chat_id}/messages")(self.get_chat_with_messages)
        router.post("/chat/{chat_id}/user-message")(self.create_user_message)
        router.post("/chat/{chat_id}/ai-message")(self.create_ai_message)
        router.post("/chat/{chat_id}/rename")(self.rename_chat)
        router.post("/chat/{chat_id}/generate-name")(self.generate_chat_name)
        return router

    def _create_document_router(self) -> APIRouter:
        """Create router for document management endpoints."""
        router = APIRouter(tags=["Document Management"])
        router.post("/documents/upload")(self.upload_document)
        router.delete("/documents/{document_id}")(self.delete_document)
        return router

    def _create_support_router(self) -> APIRouter:
        """Create router for support and feedback related endpoints."""
        router = APIRouter(tags=["Support & Feedback"])
        router.post("/support_case")(self.create_support_case)
        router.post("/feedback")(self.feedback)
        router.post("/salesforce_products")(self.salesforce_products)
        router.post("/log_entry_point")(self.log_entry_point)
        return router

    async def health_check(self):
        """Health check endpoint for the API.

        Returns:
            dict: A simple greeting message.
        """
        return {"Hello": "World"}

    async def log_entry_point(self, entry_point_req: EntryPointModel, auth: Authentication = Depends(authorize)):
        """Endpoint to log entry point for a given message."""
        try:
            logger.info(f"Received entry point: {entry_point_req.entry_point}")
            await self.chat_logger.write_entry_point(
                entry_point=entry_point_req.entry_point,
                bot_resp_id=entry_point_req.bot_resp_id,
                tenant=entry_point_req.tenant_id,
            )

            async def json_generator():
                data = json.dumps({"code": 200, "message": "Entry Point logged successfully."})
                yield data

            return StreamingResponse(json_generator(), media_type="application/json")

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))

    async def create_support_case(
        self, req: SupportCaseModel, auth: Authentication = Depends(authorize)
    ) -> SupportCaseResponse:
        """Endpoint to create a support case in Salesforce.

        Args:
            req (SupportCaseModel): Details for creating the support case.
            auth (Authentication, optional): Authentication dependency.

        Returns:
            SupportCaseResponse: The response containing ticket ID and code.

        Raises:
            HTTPException: If there is an error during support case creation.
        """
        try:
            sfcreatecase = SFCreateCase()
            req.contact_email = auth.EmailAddress
            req.contact_first_name = auth.FirstName
            req.contact_last_name = auth.LastName
            logger.info(f"create_support_case - Received request: {req.model_dump()}")
            # todo - validate request and check if all required fields are present
            # todo - check if the constant values are correct, the constants are defined in the model
            # todo - add retry and timeout logic to http requests in the SFCreateCase class
            # todo - cache token for the duration of its validity
            ticket_id = str(uuid.uuid4())
            await self.chat_mngmt.log_support_case_message(ticket_id, req, auth, self.chat_mngmt.conn_write)
            data = await sfcreatecase.create_support_case(req)
            await self.chat_mngmt.log_support_case(ticket_id, req, auth, data, self.chat_mngmt.conn_write)
            return data
            # return StreamingResponse(sfcreatecase.create_support_case(req), media_type="application/json")
            # return JSONResponse(content=data.model_dump_json())

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def salesforce_products(
        self, user_products: SalesforceProducts, auth: Authentication = Depends(authorize)
    ) -> Dict[str, Any]:
        """Endpoint to return the available products that a user should have to open a ticket.

        These products are the intersection between the products that the user has, which are sent in the request,
        and the products that are available in Salesforce for the given environment.

        Args:
            user_products (SalesforceProducts) List[str]: User's product information.
            auth (Authentication, optional): Authentication dependency.

        Returns:
            dict: List of products to be shown to the user in key "salesforce_products"

        Raises:
            HTTPException: If there is an error retrieving products.
        """
        try:
            if user_products.refresh:
                self.salesforce_prod_mapping = load_json_from_S3(
                    self.config["salesforce_boomi_settings"]["product_mapping_json_path"]
                )
            salesforce_products = get_salesforce_products_in_env(self.salesforce_prod_mapping, org_id=auth.org_id)
            intersection = list(set(salesforce_products) & set(user_products.products))
            if (
                "Administration" in user_products.products and "Administration" not in intersection
            ):  # In config appears as "SHOPAIASSIST" Platform Common"
                intersection.append("Administration")
            intersection = sorted(intersection)
            return {"salesforce_products": intersection}

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def feedback(self, feedback: FeedbackModel, auth: Authentication = Depends(authorize)):
        """Endpoint to provide feedback.

        Args:
            req (FeedbackModel): The feedback_symbol, comments, chat_id, user_query_id, bot_resp_id.

        Returns:
            StreamingResponse: A streaming response of Feedback is recieved

        Raises:
            HTTPException: If there is an error processing feedback.
        """
        try:
            logger.info(f"Received feedback: {feedback.feedback_symbol}")
            await self.chat_logger.write_feedback(
                feedback_symbol=feedback.feedback_symbol,
                comments=feedback.comments,
                tenant_id=feedback.tenant_id,
                user_query=feedback.user_query,
                ai_message=feedback.ai_message,
                email_address=auth.EmailAddress,
                feedback_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                chat_duration=feedback.chat_duration,
                chat_id=feedback.chat_id,
                user_query_id=feedback.user_query_id,
                bot_resp_id=feedback.bot_resp_id,
            )
            await self.chat_mngmt.log_feedback(feedback, auth, self.chat_mngmt.conn_write)

            async def json_generator():
                data = json.dumps({"code": 200, "message": "Feedback received successfully."})
                yield data

            return StreamingResponse(json_generator(), media_type="application/json")

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_chats(
        self,
        sort_by: str = Query(default="date", regex="^(date|name)$"),
        time_period: int = Query(default=90, ge=1),
        auth: Authentication = Depends(authorize),
    ) -> List[ChatMetadata]:
        """Retrieve a list of all chats for the user.

        Args:
            sort_by (str): Sort order for chats. Options:
                - "date": Sort by last updated timestamp (default)
                - "name": Sort by chat title alphabetically
            time_period (int): Number of days to look back for chat updates (default: 90 days)
            auth (Authentication): Authentication dependency

        Returns:
            List[ChatMetadata]: List of chat metadata objects sorted according to sort_by parameter
        """
        try:
            chats: List[ChatMetadata] = await self.chat_mngmt.get_chats_from_user(
                auth, self.chat_mngmt.conn_read, sort_by=sort_by, time_period=time_period
            )
            return chats

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_chat(self, auth: Authentication = Depends(authorize)) -> ChatMetadata:
        """Create a new empty chat."""
        try:
            chat_response: ChatMetadata = await self.chat_mngmt.create_new_chat(auth, self.chat_mngmt.conn_write)
            return chat_response

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_chat(self, chat_id: str, auth: Authentication = Depends(authorize)) -> Dict[str, str]:
        """Delete a single chat."""
        try:
            await self.chat_mngmt.delete_chat(chat_id, auth, self.chat_mngmt.conn_write)
            return {"message": "Chat deleted successfully."}

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_chat_with_messages(self, chat_id: str, auth: Authentication = Depends(authorize)) -> Dict[str, Chat]:
        """Retrieve a chat with its messages for the authorized user."""
        try:
            chat: Chat = await self.chat_mngmt.get_chat_with_messages(chat_id, auth, self.chat_mngmt.conn_read)

            for message in chat.messages:
                if message.sender == "ai":
                    original_message = message.message

                    formatted_message = format_message_with_markdown(
                        message=original_message,
                        retrieved_urls=message.metadata["retrieved_urls"],
                        open_ticket=message.metadata["open_ticket"],
                        ticket_info=message.metadata["ticket_info"] if "ticket_info" in message.metadata else {},
                    )
                    message.message = formatted_message

            return {"chat": chat}

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            logger.error(f"Error getting chat with messages: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_chat_info(self, chat_id: str, auth: Authentication = Depends(authorize)) -> ChatMetadata:
        """Retrieve metadata for a single chat."""
        try:
            chat_info: ChatMetadata = await self.chat_mngmt.get_chat_info(chat_id, auth, self.chat_mngmt.conn_read)
            if chat_info is None:
                raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found or user does not have access")
            return chat_info

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_user_message(
        self,
        chat_id: str,
        user_message_req: UserMessageRequest,
        products: Optional[str] = Header(None, alias="X-Op-Product-Id"),
        auth: Authentication = Depends(authorize),
    ):
        """Receive a user message and add it to the chat. Streams back an AI generated response."""
        try:
            logger.info(f"Received User message for chat: {chat_id}")
            chat = await self.chat_mngmt.get_chat_info(chat_id, auth, self.chat_mngmt.conn_read)

            if products:
                products = json.loads(urllib.parse.unquote(products)).get("product_list", [])

            # Forward message to ML API for now
            return EventSourceResponse(
                product_support(chat, user_message_req, products, auth, self.config, self.openai_chat, self.chat_mngmt),
                media_type="text/event-stream",
                ping=30,
            )
        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_ai_message(
        self, chat_id, ai_message_req: AIMessage, auth: Authentication = Depends(authorize)
    ) -> Dict[str, str]:
        """Add an AI message to a chat. To do so, add it to the database."""
        try:
            logger.info(f"Received AI message for chat: {chat_id}")
            await self.chat_mngmt.create_ai_message(chat_id, ai_message_req, auth, self.chat_mngmt.conn_write)
            return {"message": "AI message created successfully."}

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def rename_chat(
        self, chat_id: str, rename_req: RenameChatRequest, auth: Authentication = Depends(authorize)
    ) -> Dict[str, str]:
        """Rename a chat."""
        try:
            await self.chat_mngmt.rename_chat(chat_id, rename_req.new_name, auth, self.chat_mngmt.conn_write)
            return {"message": "Chat renamed successfully."}

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def generate_chat_name(
        self, chat_id: str, request: GenerateNameRequest, auth: Authentication = Depends(authorize)
    ) -> GenerateNameResponse:
        """Generate a name for a chat, taking into consideration the conversation history."""
        try:
            chat_info = await self.chat_mngmt.get_chat_info(chat_id, auth, self.chat_mngmt.conn_read)
            if chat_info is None:
                raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found or user does not have access")

            if not request.chat_history:
                raise HTTPException(status_code=400, detail="No chat_history provided.")

            # Generate name from provided chat history
            new_chat_name = await summarize_chat(self.openai_chat, request.chat_history)
            await self.chat_mngmt.update_chat_title(chat_id, new_chat_name, auth, self.chat_mngmt.conn_write)
            return GenerateNameResponse(name=new_chat_name)

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def upload_document(
        self, file: UploadFile, auth: Authentication = Depends(authorize)
    ) -> DocumentUploadResponse:
        """Upload and process a document.

        This endpoint accepts .docx and .xml files, processes them to extract text,
        generates embeddings, and stores the original document and embeddings in S3.
        It also logs the document information to the database.

        If a chat_id is provided, it will create a file message in the chat and return
        a message object. Otherwise, it will just return document upload information.

        Args:
            file (UploadFile): The document file to upload.
            auth (Authentication): The authentication object.

        Returns:
            DocumentUploadResponse: Response containing document ID and status,
                or a message object if chat_id is provided.

        Raises:
            HTTPException: If there is an error processing the document.
        """
        try:
            logger.info(f"Received document upload request: {file.filename}")

            # Get file size (convert from bytes to KB)
            file.file.seek(0, os.SEEK_END)
            file_size = file.file.tell() // 1024
            file.file.seek(0)

            # Process the document
            result = await self.document_handler.process_document(
                file=file, tenant_id=auth.tenant_id or "unknown", user_id=auth.user_id or auth.EmailAddress
            )

            # Extract file extension
            file_extension = os.path.splitext(str(file.filename))[1].lower()
            file_type = file_extension[1:] if file_extension.startswith(".") else file_extension

            # Generate a UUID for the message
            message_id = str(uuid.uuid4())

            # Log document upload to database
            await self.chat_mngmt.log_document_upload(
                document_id=result["document_id"],
                file_name=file.filename,
                file_type=file_type,
                file_size=file_size,
                user_query_id=message_id,
                auth=auth,
                conn=self.chat_mngmt.conn_write,
            )

            logger.info(f"Document processed and logged successfully: {result['document_id']}")
            return DocumentUploadResponse(
                document_id=result["document_id"],
                filename=file.filename,
                status="success",
                message=f"Document '{file.filename}' was uploaded successfully.",
            )

        except HTTPException as http_ex:
            logger.error(f"Error uploading document: {http_ex.detail}")
            raise http_ex
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

    async def delete_document(
        self, document_id: str, auth: Authentication = Depends(authorize)
    ) -> DocumentDeleteResponse:
        """Delete a document from S3 and mark it as inactive in the database.

        Args:
            document_id (str): The ID of the document to delete.
            auth (Authentication): The authentication object.

        Returns:
            DocumentDeleteResponse: Response containing status of the deletion.

        Raises:
            HTTPException: If there is an error deleting the document.
        """
        try:
            logger.info(f"Received document delete request: {document_id}")

            # Delete the document from S3
            success = await self.document_handler.delete_from_s3(
                tenant_id=auth.tenant_id or "unknown",
                user_id=auth.user_id or auth.EmailAddress,
                document_id=document_id,
            )

            if not success:
                raise HTTPException(status_code=404, detail=f"Document {document_id} not found or could not be deleted")

            # Update status in db
            await self.chat_mngmt.update_document_status(
                document_id=document_id,
                is_active=False,
                auth=auth,
                conn=self.chat_mngmt.conn_write,
            )

            logger.info(f"Document deleted successfully and marked as inactive: {document_id}")

            return DocumentDeleteResponse(
                document_id=document_id, status="success", message=f"Document '{document_id}' was deleted successfully."
            )

        except HTTPException as http_ex:
            logger.error(f"Error deleting document: {http_ex.detail}")
            raise http_ex
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: The configured FastAPI application instance.
    """
    config = load_config()
    openai_chat = OpenaiUtils()
    chat_logger = S3Logger()
    chat_mngmt = ChatManagement(config)
    salesforce_prod_mapping = load_json_from_S3(config["salesforce_boomi_settings"]["product_mapping_json_path"])
    api = AIAssistantAPI(config, openai_chat, salesforce_prod_mapping, chat_logger, chat_mngmt)
    return api.app
