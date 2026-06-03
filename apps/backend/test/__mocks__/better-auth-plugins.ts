// Jest-only stub for better-auth/plugins — see better-auth.ts mock for context.
export const customSession = () => ({ id: 'customSession' });
export const admin = (_opts?: unknown) => ({ id: 'admin' });
export const magicLink = (_opts?: unknown) => ({ id: 'magicLink' });
export const organization = (_opts?: unknown) => ({ id: 'organization' });
