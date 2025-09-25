import LOG from '../services/LoggingService';

/** Request options for the sendApiRequest function */
interface RequestOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit | null;
}

/**
 * Send an API request using fetch. This is a wrapper around fetch that handles errors and setting the base URL.
 * In production, the base URL would be set to the domain of this app. Since this is a microfrontend architecture,
 * if we used relative paths, the request would be sent to the domain of the container microfrontend that is making the request.
 * @param path
 * @param method
 * @param headers
 * @param body
 */
export const sendApiRequest = async ({
  path,
  method = 'GET',
  headers = {},
  body = null,
}: RequestOptions): Promise<Response> => {
  const baseUrl = process.env.APP_DOMAIN || '';
  const requestOptions: RequestInit = {
    method,
    headers,
    body,
  };

  try {
    const response = await fetch(`${baseUrl}${path}`, requestOptions);
    return response;
  } catch (error) {
    // Handle or throw the error as needed
    LOG.error('Error making API request:', error);
    throw error;
  }
};
