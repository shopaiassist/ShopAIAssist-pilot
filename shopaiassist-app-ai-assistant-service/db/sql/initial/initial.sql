/*
 @Author : George Viju A (6114315)
        @Description : A SQL script to create the database schema for the AI Assistant Chatbot.

    The schema includes the following tables:
        1. tb_organization: Contains the organization details.
        2. tb_skills: Contains the skills available for the chatbot.
        3. tb_org_allowed_skills: Contains the organization allowed skills.
        4. tb_chats: Contains the user chat title.
        5. tb_chat_messages: Contains the chat messages for the user.
        6. tb_chat_log: Contains the chat log for the user for analysis & troubleshooting.
        7. tb_ticket: Contains the Salesforce ticket for the user.
        8. tb_feedback: Contains the feedback for the user.

    The script also creates the following types:
        1. tp_user_account_type: Enum type for user account type.
        2. tp_message_sender: Enum type for message sender.
        3. tp_message_type: Enum type for message type.
        4. tp_feedback_symbol: Enum type for feedback symbol.
        5. tp_orchestration_type: Enum type for orchestration type.

    The script also creates the following indexes:
        1. tb_chats_multi_idx: Multi-column index for tb_chats.
        2. tb_chat_messages_multi_idx: Multi-column index for tb_chat_messages.
        3. tb_chat_log_multi_idx: Multi-column index for tb_chat_log.
        4. tb_ticket_multi_idx: Multi-column index for tb_ticket.
        5. tb_feedback_multi_idx: Multi-column index for tb_feedback.

    The script also creates the following partitions:
        1. Partition for tb_chats.
        2. Partition for tb_chat_messages.
        3. Partition for tb_chat_log.
        4. Partition for tb_ticket.
        5. Partition for tb_feedback.

    The script is designed to be run on a PostgreSQL database.
    The script is intended to be used as part of the initial setup of the AI Assistant Chatbot database.
    The script can be run using psql or any other PostgreSQL client.
    The script assumes that the necessary extensions (pgcrypto, pg_partman) are already installed in the database.
*/

CREATE SCHEMA IF NOT EXISTS ct_ai_assistantdb;

CREATE TYPE ct_ai_assistantdb.tp_user_account_type AS ENUM ('internal', 'external');
CREATE TYPE ct_ai_assistantdb.tp_message_sender AS ENUM ('ai', 'user');
CREATE TYPE ct_ai_assistantdb.tp_message_type AS ENUM ('text','files');
CREATE TYPE ct_ai_assistantdb.tp_feedback_symbol AS ENUM ('positive','negative');
CREATE TYPE ct_ai_assistantdb.tp_orchestration_type AS ENUM ('skill-routing','agentic');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA partman;

CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_organization (
    org_id SMALLINT PRIMARY KEY NOT NULL,
    org_name VARCHAR(50) NOT NULL,
    created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO ct_ai_assistantdb.tb_organization (org_id, org_name) VALUES (1, 'Shopaiassist');

-- CREATE TABLE FOR SKILLS 1. PRODUCT SUPPORT

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_skills (
    skill_id SMALLINT PRIMARY KEY NOT NULL,
    skill_name VARCHAR(50) NOT NULL,
    created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO ct_ai_assistantdb.tb_skills (skill_id, skill_name) VALUES (1, 'Product Support');

-- CREATE TABLE FOR ORGANIZATION ALLOWED SKILLS

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_org_allowed_skills (
    org_id SMALLINT NOT NULL,
    skill_id SMALLINT NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    PRIMARY KEY (org_id, skill_id),
    FOREIGN KEY (org_id) REFERENCES ct_ai_assistantdb.tb_organization(org_id),
    FOREIGN KEY (skill_id) REFERENCES ct_ai_assistantdb.tb_skills(skill_id),
    created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_updated_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO ct_ai_assistantdb.tb_org_allowed_skills (org_id, skill_id,is_enabled) VALUES (1, 1,true);
INSERT INTO ct_ai_assistantdb.tb_org_allowed_skills (org_id, skill_id,is_enabled) VALUES (2, 2,true);

-- CREATE TABLE FOR USER CHAT TITLE

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_chats(
    chat_id UUID DEFAULT gen_random_uuid() NOT NULL,
    created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (chat_id,created_timestamp), 
    chat_title TEXT NOT NULL,
    user_id VARCHAR(200) NOT NULL,
    email_address VARCHAR(250) NOT NULL,  
    org_id SMALLINT REFERENCES ct_ai_assistantdb.tb_organization(org_id) NOT NULL,
    tenant_id VARCHAR(200) NOT NULL,
    last_updated_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
) PARTITION BY RANGE (created_timestamp);

-- CREATE TABLE FOR CHAT MESSAGES FOR THE USER

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_chat_messages (
    user_query_id UUID DEFAULT gen_random_uuid() NOT NULL,
    created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_query_id,created_timestamp),
    chat_id UUID NOT NULL,    
    account_type ct_ai_assistantdb.tp_user_account_type,
    bot_response_id UUID,
    sender ct_ai_assistantdb.tp_message_sender NOT NULL,
    message_type ct_ai_assistantdb.tp_message_type NOT NULL,
    user_query TEXT,
    user_id VARCHAR(250) NOT NULL,
    email_address VARCHAR(250) NOT NULL,         
    tenant_id VARCHAR(200) NOT NULL,
    org_id SMALLINT REFERENCES ct_ai_assistantdb.tb_organization(org_id) NOT NULL,    
    product_entry VARCHAR(500),         
    products JSONB, 
    product_line JSONB,             
    sources JSONB,              
    reformulated_query TEXT,   
    intent JSONB,            
    retrieved_urls JSONB,
    orchestration_type ct_ai_assistantdb.tp_orchestration_type, 
    open_ticket BOOLEAN,     
    ai_response TEXT
) PARTITION BY RANGE (created_timestamp);

-- CREATE TABLE FOR CHAT LOG FOR THE USER FOR ANAYSIS & TRUBBLESHOOTING

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_chat_log (
chat_log_id UUID DEFAULT gen_random_uuid() NOT NULL,
created_timestamp TIMESTAMPTZ DEFAULT now(),
PRIMARY KEY (chat_log_id, created_timestamp),
chat_id  UUID  NOT NULL,
user_query_id UUID NOT NULL,
tenant_id VARCHAR(200) NOT NULL,
user_id VARCHAR(250) NOT NULL,
email_address VARCHAR(250) NOT NULL, 
org_id SMALLINT REFERENCES ct_ai_assistantdb.tb_organization(org_id) NOT NULL, 
bot_response_id UUID,
predefined_answer  TEXT,
all_retrieved_urls JSONB,
orchestration_type ct_ai_assistantdb.tp_orchestration_type,
total_tokens BIGINT,
time_to_resolve_intent BIGINT,
time_to_start_streaming BIGINT,
time_to_stream_final_response BIGINT,
overall_retrieval_time BIGINT,
llm_reranker_time BIGINT
) PARTITION BY RANGE (created_timestamp);

-- CREATE TABLE FOR SALESFORCE TICKET FOR THE USER

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_ticket (
ticket_id UUID DEFAULT gen_random_uuid() NOT NULL,
created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
PRIMARY KEY (ticket_id, created_timestamp),
chat_id  UUID  NOT NULL,
user_query_id UUID NOT NULL,
bot_response_id UUID,
user_id VARCHAR(250) NOT NULL,
email_address VARCHAR(250) NOT NULL, 
org_id SMALLINT REFERENCES ct_ai_assistantdb.tb_organization(org_id) NOT NULL, 
tenant_id VARCHAR(200) NOT NULL,
ticket_subject TEXT,
ticket_description TEXT,
ticket_product VARCHAR(500),
ticket_number VARCHAR(500)
) PARTITION BY RANGE (created_timestamp);

-- CREATE TABLE FOR FEEDBACK FOR THE USER

CREATE TABLE IF NOT EXISTS ct_ai_assistantdb.tb_feedback (
feedback_id UUID DEFAULT gen_random_uuid() NOT NULL,
created_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
PRIMARY KEY (feedback_id, created_timestamp),
chat_id  UUID  NOT NULL,
user_query_id UUID NOT NULL, 
bot_response_id UUID,
user_id VARCHAR(250) NOT NULL,
email_address VARCHAR(250) NOT NULL, 
org_id SMALLINT REFERENCES ct_ai_assistantdb.tb_organization(org_id) NOT NULL, 
tenant_id VARCHAR(200) NOT NULL,
feedback_symbol ct_ai_assistantdb.tp_feedback_symbol,
comments TEXT
) PARTITION BY RANGE (created_timestamp);

-- CREATE INDEX---------------------------    
-- Multi-column index for tb_chats
CREATE INDEX tb_chats_multi_idx
ON ct_ai_assistantdb.tb_chats (created_timestamp,org_id, tenant_id, user_id, chat_id);

-- Multi-column index for tb_chat_messages
CREATE INDEX tb_chat_messages_multi_idx
ON ct_ai_assistantdb.tb_chat_messages (created_timestamp,org_id, tenant_id, user_id, chat_id);

-- Multi-column index for tb_chat_log
CREATE INDEX tb_chat_log_multi_idx
ON ct_ai_assistantdb.tb_chat_log (created_timestamp,org_id, tenant_id, user_id, chat_id);

-- Multi-column index for tb_ticket
CREATE INDEX tb_ticket_multi_idx
ON ct_ai_assistantdb.tb_ticket (created_timestamp,org_id, tenant_id, user_id, chat_id);

-- Multi-column index for tb_feedback
CREATE INDEX tb_feedback_multi_idx
ON ct_ai_assistantdb.tb_feedback (created_timestamp, org_id, tenant_id, user_id,chat_id);

-- -- CREATE PARTITION ------------------------------
--CREATE PARTITION FOR tb_CHATS

SELECT partman.create_parent(
    p_parent_table => 'ct_ai_assistantdb.tb_chats',
    p_control => 'created_timestamp',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake =>24
);

--CREATE PARTITION FOR tb_CHAT_MESSAGES 

SELECT partman.create_parent(
    p_parent_table => 'ct_ai_assistantdb.tb_chat_messages',
    p_control => 'created_timestamp',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake =>24
);

--CREATE PARTITION FOR tb_CHAT_LOG  

SELECT partman.create_parent(
    p_parent_table => 'ct_ai_assistantdb.tb_chat_log',
    p_control => 'created_timestamp',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake =>24
);

--CREATE PARTITION FOR tb_TICKET    

SELECT partman.create_parent(
    p_parent_table => 'ct_ai_assistantdb.tb_ticket',
    p_control => 'created_timestamp',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake =>24
);
   
--CREATE PARTITION FOR tb_FEEDBACK


SELECT partman.create_parent(
    p_parent_table => 'ct_ai_assistantdb.tb_feedback',
    p_control => 'created_timestamp',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake =>24
);

