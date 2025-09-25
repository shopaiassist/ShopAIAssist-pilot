"""This module provides functionality for logging conversation and feedback data to Amazon S3 in Parquet format.

The module includes:
- A utility function to get the current UTC time.
- The `S3Logger` class for managing the conversion of data to DataFrames and writing them to S3.

Classes:
    - S3Logger: Handles the initialization of the S3 client, conversion of data to Pandas DataFrames,
      and asynchronous writing of these DataFrames to specified S3 buckets in Parquet format.

Functions:
    - get_current_time: Returns the current UTC time as a datetime object.

The `S3Logger` class includes methods to:
- Initialize the S3 client.
- Convert keyword arguments into a Pandas DataFrame.
- Write conversation and feedback data asynchronously to S3, organized by date and tenant.

Dependencies:
    - boto3: For interfacing with AWS S3.
    - asyncio: For asynchronous operations.
    - pandas: For data manipulation and conversion to Parquet format.
    - datetime: For handling date and time operations.
    - io.BytesIO: For handling in-memory byte streams.
    - src.utils: Contains utility functions for configuration loading and caching.

This module assumes that the configuration file provides the correct S3 bucket paths for storing conversation and
feedback data.
"""
import boto3
import asyncio
import pandas as pd
import datetime
from io import BytesIO
from src.utils import load_config, ttl_cache
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def get_current_time():
    """Get the current UTC time.

    Returns:
        datetime: The current datetime in UTC.
    """
    return datetime.datetime.now(datetime.timezone.utc)


class S3Logger:
    """Logger class for writing data to S3 in Parquet format."""

    def __init__(self):
        """Initialize the S3Logger with configuration settings."""
        config = load_config()
        self.conv_bucket = config["CONVERSATION_HISTORY_DIR"]
        self.feedback_bucket = config["FEEDBACK_DIR"]
        self.s3_client = boto3.client("s3")

    @ttl_cache(ttl=1800)
    def initialize_s3_client(self):
        """Initialize the S3 client if it hasn't been initialized yet."""
        if self.s3_client is None:
            self.s3_client = boto3.client("s3")

    def kwargs_to_dataframe(self, **kwargs) -> pd.DataFrame:
        """Convert keyword arguments to a pandas DataFrame.

        Args:
            **kwargs: Arbitrary keyword arguments representing data.

        Returns:
            pandas.DataFrame: DataFrame containing the provided data.
        """
        data = {}
        for key, value in kwargs.items():
            if isinstance(value, list):
                data[key] = [", ".join(map(str, value))]  # Join list items into a string
            else:
                data[key] = [value]  # Wrap single values in a list
        df = pd.DataFrame(data)
        return df

    async def write_parquet_to_s3(self, df: pd.DataFrame, bucket: str, key: str):
        """Write a DataFrame to an S3 bucket in Parquet format.

        Args:
            df (pandas.DataFrame): The DataFrame to write.
            bucket (str): The S3 bucket name.
            key (str): The S3 key (path) where the file will be stored.
        """
        self.initialize_s3_client()
        buffer = BytesIO()
        df.to_parquet(buffer, index=False)
        buffer.seek(0)
        await asyncio.to_thread(self.s3_client.put_object, Bucket=bucket[5:], Key=key, Body=buffer.getvalue())

    async def write_conversation(self, chat_id: str, user_query_id: str, bot_resp_id: str, **kwargs) -> pd.DataFrame:
        """Write conversation data to S3.

        Args:
            chat_id (str): The chat ID.
            user_query_id (str): The user query ID.
            bot_resp_id (str): The bot response ID.
            **kwargs: Additional keyword arguments representing data.

        Returns:
            pd.DataFrame: DataFrame containing the conversation data.
        """
        self.initialize_s3_client()
        current_datetime = get_current_time()
        year = "year=" + str(current_datetime.year)
        month = "month=" + str(current_datetime.month).zfill(2)
        day = "day=" + str(current_datetime.day).zfill(2)
        tenant = "tenantid=" + kwargs["tenant_id"]
        out_dir = year + "/" + month + "/" + day + "/" + tenant + "/" + bot_resp_id + ".parquet"
        data = kwargs
        data["date"] = current_datetime
        data["chat_id"] = chat_id
        data["user_query_id"] = user_query_id
        data["bot_resp_id"] = bot_resp_id
        df = self.kwargs_to_dataframe(**data)
        df["date"] = pd.to_datetime(df["date"])

        await self.write_parquet_to_s3(df, self.conv_bucket, out_dir)
        return df

    async def write_feedback(self, chat_id: str, user_query_id: str, bot_resp_id: str, **kwargs) -> pd.DataFrame:
        """Write feedback data to S3.

        Args:
            chat_id (str): The chat ID.
            user_query_id (str): The user query ID.
            bot_resp_id (str): The bot response ID.
            **kwargs: Additional keyword arguments representing feedback data.

        Returns:
            pandas.DataFrame: DataFrame containing the feedback data.
        """
        self.initialize_s3_client()
        current_datetime = get_current_time()
        year = "year=" + str(current_datetime.year)
        month = "month=" + str(current_datetime.month).zfill(2)
        day = "day=" + str(current_datetime.day).zfill(2)
        tenant = "tenantid=" + kwargs["tenant_id"]
        if bot_resp_id:  # Single message feedback
            out_dir = year + "/" + month + "/" + day + "/" + tenant + "/" + bot_resp_id + ".parquet"
        else:  # Global conversation feedback
            out_dir = year + "/" + month + "/" + day + "/" + tenant + "/" + chat_id + ".parquet"
        data = kwargs
        data["feedback_date"] = current_datetime
        data["chat_id"] = chat_id
        data["user_query_id"] = user_query_id
        data["bot_resp_id"] = bot_resp_id
        df = self.kwargs_to_dataframe(**data)
        df["feedback_date"] = pd.to_datetime(df["feedback_date"])
        await self.write_parquet_to_s3(df, self.feedback_bucket, out_dir)
        return df

    async def write_entry_point(self, entry_point, bot_resp_id, tenant):
        """Search for the entry point in the S3 bucket and add the product entry point to it."""
        self.initialize_s3_client()
        current_datetime = get_current_time()
        year = "year=" + str(current_datetime.year)
        month = "month=" + str(current_datetime.month).zfill(2)
        day = "day=" + str(current_datetime.day).zfill(2)
        tenant_str = "tenantid=" + tenant
        out_dir = year + "/" + month + "/" + day + "/" + tenant_str + "/" + bot_resp_id + ".parquet"
        try:
            obj = self.s3_client.get_object(Bucket=self.conv_bucket[5:], Key=out_dir)
            df = pd.read_parquet(BytesIO(obj["Body"].read()))
            df.loc[0, "product_entry"] = entry_point
            await self.write_parquet_to_s3(df, self.conv_bucket, out_dir)
        except Exception as e:
            logging.warn(f"Conversation record not found in the S3 bucket. Retrying in 3 seconds. Error: {e}")
            await asyncio.sleep(3)
            obj = self.s3_client.get_object(Bucket=self.conv_bucket[5:], Key=out_dir)
            df = pd.read_parquet(BytesIO(obj["Body"].read()))
            df.loc[0, "product_entry"] = entry_point
            await self.write_parquet_to_s3(df, self.conv_bucket, out_dir)
