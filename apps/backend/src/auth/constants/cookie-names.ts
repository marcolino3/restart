const prefix = process.env.COOKIE_PREFIX || '';

export const AUTH_COOKIE_NAME = `${prefix}Authentication`;
export const REFRESH_COOKIE_NAME = `${prefix}Refresh`;
