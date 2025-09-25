/**
 * Returns the `origin` value expected by the `cors` Express middleware.
 *
 * Technically this is used by a build tool (Webpack) in one instance and the runtime from the server/ source in the
 * other, even though the file lives in client/tool/.
 */
export const getCorsOrigin = (): false | string[] => {
  return !process.env.CORS_ORIGINS ? false : process.env.CORS_ORIGINS.split(',');
};
