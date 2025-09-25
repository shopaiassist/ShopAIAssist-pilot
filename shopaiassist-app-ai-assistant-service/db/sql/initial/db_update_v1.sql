CREATE TYPE ct_ai_assistantdb."tp_search_scope_type" AS ENUM (
	'document_only',
	'kb_only',
	'document_and_kb',
	'whole_document');

ALTER TABLE ct_ai_assistantdb.tb_chat_messages
    ADD COLUMN IF NOT EXISTS ai_ticket_subject VARCHAR(500),
    ADD COLUMN IF NOT EXISTS ai_ticket_description TEXT,
    ADD COLUMN IF NOT EXISTS ai_ticket_product VARCHAR(200),
    ADD COLUMN IF NOT EXISTS ticket_id UUID,
    ADD COLUMN IF NOT EXISTS document_id UUID,
    ADD COLUMN IF NOT EXISTS search_scope ct_ai_assistantdb.tp_search_scope_type;


CREATE TABLE ct_ai_assistantdb.tb_documents (
	file_id uuid DEFAULT gen_random_uuid() NOT NULL,
	created_timestamp timestamptz DEFAULT now() NOT NULL,
	user_query_id uuid NOT NULL,
	document_id uuid NOT NULL,
	org_id int2 NOT NULL,
	tenant_id varchar(200) NOT NULL,
	user_id varchar(250) NOT NULL,
	updated_timestamp timestamptz DEFAULT now() NOT NULL,
	file_name varchar(200) NOT NULL,
	file_size int2 NOT NULL,
	file_type varchar(200) NOT NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT tb_documents_pkey PRIMARY KEY (file_id, created_timestamp)
)
PARTITION BY RANGE (created_timestamp);

ALTER TABLE ct_ai_assistantdb.tb_documents ADD CONSTRAINT tb_documents_org_id_fkey FOREIGN KEY (org_id) REFERENCES ct_ai_assistantdb.tb_organization(org_id);