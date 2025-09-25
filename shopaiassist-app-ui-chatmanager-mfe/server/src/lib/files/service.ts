import { UserProfile } from 'react/dist/types/auth';
import { IncomingHttpHeaders } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_REGION, createHeaders } from '../utils/routes-utils';
import { FilestoreError } from '../errors';

/**
 * Class to handle integration with the Mercury file store service.
 * This class provides methods to create and delete file collections, and to get the Mercury service URL based on region.
 */
export default class MercuryIntegration {
  public static MERCURY_ROUTES = {
    FILE_COLLECTION: (fileCollectionId: string) => `/collection/${fileCollectionId}`
  };
  constructor() {}

  /**
   * Creates a new file collection ID.
   * If a matter file collection ID is provided, it uses that ID; otherwise, it generates a new one.
   * Sends a POST request to create the file collection in the Mercury service.
   *
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @returns {Promise<string>} The newly created or provided file collection ID.
   * @throws {FilestoreError} If the file collection cannot be created.
   */
  async createFileCollectionId(
    headers: IncomingHttpHeaders,
    user: Record<string, string> & UserProfile
  ): Promise<string> {
    const mercuryUrl = MercuryIntegration.getMercuryUrl(user?.region);
    const newFileCollectionId = uuidv4();
    let createFileCollection;
    try {
      createFileCollection = await fetch(
        `${mercuryUrl}${MercuryIntegration.MERCURY_ROUTES.FILE_COLLECTION(newFileCollectionId)}`,
        {
          method: 'POST',
          headers: { ...createHeaders(headers) }
        }
      );
      if (createFileCollection.status === 201) {
        return newFileCollectionId;
      } else {
        throw new Error(
          `Unable to create new file collection id, request failed with status: ${createFileCollection.status} and with body: ${createFileCollection.body}`
        );
      }
    } catch (error) {
      throw new FilestoreError('Unable to create new folder', error as Error);
    }
  }

  /**
   * Deletes an existing file collection in the Mercury service.
   * Sends a DELETE request to remove the file collection.
   *
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} fileCollectionId - The ID of the file collection to delete.
   * @returns {Promise<void>} A promise that resolves when the file collection is deleted.
   * @throws {FilestoreError} If the file collection cannot be deleted.
   */
  async deleteFileCollection(
    headers: IncomingHttpHeaders,
    user: Record<string, string> & UserProfile,
    fileCollectionId: string
  ): Promise<void> {
    const mercuryUrl = MercuryIntegration.getMercuryUrl(user?.region);
    let deleteFileCollection;
    try {
      deleteFileCollection = await fetch(
        `${mercuryUrl}${MercuryIntegration.MERCURY_ROUTES.FILE_COLLECTION(fileCollectionId)}`,
        {
          method: 'DELETE',
          headers: { ...createHeaders(headers) }
        }
      );
      if (deleteFileCollection.status !== 200) {
        throw new Error(
          `Unable to delete file collection id, request failed with status: ${deleteFileCollection.status} and with body: ${deleteFileCollection.body}`
        );
      }
    } catch (error) {
      throw new FilestoreError(`Unable to delete file collection for Id: ${fileCollectionId}`, error as Error);
    }
  }

  /**
   * Get Mercury backend URL from config based on the user's region info.
   *
   * @param {string} [region=DEFAULT_REGION] - The region identifier.
   * @returns {string} The Mercury backend URL for the specified region.
   */
  public static getMercuryUrl(region = DEFAULT_REGION): string {
    const mercuryBackendRegions = JSON.parse(process.env.MERCURY_URL_REGIONS || '{}');
    const mercuryUrl = mercuryBackendRegions[region];
    return mercuryUrl;
  }
}
