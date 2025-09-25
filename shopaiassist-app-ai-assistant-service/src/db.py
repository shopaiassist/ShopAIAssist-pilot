"""Database management for chat application.

This module provides functionality to manage chat data, including creating, retrieving, and deleting chats and messages.
It uses PostgreSQL as the database and AWS Secrets Manager for credential management.
It also includes functions to handle chat metadata and messages, ensuring that the data is correctly formatted
and stored.
"""
from psycopg_pool import AsyncConnectionPool
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
import boto3
import json
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from loguru import logger
from typing import Optional, List, Union, Dict
from src.models import (
    Authentication,
    Chat,
    ChatMetadata,
    AIMessage,
    HumanMessage,
    FileMessage,
    ResponseChunkProductSupport,
    UserMessageRequest,
    FeedbackModel,
    SupportCaseModel,
    SupportCaseResponse,
)


class ChatManagement:
    """A class to manage chat-related operations in the database.

    This class provides methods to create, retrieve, update, and delete chats and messages,
    as well as handle chat metadata. It interacts with a PostgreSQL database and uses
    AWS Secrets Manager for credential management.
    """

    def __init__(self, config):
        """Initialize the ChatManagement class with database configuration.

        Args:
            config (dict): Configuration dictionary containing database connection details.
        """
        self.config = config
        self.conn_read, self.conn_write = self.get_db_connections(config)

    def load_db_credentials(self, config):
        """Load database credentials from AWS Secrets Manager.

        Returns a dictionary with 'username' and 'password'.
        """
        try:
            secretsmanager = boto3.client("secretsmanager", region_name=config["credentials"]["region_name"])
            secret_response = secretsmanager.get_secret_value(SecretId=config["database"]["access_info_secret"])
            credentials = json.loads(secret_response["SecretString"])
            return credentials
        except Exception as e:
            logger.error(f"Error loading DB credentials: {e}")
            raise HTTPException(status_code=500, detail="Failed to load database credentials from AWS Secrets Manager.")

    def get_db_connections(self, config):
        """Establish a connection to the PostgreSQL database.

        Returns a connection object.
        """
        try:
            credentials = self.load_db_credentials(config)
            # For write operations (use writer endpoint)
            write_conn_string = (
                f"host={config['database']['writer_endpoint']} "
                f"port={credentials['port']} "
                f"dbname={credentials['engine']} "
                f"user={credentials['username']} "
                f"password={credentials['password']}"
            )

            # Connection string for read operations
            read_conn_string = (
                f"host={config['database']['reader_endpoint']} "
                f"port={credentials['port']} "
                f"dbname={credentials['engine']} "
                f"user={credentials['username']} "
                f"password={credentials['password']}"
            )

            # Create connection pools
            conn_write = AsyncConnectionPool(write_conn_string, min_size=1, max_size=10)
            conn_read = AsyncConnectionPool(read_conn_string, min_size=1, max_size=10)

            return conn_write, conn_read

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            logger.error(f"Error connecting to the database: {e}")
            raise HTTPException(status_code=500, detail="Failed to get database connections.")

    async def get_chats_from_user(
        self, auth: Authentication, conn: AsyncConnectionPool, sort_by: str = "date", time_period: int = 90
    ) -> List[ChatMetadata]:
        """Retrieve a list of all chats for the user.

        Args:
            auth (Authentication): Authentication object containing user details
            conn (AsyncConnectionPool): Database connection pool
            sort_by (str): Sort order for chats. Options:
                - "date": Sort by last updated timestamp (default)
                - "name": Sort by chat title alphabetically
            time_period (int): Number of days to look back for chats (default: 90)

        Returns:
            List[ChatMetadata]: List of chat metadata objects sorted according to sort_by parameter
        """
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=time_period)
            sort_clause = "ORDER BY chat_title ASC" if sort_by == "name" else "ORDER BY last_updated_timestamp DESC"
            query = f"""
                SELECT chat_id, chat_title, created_timestamp, last_updated_timestamp
                FROM ct_ai_assistantdb.tb_chats
                WHERE user_id = %(user_id)s
                AND email_address = %(email_address)s
                AND tenant_id = %(tenant_id)s
                AND org_id = %(org_id)s
                AND last_updated_timestamp >= %(cutoff_date)s
                {sort_clause};
            """
            data = {
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "tenant_id": auth.tenant_id,
                "org_id": auth.org_id,
                "cutoff_date": cutoff_date,
            }
            chats: List[ChatMetadata] = []

            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, data)
                    for row in await cursor.fetchall():
                        created_at = row["created_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ")
                        updated_at = row["last_updated_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ")
                        chats.append(
                            ChatMetadata(
                                id=str(row["chat_id"]),
                                name=row["chat_title"],
                                createdAt=created_at,
                                updatedAt=updated_at,
                                treeItemId=str(row["chat_id"]),
                                uid=auth.user_id,
                            )
                        )

            return chats
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error getting chats: {e}")
            raise

    async def create_new_chat(self, auth: Authentication, conn: AsyncConnectionPool) -> ChatMetadata:
        """Create a new empty chat."""
        try:
            default_title = "New Chat"
            query = """
                INSERT INTO ct_ai_assistantdb.tb_chats
                (chat_title, user_id, email_address, tenant_id, org_id)
                VALUES (%(chat_title)s, %(user_id)s, %(email_address)s, %(tenant_id)s, %(org_id)s)
                RETURNING chat_id, created_timestamp, last_updated_timestamp;
            """
            data = {
                "chat_title": default_title,
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "tenant_id": auth.tenant_id,
                "org_id": auth.org_id,
            }
            logger.info(
                f"Creating new chat for user {auth.user_id} with email {auth.EmailAddress} in tenant {auth.tenant_id}"
            )

            # Get a connection from the pool
            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, data)
                    result = await cursor.fetchone()
                    if result is None:
                        raise HTTPException(status_code=500, detail="Failed to create new chat")

            created_at = result["created_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ")
            updated_at = result["last_updated_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ")
            return ChatMetadata(
                id=str(result["chat_id"]),
                name=default_title,
                createdAt=created_at,
                updatedAt=updated_at,
                uid=auth.user_id,
            )
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating new chat: {e}")
            raise

    async def delete_chat(self, chat_id: str, auth: Authentication, conn: AsyncConnectionPool):
        """Delete a single chat."""
        try:
            chat = await self.get_chat_info(chat_id, auth, conn)

            if not chat:
                raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found or user does not have access")

            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    # Delete messages first (due to foreign key constraint)
                    await cursor.execute(
                        "DELETE FROM ct_ai_assistantdb.tb_chat_messages WHERE chat_id = %s", (chat_id,)
                    )

                    # Then delete the chat
                    await cursor.execute("DELETE FROM ct_ai_assistantdb.tb_chats WHERE chat_id = %s", (chat_id,))

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error deleting chat: {e}")
            raise

    async def get_documents_by_ids(self, document_ids: List[str], conn: AsyncConnectionPool) -> Dict[str, FileMessage]:
        """Retrieve document details for multiple document IDs in a single query.

        Args:
            document_ids (List[str]): List of document IDs to retrieve
            conn (AsyncConnectionPool): Database connection pool

        Returns:
            Dict[str, FileMessage]: Dictionary mapping document IDs to partially populated FileMessage objects
        """
        if not document_ids:
            return {}

        result = {}
        query = """
            SELECT document_id, file_name, file_type, is_active, created_timestamp
            FROM ct_ai_assistantdb.tb_documents
            WHERE document_id = ANY(%s);
        """

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)

        async with conn.connection() as aconn:
            async with aconn.cursor(row_factory=dict_row) as cursor:
                await cursor.execute(query, (document_ids,))
                for row in await cursor.fetchall():
                    # Check if document is older than 24 hours
                    is_active = row["is_active"]
                    if is_active and row["created_timestamp"] and row["created_timestamp"] < cutoff_time:
                        is_active = False

                    # Create a partially populated FileMessage
                    file_message = FileMessage(
                        sender="user",
                        document_id=str(row["document_id"]),
                        filename=row["file_name"],
                        filetype=row["file_type"],
                        is_active=is_active,
                    )
                    result[str(row["document_id"])] = file_message

        return result

    async def get_chat_with_messages(self, chat_id: str, auth: Authentication, conn: AsyncConnectionPool) -> Chat:
        """Retrieve a chat with its messages for the authorized user."""
        try:
            # First get chat info
            chat = await self.get_chat_info(chat_id, auth, conn)

            if not chat:
                raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found or user does not have access")

            # Then get messages
            query = """
                SELECT
                    user_query_id,
                    bot_response_id,
                    created_timestamp,
                    sender,
                    message_type,
                    user_query,
                    ai_response,
                    retrieved_urls,
                    open_ticket,
                    ai_ticket_subject,
                    ai_ticket_description,
                    ai_ticket_product,
                    document_id
                FROM ct_ai_assistantdb.tb_chat_messages
                WHERE chat_id = %s
                ORDER BY created_timestamp ASC;
            """
            messages: List[Union[AIMessage, HumanMessage, FileMessage]] = []
            # document_ids = []
            message_rows = []

            # First collect messages and document IDs
            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, (chat_id,))
                    message_rows = await cursor.fetchall()

                    for row in message_rows:
                        if row["sender"] == "user":  # Sender is user
                            # Human message
                            user_message = HumanMessage(
                                id=str(row["user_query_id"]),
                                sent_time=row["created_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                                sender=row["sender"],
                                message_type=row["message_type"],
                                message=row["user_query"],
                                document_id=str(row["document_id"]),
                            )
                            messages.append(user_message)

                        elif row["ai_response"] is not None:
                            ai_message = AIMessage(
                                id=str(row["bot_response_id"]),
                                sent_time=row["created_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                                sender=row["sender"],
                                message_type=row["message_type"],
                                message=row["ai_response"],
                                document_id=str(row["document_id"]),
                                metadata={
                                    "retrieved_urls": row["retrieved_urls"],
                                    "open_ticket": row["open_ticket"],
                                },
                            )
                            if row["ai_ticket_subject"] and row["ai_ticket_description"] and row["ai_ticket_product"]:
                                ai_message.metadata["ticket_info"] = (
                                    {
                                        "case_subject": row["ai_ticket_subject"],
                                        "case_description": row["ai_ticket_description"],
                                        "product": row["ai_ticket_product"],
                                    },
                                )
                            messages.append(ai_message)

            return Chat(
                id=chat_id,
                messages=messages,
                createdAt=chat.createdAt,
                updatedAt=chat.updatedAt,
                name=chat.name,
                org_id=auth.org_id,
                user_id=auth.user_id,
            )
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error getting chat with messages: {e}")
            raise

    async def get_chat_info(
        self, chat_id: str, auth: Authentication, conn: AsyncConnectionPool
    ) -> Optional[ChatMetadata]:
        """Retrieve information about a specific chat."""
        try:
            query = """
                SELECT chat_id, chat_title, created_timestamp, last_updated_timestamp
                FROM ct_ai_assistantdb.tb_chats
                WHERE chat_id = %(chat_id)s AND user_id = %(user_id)s AND email_address = %(email_address)s
                    AND tenant_id = %(tenant_id)s AND org_id = %(org_id)s;
            """
            data = {
                "chat_id": chat_id,
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "tenant_id": auth.tenant_id,
                "org_id": auth.org_id,
            }
            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, data)
                    result = await cursor.fetchone()

                    if result is None:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Chat {chat_id} not found or user does not \
                                            have access",
                        )

            return ChatMetadata(
                id=str(result["chat_id"]),
                name=result["chat_title"],
                createdAt=result["created_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                updatedAt=result["last_updated_timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                uid=auth.user_id,
            )
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error getting chat info: {e}")
            raise

    async def update_chat_last_updated_timestamp(self, chat_id: str, conn: AsyncConnectionPool) -> None:
        """Update the last updated timestamp of a chat."""
        try:
            query = """
                UPDATE ct_ai_assistantdb.tb_chats
                SET last_updated_timestamp = NOW()
                WHERE chat_id = %(chat_id)s;
            """
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    await cursor.execute(query, {"chat_id": chat_id})
                    await aconn.commit()
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error updating chat last updated timestamp: {e}")
            raise

    async def update_chat_title(
        self, chat_id: str, new_title: str, auth: Authentication, conn: AsyncConnectionPool
    ) -> None:
        """Update the title of a chat."""
        try:
            query = """
                UPDATE ct_ai_assistantdb.tb_chats
                SET chat_title = %(chat_title)s
                WHERE chat_id = %(chat_id)s;
            """
            data = {"chat_title": new_title, "chat_id": chat_id}
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    await cursor.execute(query, data)
                    await aconn.commit()
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error updating chat title: {e}")
            raise

    async def create_ai_message(
        self, chat_id: str, ai_message: AIMessage, auth: Authentication, conn: AsyncConnectionPool
    ) -> None:
        """Create a new AI message in the chat."""
        try:
            # First get chat info
            chat = await self.get_chat_info(chat_id, auth, conn)

            if not chat:
                raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found or user does not have access")

            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    # Insert AI message into the database
                    insert_query = """
                        INSERT INTO ct_ai_assistantdb.tb_chat_messages
                        (chat_id, user_query_id, bot_response_id, created_timestamp, sender, message_type, ai_response,
                            user_id, email_address, tenant_id, org_id, account_type)
                        VALUES (%(chat_id)s, %(user_query_id)s, %(bot_response_id)s, %(created_timestamp)s, %(sender)s,
                            %(message_type)s, %(ai_response)s, %(user_id)s, %(email_address)s, %(tenant_id)s,
                            %(org_id)s, %(account_type)s)
                        RETURNING bot_response_id;
                    """
                    data = {
                        "chat_id": chat_id,
                        "user_query_id": ai_message.id,
                        "bot_response_id": uuid.uuid4(),
                        "created_timestamp": ai_message.sent_time,
                        "sender": ai_message.sender,
                        "message_type": ai_message.message_type,
                        "ai_response": ai_message.message,
                        "user_id": auth.user_id,
                        "email_address": auth.EmailAddress,
                        "tenant_id": auth.tenant_id,
                        "org_id": auth.org_id,
                        "account_type": auth.account_type,
                    }
                    await cursor.execute(insert_query, data)

                    result = await cursor.fetchone()
                    if result is None:
                        raise HTTPException(status_code=500, detail="Failed to create AI message")
                    await aconn.commit()

            await self.update_chat_last_updated_timestamp(chat_id, conn)
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating AI message: {e}")
            raise

    async def log_product_support_query(
        self,
        chat,
        user_message_data: dict,
        user_message_req: UserMessageRequest,
        auth: Authentication,
        conn: AsyncConnectionPool,
    ) -> None:
        """Log the user's product support query to the database."""
        try:
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    # Insert the User Message into the database
                    insert_query = """
                        INSERT INTO ct_ai_assistantdb.tb_chat_messages
                        (chat_id, user_query_id, created_timestamp, sender, message_type, user_query, user_id,
                            email_address, tenant_id, org_id, products, product_line, sources, account_type,
                            document_id, search_scope)
                        VALUES (%(chat_id)s, %(user_query_id)s, %(created_timestamp)s, %(sender)s, %(message_type)s,
                            %(user_query)s, %(user_id)s, %(email_address)s, %(tenant_id)s, %(org_id)s, %(products)s,
                            %(product_line)s, %(sources)s, %(account_type)s, %(document_id)s, %(search_scope)s)
                        RETURNING user_query_id;
                    """
                    data = {
                        "chat_id": chat.id,
                        "user_query_id": user_message_data["user_query_id"],
                        "created_timestamp": datetime.now(timezone.utc),
                        "sender": "user",
                        "message_type": "text",
                        "user_query": user_message_data["query"],
                        "user_id": auth.user_id,
                        "email_address": auth.EmailAddress,
                        "tenant_id": auth.tenant_id,
                        "org_id": auth.org_id,
                        "products": Jsonb({"products": user_message_data["products"]}),
                        "product_line": Jsonb({"product_line": user_message_req.product_line})
                        if hasattr(user_message_req, "product_line")
                        else None,
                        "sources": Jsonb({"sources": user_message_req.sources})
                        if hasattr(user_message_req, "sources")
                        else None,
                        "account_type": auth.account_type,
                        "document_id": user_message_data.get("document_id"),
                        "search_scope": user_message_data.get("search_scope"),
                    }
                    await cursor.execute(insert_query, data)
                    _ = await cursor.fetchone()
            await self.update_chat_last_updated_timestamp(chat.id, conn)

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error logging product support query: {e}")
            raise

    async def log_product_support_ai_response(
        self,
        chat,
        user_message_data: dict,
        user_message_req: UserMessageRequest,
        complete_response: ResponseChunkProductSupport,
        auth: Authentication,
        conn: AsyncConnectionPool,
    ) -> None:
        """Log the AI's product support response to the database."""
        try:
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    # Insert AI message into the database
                    insert_query = """
                        INSERT INTO ct_ai_assistantdb.tb_chat_messages
                        (chat_id, user_query_id, bot_response_id, created_timestamp, sender, message_type,
                            ai_response, user_id, email_address, tenant_id, org_id, products, reformulated_query,
                            product_line, sources, retrieved_urls, open_ticket, account_type, document_id,
                            search_scope, ai_ticket_subject, ai_ticket_description, ai_ticket_product)
                        VALUES (%(chat_id)s, %(user_query_id)s, %(bot_response_id)s, %(created_timestamp)s, %(sender)s,
                            %(message_type)s, %(ai_response)s, %(user_id)s, %(email_address)s, %(tenant_id)s,
                            %(org_id)s, %(products)s, %(reformulated_query)s, %(product_line)s, %(sources)s,
                            %(retrieved_urls)s, %(open_ticket)s, %(account_type)s, %(document_id)s, %(search_scope)s,
                            %(ai_ticket_subject)s, %(ai_ticket_description)s, %(ai_ticket_product)s)
                        RETURNING user_query_id;
                    """
                    data = {
                        "chat_id": chat.id,
                        "user_query_id": user_message_data["user_query_id"],
                        "bot_response_id": user_message_data["bot_resp_id"],
                        "created_timestamp": datetime.now(timezone.utc),
                        "sender": "ai",
                        "message_type": "text",
                        "ai_response": complete_response.ai_message
                        if complete_response.ai_message is not None
                        else "Sorry, something went wrong. Please try again.",
                        "user_id": auth.user_id,
                        "email_address": auth.EmailAddress,
                        "tenant_id": auth.tenant_id,
                        "org_id": auth.org_id,
                        "products": Jsonb({"products": user_message_data["products"]}),
                        "reformulated_query": complete_response.reformulated_query_raw,
                        "product_line": Jsonb({"product_line": user_message_req.product_line})
                        if hasattr(user_message_req, "product_line")
                        else None,
                        "sources": Jsonb({"sources": user_message_req.sources})
                        if hasattr(user_message_req, "sources")
                        else None,
                        "retrieved_urls": Jsonb(complete_response.retrieved_urls),
                        "open_ticket": complete_response.open_ticket,
                        "account_type": auth.account_type,
                        "document_id": user_message_data.get("document_id"),
                        "search_scope": user_message_data.get("search_scope"),
                        "ai_ticket_subject": complete_response.ticket_subject,
                        "ai_ticket_description": complete_response.ticket_description,
                        "ai_ticket_product": complete_response.ticket_product,
                    }
                    await cursor.execute(insert_query, data)
                    _ = await cursor.fetchone()
            await self.update_chat_last_updated_timestamp(chat.id, conn)

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error logging product support response: {e}")
            raise

    async def rename_chat(self, chat_id: str, new_title: str, auth: Authentication, conn: AsyncConnectionPool) -> None:
        """Rename a chat."""
        try:
            query = """
                UPDATE ct_ai_assistantdb.tb_chats
                SET chat_title = %(new_title)s
                WHERE chat_id = %(chat_id)s AND user_id = %(user_id)s AND email_address = %(email_address)s AND
                    tenant_id = %(tenant_id)s AND org_id = %(org_id)s
                RETURNING chat_id;
            """
            data = {
                "chat_id": chat_id,
                "new_title": new_title,
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "tenant_id": auth.tenant_id,
                "org_id": auth.org_id,
            }
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    await cursor.execute(query, data)
                    result = await cursor.fetchone()
                    if result is None:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Chat {chat_id} not found or user does \
                                            not have access",
                        )
                    await aconn.commit()

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error renaming chat: {e}")
            raise

    async def log_feedback(self, feedback: FeedbackModel, auth: Authentication, conn: AsyncConnectionPool):
        """Log feedback from the user.

        Now validates that at least one of user_query_id or bot_resp_id is a valid UUID.
        If one ID is invalid ("None" string or actual None), it will log with the valid one.
        If both are invalid, it will raise an exception.

        Args:
            feedback (FeedbackModel): The feedback object containing user feedback.
            auth (Authentication): The authentication object.
            conn (AsyncConnectionPool): The database connection pool.

        Raises:
            HTTPException: If both user_query_id and bot_resp_id are invalid UUIDs.
        """
        try:
            query = """
                INSERT INTO ct_ai_assistantdb.tb_feedback
                (chat_id, user_query_id, bot_response_id, user_id, email_address, org_id, tenant_id, feedback_symbol,
                    comments)
                VALUES (%(chat_id)s, %(user_query_id)s, %(bot_response_id)s, %(user_id)s, %(email_address)s,
                    %(org_id)s, %(tenant_id)s, %(feedback_symbol)s, %(comments)s)
                RETURNING feedback_id;
            """
            data = {
                "chat_id": feedback.chat_id,
                "user_query_id": feedback.user_query_id,
                "bot_response_id": feedback.bot_resp_id,
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "org_id": auth.org_id,
                "tenant_id": auth.tenant_id,
                "feedback_symbol": feedback.feedback_symbol,
                "comments": feedback.comments,
            }
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    result = await cursor.execute(query, data)

                    if result is None:
                        logger.error(f"Chat {feedback.chat_id} not found or user does not have access")
                        raise HTTPException(
                            status_code=404,
                            detail=f"Chat {feedback.chat_id} not found \
                                           or user does not have access",
                        )
                    await aconn.commit()

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error logging feedback: {e}")
            raise

    async def log_support_case_message(
        self,
        ticket_id: str,
        support_case_req: SupportCaseModel,
        auth: Authentication,
        conn: AsyncConnectionPool,
    ):
        """Log support case creation as a message entry in tb_chat_messages table.

        Args:
            ticket_id (str): The ticket ID returned from log_support_case function.
            support_case_req (SupportCaseModel): The support case object containing user request.
            auth (Authentication): The authentication object.
            conn (AsyncConnectionPool): The database connection pool.
        """
        try:
            query = """
                INSERT INTO ct_ai_assistantdb.tb_chat_messages
                (chat_id, user_query_id, ticket_id, user_id, email_address, tenant_id, org_id, account_type,
                    sender, message_type, user_query, created_timestamp)
                VALUES (%(chat_id)s, %(user_query_id)s, %(ticket_id)s, %(user_id)s,
                    %(email_address)s, %(tenant_id)s, %(org_id)s, %(account_type)s, %(sender)s, %(message_type)s,
                    %(user_query)s, %(created_timestamp)s)
                RETURNING user_query_id;
            """
            data = {
                "chat_id": support_case_req.chat_id,
                "user_query_id": support_case_req.user_query_id,
                "ticket_id": ticket_id,
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "tenant_id": auth.tenant_id,
                "org_id": auth.org_id,
                "account_type": auth.account_type,
                "sender": "user",
                "message_type": "text",
                "user_query": "/?!#$(&^ticket:",
                "created_timestamp": datetime.now(timezone.utc),
            }
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    result = await cursor.execute(query, data)
                    if result is None:
                        logger.error(f"Failed to log support case message for ticket {ticket_id}")
                        return
                    await aconn.commit()

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error logging support case message: {e}")
            raise

    async def get_tickets_for_chat(self, chat_id: str, conn: AsyncConnectionPool) -> List[SupportCaseModel]:
        """Retrieve tickets associated with a specific chat.

        Args:
            chat_id (str): The ID of the chat to retrieve tickets for.
            conn (AsyncConnectionPool): Database connection pool.

        Returns:
            List[SupportCaseModel]: List of support case models associated with the chat.
        """
        try:
            query = """
                SELECT
                    chat_id,
                    user_query_id,
                    bot_response_id,
                    ticket_subject,
                    ticket_description,
                    ticket_product
                FROM ct_ai_assistantdb.tb_ticket
                WHERE chat_id = %s
                ORDER BY created_timestamp ASC;
            """

            tickets: List[SupportCaseModel] = []
            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, (chat_id,))
                    for row in await cursor.fetchall():
                        # Create a SupportCaseModel for each ticket
                        ticket = SupportCaseModel(
                            firm_id="",  # Default value
                            product=row["ticket_product"],
                            case_subject=row["ticket_subject"],
                            case_description=row["ticket_description"],
                            chat_id=str(row["chat_id"]),
                            user_query_id=str(row["user_query_id"]),
                            bot_resp_id=str(row["bot_response_id"]),
                        )
                        tickets.append(ticket)

            return tickets
        except Exception as e:
            logger.error(f"Error getting tickets for chat: {e}")
            raise

    async def create_file_message(
        self,
        chat_id: str,
        user_query_id: str,
        document_id: str,
        file_name: str,
        file_type: str,
        auth: Authentication,
        conn: AsyncConnectionPool,
        message: str,
    ) -> FileMessage:
        """Create a file message in the chat.

        This creates a message entry in the message table as if it was a user message,
        with message_type = "files".

        Args:
            chat_id (str): The ID of the chat.
            user_query_id (str): The ID to use for the message.
            document_id (str): The ID of the uploaded document.
            file_name (str): The name of the uploaded file.
            file_type (str): The type of the uploaded file.
            auth (Authentication): The authentication object.
            conn (AsyncConnectionPool): The database connection pool.
            message (str): Custom message to use (e.g., "Document Uploaded", "Document Deleted").

        Returns:
            FileMessage: The created file message object.

        Raises:
            HTTPException: If there is an error creating the file message.
        """
        try:
            # First get chat info to verify access
            chat = await self.get_chat_info(chat_id, auth, conn)

            if not chat:
                raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found or user does not have access")

            current_time = datetime.now(timezone.utc)

            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    # Insert file message into the database
                    insert_query = """
                        INSERT INTO ct_ai_assistantdb.tb_chat_messages
                        (chat_id, user_query_id, created_timestamp, sender, message_type, user_query, user_id,
                            email_address, tenant_id, org_id, account_type, document_id)
                        VALUES (%(chat_id)s, %(user_query_id)s, %(created_timestamp)s, %(sender)s, %(message_type)s,
                            %(user_query)s, %(user_id)s, %(email_address)s, %(tenant_id)s, %(org_id)s,
                            %(account_type)s, %(document_id)s)
                        RETURNING user_query_id;
                    """
                    data = {
                        "chat_id": chat_id,
                        "user_query_id": user_query_id,
                        "created_timestamp": current_time,
                        "sender": "user",
                        "message_type": "files",
                        "user_query": message,
                        "user_id": auth.user_id,
                        "email_address": auth.EmailAddress,
                        "tenant_id": auth.tenant_id,
                        "org_id": auth.org_id,
                        "account_type": auth.account_type,
                        "document_id": document_id,
                    }
                    await cursor.execute(insert_query, data)
                    result = await cursor.fetchone()
                    if result is None:
                        raise HTTPException(status_code=500, detail="Failed to create file message")
                    await aconn.commit()

            await self.update_chat_last_updated_timestamp(chat_id, conn)

            # Create and return a file message object
            return FileMessage(
                id=str(user_query_id),
                sent_time=current_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                sender="user",
                message=message,
                document_id=str(document_id),
                filename=file_name,
                filetype=file_type,
            )
        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating file message: {e}")
            raise HTTPException(status_code=500, detail=f"Error creating file message: {str(e)}")

    async def log_document_upload(
        self,
        document_id: str,
        file_name: str,
        file_type: str,
        file_size: int,  # Size in KB
        user_query_id: str,
        auth: Authentication,
        conn: AsyncConnectionPool,
    ):
        """Log document upload information to the database.

        Args:
            document_id (str): The ID of the uploaded document.
            file_name (str): The name of the uploaded file.
            file_type (str): The type of the uploaded file.
            file_size (int): The size of the uploaded file in kilobytes (KB).
            user_query_id (str): The ID of the user query associated with the document, if any.
            auth (Authentication): The authentication object.
            conn (AsyncConnectionPool): The database connection pool.

        Returns:
            str: The file_id of the inserted record.

        Raises:
            HTTPException: If there is an error logging the document upload.
        """
        try:
            query = """
                INSERT INTO ct_ai_assistantdb.tb_documents
                (document_id, user_query_id, org_id, tenant_id, user_id, file_name, file_size, file_type, is_active)
                VALUES (%(document_id)s, %(user_query_id)s, %(org_id)s, %(tenant_id)s, %(user_id)s, %(file_name)s,
                    %(file_size)s, %(file_type)s, true)
                RETURNING file_id;
            """
            data = {
                "document_id": document_id,
                "user_query_id": user_query_id,
                "org_id": auth.org_id,
                "tenant_id": auth.tenant_id,
                "user_id": auth.user_id or auth.EmailAddress,
                "file_name": file_name,
                "file_size": file_size,
                "file_type": file_type,
            }
            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, data)
                    result = await cursor.fetchone()
                    if result is None:
                        raise HTTPException(status_code=500, detail="Failed to log document upload")
                    await aconn.commit()
                    return str(result["file_id"])

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error logging document upload: {e}")
            raise HTTPException(status_code=500, detail=f"Error logging document upload: {str(e)}")

    async def update_document_status(
        self,
        document_id: str,
        is_active: bool,
        auth: Authentication,
        conn: AsyncConnectionPool,
    ):
        """Update the status of a document in the database.

        Args:
            document_id (str): The ID of the document to update.
            is_active (bool): The new status of the document.
            auth (Authentication): The authentication object.
            conn (AsyncConnectionPool): The database connection pool.

        Returns:
            str: The file_id of the updated record.

        Raises:
            HTTPException: If there is an error updating the document status or if the document is not found.
        """
        try:
            query = """
                UPDATE ct_ai_assistantdb.tb_documents
                SET is_active = %(is_active)s, updated_timestamp = NOW()
                WHERE document_id = %(document_id)s AND tenant_id = %(tenant_id)s AND user_id = %(user_id)s
                RETURNING file_id;
            """
            data = {
                "is_active": is_active,
                "document_id": document_id,
                "tenant_id": auth.tenant_id,
                "user_id": auth.user_id or auth.EmailAddress,
            }
            async with conn.connection() as aconn:
                async with aconn.cursor(row_factory=dict_row) as cursor:
                    await cursor.execute(query, data)
                    result = await cursor.fetchone()
                    if result is None:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Document {document_id} not found or user does not have access",
                        )
                    await aconn.commit()
                    return str(result["file_id"])

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            logger.error(f"Error updating document status: {e}")
            raise HTTPException(status_code=500, detail=f"Error updating document status: {str(e)}")

    async def log_support_case(
        self,
        ticket_id: str,
        support_case_req: SupportCaseModel,
        auth: Authentication,
        salesforce_response: SupportCaseResponse,
        conn: AsyncConnectionPool,
    ) -> str:
        """Log support case information.

        Args:
            support_case_req (SupportCaseModel): The support case object containing user feedback.
            auth (Authentication): The authentication object.
            salesforce_response (SupportCaseResponse): The Salesforce response object.
            conn (AsyncConnectionPool): The database connection pool.

        Returns:
            str: The ticket_id of the created support case.
        """
        try:
            query = """
                INSERT INTO ct_ai_assistantdb.tb_ticket
                (chat_id, user_query_id, bot_response_id, user_id, email_address, org_id, tenant_id, ticket_subject,
                    ticket_description, ticket_product, ticket_number, ticket_code, firm_id, contact_first_name,
                    contact_last_name, ticket_id)
                VALUES (%(chat_id)s, %(user_query_id)s, %(bot_response_id)s, %(user_id)s, %(email_address)s,
                    %(org_id)s, %(tenant_id)s, %(ticket_subject)s, %(ticket_description)s, %(ticket_product)s,
                    %(ticket_number)s, %(ticket_code)s, %(firm_id)s, %(contact_first_name)s, %(contact_last_name)s,
                    %(ticket_id)s)
                RETURNING ticket_id;
            """
            data = {
                "chat_id": support_case_req.chat_id,
                "user_query_id": support_case_req.user_query_id,
                "bot_response_id": support_case_req.bot_resp_id,
                "user_id": auth.user_id,
                "email_address": auth.EmailAddress,
                "org_id": auth.org_id,
                "tenant_id": auth.tenant_id,
                "ticket_subject": support_case_req.case_subject,
                "ticket_description": support_case_req.case_description,
                "ticket_product": support_case_req.product,
                "ticket_number": salesforce_response.salesforce_ticket_id,
                "ticket_code": salesforce_response.salesforce_ticket_code,
                "firm_id": support_case_req.firm_id,
                "contact_first_name": support_case_req.contact_first_name,
                "contact_last_name": support_case_req.contact_last_name,
                "ticket_id": ticket_id,
            }
            async with conn.connection() as aconn:
                async with aconn.cursor() as cursor:
                    await cursor.execute(query, data)
                    result = await cursor.fetchone()
                    if result is None:
                        logger.error(f"Chat {support_case_req.chat_id} not found or user does not have access")
                        raise HTTPException(
                            status_code=404,
                            detail=f"Chat {support_case_req.chat_id} not found or user does not have access",
                        )
                    ticket_id = result[0]
                    await aconn.commit()
                    return str(ticket_id)

        except psycopg.errors.InvalidTextRepresentation as e:
            logger.error(f"Invalid Data Format: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid Data Format: {str(e)}")
        except Exception as e:
            logger.error(f"Error logging support case: {e}")
            raise
