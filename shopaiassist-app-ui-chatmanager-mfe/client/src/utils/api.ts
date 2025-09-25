import { OnePassUserAuth, UserAuth } from 'react';
import { AxiosHeaders } from 'axios';

/** Request options for the sendApiRequest function */
interface RequestOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit | null;
}

/**
 * Send an API request using fetch. This is a wrapper around fetch that handles errors and sets the base URL.
 * In production, the base URL would be set to the domain of this app. Since this is a microfrontend architecture,
 * if we used relative paths, the request would be sent to the domain of the container microfrontend that is making the request.
 *
 * @param {RequestOptions} options - The options for the API request.
 * @param {string} options.path - The API endpoint path.
 * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} [options.method='GET'] - The HTTP method to use.
 * @param {HeadersInit} [options.headers={}] - The headers to include in the request.
 * @param {BodyInit | null} [options.body=null] - The body of the request.
 * @returns {Promise<Response>} The fetch API response.
 *
 * @throws Will throw an error if the fetch request fails.
 */
export const sendApiRequest = async ({
  path,
  method = 'GET',
  headers = {},
  body = null
}: RequestOptions): Promise<Response> => {
  const baseUrl = process.env.APP_DOMAIN ?? '';
  const requestOptions: RequestInit = {
    method,
    headers,
    body
  };

  try {
    const response = await fetch(`${baseUrl}${path}`, requestOptions);
    return response;
  } catch (error) {
    // Handle or throw the error as needed
    console.error('Error making API request:', error);
    throw error;
  }
};

/**
 * Enum for endpoints relating to chat/matter management
 */
export enum Endpoints {
  LIST = 'chats',
  GENERATE_NAME = 'generate-name',
  CHAT_BY_ID = 'chat/:chatId',
  RENAME_CHAT = 'chat/:chatId/rename',
}

/**
 * Get headers for an API request.
 *
 * @param {UserAuth} [userAuth] - The user authentication information.
 * @returns {AxiosHeaders} The headers to include in the API request.
 */
export const getHeaders = (userAuth?: UserAuth): AxiosHeaders => {
  const headers = new AxiosHeaders();
  const token = sessionStorage.getItem('token') ?? '';
  const onesourceData = sessionStorage.getItem('onesource-data') ?? '';
  const host_product = sessionStorage.getItem('host_product') || 'os';
  let accountType = 'External';

  try {
    accountType = JSON.parse(onesourceData).accountType;
  } catch (e) {
    console.error('Error parsing onesource data for "accountType" in chatmgmt:', e);
  }

  if (token !== '') {
    headers.set('authorization', token);
  }

  headers.set('x-account-type', accountType ?? 'External'); 
  headers.set('Content-Type', 'application/json');

  if ((userAuth as OnePassUserAuth)?.productId) {
    headers.set('x-op-product-id', (userAuth as OnePassUserAuth).productId);
  }

  headers.set('x-host-product', host_product);

  return headers;
};
