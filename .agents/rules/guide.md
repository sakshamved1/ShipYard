---
trigger: always_on
---

You are a senior full-stack engineer. We are building "Shipboard", a Feature Request & Public Roadmap Portal (a Canny/Featurebase alternative) as a MERN stack project that will be evaluated by reviewers. Quality, security and clean architecture matter more than speed. Work in small, verifiable steps and explain non-obvious decisions in short code comments.

PRODUCT
Users submit feature requests, upvote them, and discuss them in threaded markdown comments. Admins move requests through Under Review -> Planned -> In Progress -> Completed. A public 3-column Kanban roadmap (Planned | In Progress | Completed) reflects those states live.

TECH STACK (fixed)
- Monorepo with two folders: /server and /client (each with its own package.json, plus a root package.json with helper scripts).
- Server: Node 20+, Express 5, MongoDB with Mongoose, TypeScript (run with tsx), Zod for validation, jsonwebtoken, bcryptjs (cost 12), cookie-parser, cors, helmet, express-rate-limit, morgan, dotenv.
- Client: React 19 + Vite + TypeScript, Tailwind CSS v4, React Router, TanStack Query, react-markdown + remark-gfm + rehype-sanitize.
- UI STANDARD (mandatory): every interface component must be built with coss ui (https://coss.com/ui). It is built on Base UI + Tailwind v4 and is installed as source through the shadcn CLI. Before writing UI code, read the docs at https://coss.com/ui/docs/get-started and the relevant component page. Do NOT guess component APIs. Note that coss uses Base UI's `render` prop, not Radix's `asChild`. Do not introduce another component library (no MUI, Chakra, Ant, etc.). Small behavior-only libraries are fine.

UNIVERSAL SECURITY REQUIREMENTS (non-negotiable)
- Pair-token auth: JWT access token (15 minutes) + refresh token (7 days), BOTH delivered only in httpOnly cookies. Never store tokens in localStorage/sessionStorage and never return them in JSON bodies.
- Refresh token rotation on every refresh, with reuse detection (if an already-used refresh token is presented, revoke the whole token family).
- Signup with simulated email verification, login, logout, forgot password, reset password.
- Passwords hashed with bcrypt. Reset/verification tokens are random, stored only as SHA-256 hashes, single-use and expiring.
- helmet, strict CORS allow-list with credentials, rate limiting on auth routes, request body size limit, Zod validation on every input, no raw user input in Mongo queries (prevents operator injection), and generic error messages for auth failures (no user enumeration).
- Sanitize rendered markdown on the client (rehype-sanitize) to prevent XSS.

DOMAIN MODEL (summary)
- User: name, email (unique, lowercase), passwordHash, role ("user" | "admin"), isEmailVerified, verification/reset token hashes + expiries, createdAt.
- Post: title, description (markdown), category ("UI/UX" | "Integrations" | "Performance" | "General"), status ("under_review" | "planned" | "in_progress" | "completed", default under_review), author (ref User), voters [ObjectId], voteCount, commentCount, statusHistory[], timestamps.
- Comment: post (ref), author (ref), body (markdown), parent (ref | null), root (ref | null), depth, isDeleted, editedAt, timestamps.
- RefreshToken: user, familyId, tokenHash, expiresAt (TTL index), revokedAt, replacedBy.

API CONVENTIONS
- Base path /api/v1. Success: { data, meta? }. Error: { error: { code, message, details? } }.
- Correct HTTP status codes. Central error-handling middleware. Async errors must reach it.
- Use pagination on every list endpoint: page + limit (max 50), and return meta { page, limit, total, totalPages }.

CODE QUALITY RULES
- Feature-based folder structure. Thin controllers, logic in services, validation in schemas.
- No `any` unless justified. ESLint + Prettier configured. No dead code, no console.log left behind (use a logger).
- Never invent files or APIs you have not verified. If unsure about a library's API, read its docs first.
- After each task: run type-check and lint, start the app, and tell me exactly how to manually verify the work.

Reply "READY" and wait for the first phase prompt.