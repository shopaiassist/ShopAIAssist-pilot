
### Liquibase

Liquibase automates database schema changes and tracks them with versioned, repeatable scripts. This ensures that everyone on a team can apply or roll back changes consistently in any environment. It helps maintain a clear change history and avoids manual synchronization issues across development, testing, and production databases.

### Liquibase Dataflow

     ┌──────────────────────────────────┐
     │ Developer’s Local Filesystem     │
     │ - Liquibase XML Changesets       │
     │ - liquibase.properties           │
     └───────────────┬──────────────────┘
                     │
                     ▼
     ┌──────────────────────────────────┐
     │     Liquibase Command-Line       │
     │  (e.g., liquibase update)        │
     │ - Reads liquibase.properties     │
     │ - Loads XML changesets           │
     │ - Connects to target DB          │
     └───────────────┬──────────────────┘
                     │
                     ▼
     ┌──────────────────────────────────┐
     │         Database Server          │
     │ - Applies or rolls back changes  │
     │ - Tracks each changeset status   │
     └──────────────────────────────────┘

1) Liquibase reads your local XML changesets and properties file.
2) Liquibase then connects to the configured database.
3) It checks which changesets have or have not applied.
4) New changesets are executed in order, updating the database schema or data.
5) Liquibase logs the applied changes in a dedicated DATABASECHANGELOG table for tracking

## Installation

1) Install Liquibase (if not already installed).
2) Place your liquibase.properties file in the same directory as your XML script (e.g., initial_liquibase_sql.xml).
3) In liquibase.properties, set:
       url=jdbc:postgresql://HOST:PORT/DB
       username=YOUR_DB_USER
       password=YOUR_DB_PASSWORD
       driver=org.postgresql.Driver
       classpath=path/to/postgresql/driver.jar
       changeLogFile=initial_liquibase_sql.xml
4) Open a terminal or command prompt in that directory.
5) Run:
  liquibase update

### Sample Execution 

$ liquibase update
####################################################
##   _     _             _ _                      ##
##  | |   (_)           (_) |                     ##
##  | |    _  __ _ _   _ _| |__   __ _ ___  ___   ##
##  | |   | |/ _` | | | | | '_ \ / _` / __|/ _ \  ##
##  | |___| | (_| | |_| | | |_) | (_| \__ \  __/  ##
##  \_____/_|\__, |\__,_|_|_.__/ \__,_|___/\___|  ##
##              | |                               ##
##              |_|                               ##
##                                                ##
##  Get documentation at docs.liquibase.com       ##
##  Get certified courses at learn.liquibase.com  ##
##                                                ##
####################################################
Starting Liquibase at 10:42:53 using Java 11.0.26 (version 4.31.1 #6739 built at 2025-02-13 13:46+0000)
Liquibase Version: 4.31.1
Liquibase Open Source 4.31.1 by Liquibase
Running Changeset: initial_liquibase_sql.xml::1::6114315
Running Changeset: initial_liquibase_sql.xml::2::6114315
Running Changeset: initial_liquibase_sql.xml::3::6114315
Running Changeset: initial_liquibase_sql.xml::4::6114315
Running Changeset: initial_liquibase_sql.xml::5::6114315
Running Changeset: initial_liquibase_sql.xml::6::6114315
Running Changeset: initial_liquibase_sql.xml::7::6114315
Running Changeset: initial_liquibase_sql.xml::8::6114315
Running Changeset: initial_liquibase_sql.xml::9::6114315
Running Changeset: initial_liquibase_sql.xml::10::6114315
Running Changeset: initial_liquibase_sql.xml::11::6114315
Running Changeset: initial_liquibase_sql.xml::12::6114315
Running Changeset: initial_liquibase_sql.xml::13::6114315
Running Changeset: initial_liquibase_sql.xml::14::6114315
Running Changeset: initial_liquibase_sql.xml::15::6114315
Running Changeset: initial_liquibase_sql.xml::16::6114315

UPDATE SUMMARY
Run:                         16
Previously run:               0
Filtered out:                 0
-------------------------------
Total change sets:           16

Liquibase: Update has been successful. Rows affected: 22
Liquibase command 'update' was executed successfully.

