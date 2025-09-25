import * as express from 'express';
import {
  NotFoundError,
  MissingPropertyError,
  DatabaseError,
  BadRequestError,
  DuplicateEntryError,
  FolderCreationError,
  UnauthenticatedError,
  FilestoreError,
  ChatServiceError
} from '../errors';

export const routesErrorHandler = (error: unknown, res: express.Response) => {
  if (error instanceof NotFoundError) {
    res.status(404).send({ ...error });
  } else if (error instanceof MissingPropertyError || error instanceof BadRequestError) {
    res.status(400).send({ ...error });
  } else if (error instanceof DuplicateEntryError) {
    res.status(409).send({ ...error });
  } else if (error instanceof DatabaseError) {
    res.status(500).send({ ...error });
  } else if (error instanceof FolderCreationError) {
    res.status(500).send({ ...error });
  } else if (error instanceof UnauthenticatedError) {
    res.status(401).send({ ...error });
  } else if (error instanceof FilestoreError) {
    res.status(500).send({ ...error });
  } else if (error instanceof ChatServiceError) {
    res.status(500).send({ ...error });
  }
  throw error;
};

/**
 * Create headers for the  request.
 * @param originalHeaders
 * @private
 */
export const createHeaders = (
  originalHeaders: Record<string, string | string[] | undefined>
): Record<string, string> => {
  const Headers: Record<string, string> = {};

  Object.entries(originalHeaders).forEach(([key, value]) => {
    if (value !== undefined && typeof value === 'string') {      
        Headers[key] = value;
    }
    // If dealing with an array of values, join them with a comma.
    else if (Array.isArray(value)) {
      Headers[key] = value.join(', ');
    }
  });

  // Explicitly remove the 'cookie' header to prevent sending the main app's cookies to the backend service.
  // delete Headers.cookie;
  delete Headers['content-length'];

  return Headers;
};

export const DEFAULT_REGION = 'us';
