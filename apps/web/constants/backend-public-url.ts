// Same-origin, relative base for backend-served static assets (uploaded
// images). The backend serves them under `/api/uploads` (ServeStaticModule
// `serveRoot: '/api/uploads'` — a dedicated sub-path that does NOT overlap the
// global `/api` controller prefix) and the ingress routes `/api` to the
// backend. The upload controller returns `/${entity}/${id}.webp`, so
// `${BACKEND_PUBLIC_URL}${result.url}` resolves to
// `/api/uploads/${entity}/${id}.webp` — same-origin and domain-agnostic.
export const BACKEND_PUBLIC_URL = "/api/uploads";
