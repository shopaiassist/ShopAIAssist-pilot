const APP_DOMAIN = process.env.APP_DOMAIN || '';
const ONEPASS_SIGNON_URL = process.env.ONEPASS_SIGNON_URL || '';

/**
 * The default URL to return the user to after they login
 */
const DEFAULT_RETURN_TO = `${APP_DOMAIN}/api/auth/onepass`;

/**
 * @param returnto  An absolute URL to return the user after logging in
 * @returns         An absolute URL to the OnePass login page
 */
export const getLoginUrl = (returnto = DEFAULT_RETURN_TO) => {
  return `${ONEPASS_SIGNON_URL}?productid=ShopAIAssist&returnto=${encodeURIComponent(returnto)}`;
};

/**
 * If the user selected Remember me when they logged in this will log them
 * out on OnePass as well. If we didn't use this URL the user would login to the same user
 * as soon as we redirected the user to the OnePass login page.
 * @returns         An absolute URL to the OnePass logout page
 */
export const getLogoutUrl = () => {
  return `${ONEPASS_SIGNON_URL}/signout?productid=ShopAIAssist&returnto=${encodeURIComponent(getLoginUrl())}`;
};

/**
 * Navigates the user to the OnePass login page
 * @param returnto  An absolute URL to return the user after logging in
 */
export const navigateToLogin = (returnto = DEFAULT_RETURN_TO) => {
  location.href = getLoginUrl(returnto);
};

/**
 * Navigates the user to logout on OnePass
 */
export const navigateToLogout = () => {
  location.href = getLogoutUrl();
};
