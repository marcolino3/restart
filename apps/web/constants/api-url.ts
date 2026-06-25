// Same-origin, relative API base. The ingress routes `/api` to the backend
// (which has a global `/api` prefix), so this works identically across
// localhost, staging and production. Keeping it relative means the built
// frontend image is domain-agnostic and can be promoted without a rebuild.
export const API_URL = "/api";
