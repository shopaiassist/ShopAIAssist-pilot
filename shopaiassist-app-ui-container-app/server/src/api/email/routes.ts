import { AxiosError } from 'axios';
import express from 'express';
import PromiseRouter from 'express-promise-router';

import EmailService from './service';

export const EMAIL_PATHS = {
  SECURE_URL: '/secure-url',
  SKILL_NOTIFICATION: '/skill-notification',
};

/** Routes for sending emails to users */
export class EmailRoutes {
  public static routes(): express.Router {
    const router = PromiseRouter();
    const service = new EmailService();

    /**
     * Returns a secure URL for the API call to send a skill complete email.
     *
     * GET /api/email/secure-url
     */
    router.get(EMAIL_PATHS.SECURE_URL, async (req: express.Request, res: express.Response) => {
      const { skillId, flowId } = req.query as { [key: string]: string };

      // If any query parameter is missing, return a 400 error
      if (!skillId || !flowId) {
        res.status(400).send({
          message: 'Missing required parameter',
          code: 'missing_required_parameter',
        });
        return;
      }

      const user = req.session.user;
      // If there is no logged in user, return a 401 error.
      // TODO: Make this use a general security middleware.
      if (!user) {
        res.status(401).send({
          message: 'No authorized user',
          code: 'no_authorized_user',
        });
        return;
      }

      const userGuid = user.user.userGuid;
      const email = user.user.email;
      const url = service.getSecureUrl(skillId, flowId, userGuid, email);
      res.send({ url });
    });

    /**
     * Sends a skill complete notification email to a user.
     *
     * POST /api/email/skill-notification
     */
    router.post(EMAIL_PATHS.SKILL_NOTIFICATION, async (req: express.Request, res: express.Response) => {
      const { skillId, flowId, userGuid, email, secureHash } = req.query as { [key: string]: string };
      const skillData = req.body;

      // If any query parameter is missing, return a 400 error
      if (!skillId || !flowId || !userGuid || !email || !secureHash) {
        res.status(400).send({
          message: 'Missing required parameter',
          code: 'missing_required_parameter',
        });
        return;
      }

      // If the secure hash is invalid, return a 401 error
      if (!service.verifySecureHash(skillId, flowId, userGuid, decodeURIComponent(secureHash))) {
        res.status(401).send({
          message: 'Unauthorized request',
          code: 'invalid_secure_hash',
        });
        return;
      }

      // Send the skill complete email
      try {
        const responseMsg = await service.sendSkillCompleteEmail(userGuid, email, skillId, flowId, skillData);
        res.send({
          success: true,
          message: responseMsg,
        });
      } catch (error) {
        const err = error as AxiosError;
        const code = err.response?.status || 500;
        res.status(code).send({
          success: false,
          message: err.message || '',
          code: 'email_send_error',
        });
      }
    });

    return router;
  }
}
