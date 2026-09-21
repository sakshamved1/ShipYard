# ShipYard

![License](https://img.shields.io/github/license/yourorg/shipyard)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-blue)
![React](https://img.shields.io/badge/React-19%2B-blueviolet)

---

## 🚀 Project Overview
**ShipYard** is a public feature‑request and roadmap portal – an open‑source alternative to Canny / Featurebase.  Users can submit feature ideas, up‑vote, and discuss them via threaded markdown comments.  Admins move requests through a clear workflow (Under Review → Planned → In Progress → Completed) which is reflected in a live, three‑column Kanban view.

---

## 🛠️ Technology Stack
- **Monorepo** (root, `/server`, `/client`)
- **Server**: Node.js 20+, Express 5, TypeScript (run with `tsx`), MongoDB + Mongoose, Zod, JWT pair‑token auth, bcryptjs, cookie‑parser, cors, helmet, rate‑limit, morgan, dotenv.
- **Client**: React 19, Vite, TypeScript, Tailwind CSS v4, **Coss UI** (Base UI + Tailwind primitives), React Router, TanStack Query, react‑markdown + remark‑gfm + rehype‑sanitize.
- **Dev Tools**: ESLint, Prettier, Jest (unit tests), Husky (pre‑commit hooks).

---

## 📦 Installation
```bash
# Clone the repo
git clone https://github.com/yourorg/shipyard.git
cd shipyard

# Install all workspace dependencies (root + client + server)
npm ci   # or `npm install` if you prefer
```

---

## ⚙️ Configuration
1. **Server environment** – copy the example and edit values:
   ```bash
   cp server/.env.example server/.env
   ```
   Required keys:
   - `PORT` – server port (default `5000`)
   - `MONGODB_URI` – MongoDB connection string
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
   - `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (used for simulated email verification)
2. **Client environment** – copy the example:
   ```bash
   cp client/.env.example client/.env
   ```
   You can keep the defaults; the client only needs the API base URL (`VITE_API_BASE=http://localhost:5000/api/v1`).

---

## ▶️ Running the Project Locally
```bash
# From the repository root
npm run dev
```
The command starts both the server (`http://localhost:5000`) and the Vite client (`http://localhost:5173`) concurrently.

---

## 🗄️ Database Setup
- Ensure a MongoDB instance is running locally or accessible via Atlas.
- The default connection string in `.env.example` points to `mongodb://localhost:27017/shipyard`.
- To seed initial data (admin user, sample posts, etc.), run:
  ```bash
  npx tsx server/src/scripts/seed.ts
  ```
  The script creates an admin user (`admin@shipyard.dev` / password `Admin123!`) and a handful of demo feature requests.

---

## 🌐 Deploying to Vercel

ShipYard is pre-configured for full-stack deployment on [Vercel](https://vercel.com) using a single project setup (Vite React SPA + Express Serverless API on the same domain).

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
3. Under **Database Access**, create a user and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/shipyard?retryWrites=true&w=majority
   ```

### 2. Deploy with Vercel CLI or GitHub
- **Via Vercel Dashboard (GitHub)**:
  1. Push your repository to GitHub.
  2. Import the project in Vercel.
  3. Framework Preset: **Vite** (Build Command: `npm run build`, Output Directory: `client/dist`).
  4. Add the Environment Variables below.
  5. Click **Deploy**.

- **Via Vercel CLI**:
  ```bash
  npm i -g vercel
  vercel
  ```

### 3. Environment Variables for Vercel
Set the following in **Vercel Project Settings → Environment Variables**:
| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/shipyard` |
| `JWT_ACCESS_SECRET` | Secret key for access tokens (min 16 chars) | `your-super-secret-jwt-access-key` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens (min 16 chars) | `your-super-secret-jwt-refresh-key` |
| `NODE_ENV` | Environment mode | `production` |
| `ADMIN_EMAIL` | Default seeded admin email | `admin@shipyard.dev` |
| `ADMIN_PASSWORD` | Default seeded admin password | `AdminSecurePassword123!` |

---

## 📌 Assumptions & Limitations
- **Email verification** is simulated – verification URLs are provided upon signup or password reset.
- **Refresh‑token rotation** is implemented; re‑using an old refresh token revokes the whole token family.
- The markdown renderer on the client sanitises all output (rehype‑sanitize) to prevent XSS.
- Rate limiting is applied to auth routes.
- The Kanban view is read‑only for non‑admin users; only admins can change a request’s status.

---

## 📚 Additional Resources
- **Architecture Diagram** – see `docs/architecture.png`.
- **API Reference** – see `server/docs/api.md` for detailed endpoint specifications.
- **Contribution Guide** – see `CONTRIBUTING.md` for how to submit PRs, run tests, and lint the code.
- **Testing** – run `npm run test` from the root to execute Jest suites for both server and client.
- **License** – this project is licensed under the MIT License (see `LICENSE`).

---

## 🙌 How to Contribute
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Install dependencies and make your changes.
4. Run lint and type‑check (`npm run lint && npm run typecheck`).
5. Write unit / integration tests for new code.
6. Submit a Pull Request against the `main` branch.

---

*Happy coding!*
