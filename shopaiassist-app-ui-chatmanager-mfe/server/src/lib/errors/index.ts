import ChainedCustomError from 'typescript-chained-error';

/**
 * Abstract base class for all service-level errors, providing a code attribute for error identification.
 */
export abstract class ServiceError extends ChainedCustomError {
  code: string | undefined;
}

/**
 * Represents an error due to missing required properties in the input data.
 * This error typically results in a HTTP 400 Bad Request response when caught by the API layer.
 */
export class MissingPropertyError extends ServiceError {
  code = 'missing_property';
}

/**
 * Represents a general error for bad requests that do not fit other more specific error categories.
 * Typically results in a HTTP 400 Bad Request response when processed by the API layer.
 */
export class BadRequestError extends ServiceError {
  code = 'bad_request';
}

/**
 * Represents an error when attempting to create a record that already exists, violating uniqueness constraints.
 * This error usually leads to a HTTP 409 Conflict response in the API layer.
 */
export class DuplicateEntryError extends ServiceError {
  code = 'duplicate_entry';
}

/**
 * Represents an error when a requested resource is not found.
 * Typically translates to a HTTP 404 Not Found response in the API layer.
 */
export class NotFoundError extends ServiceError {
  code = 'not_found';
}

/**
 * Represents an error specific to Database operations, such as connection issues or query errors.
 * It's generally used to indicate server-side issues related to database operations.
 */
export class DatabaseError extends ServiceError {
  code = 'database_error';
}

/**
 * Represents an error specific to folder creation operations.
 * This error is thrown when there is an issue creating a new folder, such as a database insertion failure.
 */
export class FolderCreationError extends ServiceError {
  code = 'folder_creation_error';
}

/**
 * Represents an error specific to unauthenticated operations.
 * This error is thrown when an operation is attempted without proper authentication.
 */
export class UnauthenticatedError extends ServiceError {
  code = 'unauthenticated_error';
}

/**
 * Represents an error specific to file store operations.
 * This error is thrown when an operation related to file storage encounters an issue.
 */
export class FilestoreError extends ServiceError {
  code = 'filestore_error';
}

/**
 * Represents an error specific to  operations.
 * This error is thrown when an operation related to  encounters an issue.
 */
export class ChatServiceError extends ServiceError {
  code = 'chat_service_error';
}
