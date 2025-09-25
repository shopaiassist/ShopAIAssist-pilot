import Axios from 'axios';

import { apiError } from './index';

export class EmailAPI {
  private apiEmail = Axios.create({ baseURL: '/api/email' });

  private handleError(error: Error) {
    apiError('EmailAPI', error);
  }

  /**
   * Function provided to Delphi to get the secure URL to trigger skill complete notification emails.
   * See the readme for an explanation of how this process works.
   */
  async getEmailUrl(skillId: string, flowId: string): Promise<string> {
    const response = await this.apiEmail
      .get('/secure-url', {
        params: {
          skillId,
          flowId,
        },
      })
      .catch(this.handleError);
    return response?.data?.url || '';
  }
}
