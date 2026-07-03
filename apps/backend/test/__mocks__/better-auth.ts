// Jest-only stub for better-auth (which ships as ESM and breaks ts-jest's
// CommonJS transform). Tests don't exercise the real auth flow; they only
// need the module to load so unrelated specs can import resolvers that
// transitively touch `@/lib/auth`.
export const betterAuth = () => ({
  api: {
    getSession: () => Promise.resolve(null),
    signUpEmail: () => Promise.resolve({ token: null, user: {} }),
  },
  handler: () => Promise.resolve(new Response('', { status: 404 })),
});
