import { SKILL_TO_FAC_MAPPINGS } from '@/-skill-mapping';
import { LOG } from 'react';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

import { EMAIL_PATHS } from './routes';

interface EmailServiceConfig {
  appDomain: string;
  emailSecretString: string;
  iterableUrl: string;
  iterableApiKey: string;
  iterableSkillCompleteCampaignId: number;
}

const ITERABLE_PATHS = {
  EMAIL_TARGET: '/email/target',
};

/** Service to handle sending emails to users */
export default class EmailService {
  private config: EmailServiceConfig;
  private iterableApi: AxiosInstance;

  constructor() {
    // Set config values from environment variables
    this.config = {
      appDomain: process.env.APP_DOMAIN || '',
      emailSecretString: process.env.EMAIL_SECRET || '',
      iterableUrl: process.env.ITERABLE_API_URL || '',
      iterableApiKey: process.env.ITERABLE_API_KEY || '',
      iterableSkillCompleteCampaignId: parseInt(process.env.ITERABLE_SKILL_COMPLETE_CAMPAIGN_ID || ''),
    };

    // If any property in this.config is missing, throw an error
    for (const key in this.config) {
      if (!this.config[key as keyof EmailServiceConfig]) {
        throw new Error(`Missing required configuration: ${key}`);
      }
    }

    // Create an Axios instance for the Iterable API
    this.iterableApi = axios.create({
      baseURL: this.config.iterableUrl,
      headers: { 'Api-Key': this.config.iterableApiKey },
    });

    // Add a response interceptor (useful for debugging Iterable API response errors)
    this.iterableApi.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        LOG.error('Iterable response error', error.response ? error.response.data : error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Function to generate secure hash
   *
   * @param userGuid
   * @param skillId
   * @param flowId
   * @returns hash
   */
  protected generateHash(userGuid: string, skillId: string, flowId: string): string {
    const secretKey = this.config.emailSecretString;
    const hash = crypto
      .createHash('sha256')
      .update(userGuid)
      .update(skillId)
      .update(flowId)
      .update(secretKey)
      .digest('base64');
    return hash;
  }

  /**
   * Function to send a skill complete notification email to a user.
   * @param userId
   * @param emailAddress
   * @param skillId
   * @param flowId
   */
  public async sendSkillCompleteEmail(
    userId: string,
    emailAddress: string,
    skillId: string,
    flowId: string,
    skillData: Record<string, string>
  ): Promise<string> {
    // The Skills MFE should provide the skill URL, but default to the work page if not provided.
    const skillUrl = skillData.skillUrl || `${this.config.appDomain}/work`;

    // The Skills MFE should provide the skill name, but default to the FAC description if not provided.
    const skillName =
      skillData.skillName || SKILL_TO_FAC_MAPPINGS.find((skill) => skill.skillId === skillId)?.description || '';

    // Send skill complete notification email
    try {
      const response = await this.iterableApi.post(ITERABLE_PATHS.EMAIL_TARGET, {
        campaignId: this.config.iterableSkillCompleteCampaignId,
        recipientEmail: emailAddress,
        recipientUserId: userId,
        dataFields: {
          skillName,
          skillUrl,
          ...skillData,
        },
      });
      return response.data.msg;
    } catch (err) {
      LOG.error(`Could not send email: ${err}`);
      throw err;
    }
  }

  /**
   * Function to generate a secure URL for the API call to send a skill complete email.
   * @param skillId
   * @param flowId
   * @param userGuid
   * @param email
   */
  public getSecureUrl(skillId: string, flowId: string, userGuid: string, email: string): string {
    const domain = this.config.appDomain;
    const hash = encodeURIComponent(this.generateHash(userGuid, skillId, flowId));
    const url = `${domain}/api/email${EMAIL_PATHS.SKILL_NOTIFICATION}?skillId=${skillId}&flowId=${flowId}&userGuid=${userGuid}&email=${email}&secureHash=${hash}`;
    return url;
  }

  /**
   * Function to verify the secure hash for the API call to send a skill complete email.
   * @param skillId
   * @param flowId
   * @param userGuid
   * @param secureHash
   */
  public verifySecureHash(skillId: string, flowId: string, userGuid: string, secureHash: string): boolean {
    const hash = this.generateHash(userGuid, skillId, flowId);
    return hash === secureHash;
  }
}
