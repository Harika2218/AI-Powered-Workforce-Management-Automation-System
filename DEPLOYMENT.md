# Production & Cloud Deployment Guide

This guide explains how to deploy both the **FastAPI Backend (with MongoDB)** and the **Vite React Frontend (on Vercel)** so they communicate seamlessly.

---

## 1. Why Did the Error Occur on Vercel?

When you deploy only the `frontend/` directory to Vercel:
1. **The Backend is Missing**: Vercel is a hosting service for static frontend assets and serverless functions. It does not automatically run your Python FastAPI server or your local MongoDB database.
2. **Localhost Fallback**: Because the environment variable `VITE_API_URL` was not configured in Vercel, the frontend compiled with `http://localhost:8000` as the API target.
3. **Browser Mixed Content Security**: When a user opens `https://your-project.vercel.app`, the browser strictly blocks any requests to unencrypted `http://localhost:8000`.
4. **Misleading Error Message**: When the network request failed at the browser level, the previous login code caught the network failure and defaulted to displaying *"Invalid email or password"*, even though the credentials (`josiah.harris@company.com` / `Password123!`) were 100% valid.

---

## 2. Quick Fix: Test Live in 60 Seconds (Using Local Tunnel)

If your backend and MongoDB are running locally on your computer and you want your Vercel deployment to work immediately:

### Step 1: Start your local backend
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Expose your local backend via HTTPS
Run localtunnel (no account or signup needed):
```bash
npx localtunnel --port 8000
```
It will output an HTTPS URL like:
```text
your url is: https://tender-panda-50.loca.lt
```

### Step 3: Configure Vercel
1. Go to your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings** &rarr; **Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tender-panda-50.loca.lt` *(your tunnel URL, without a trailing slash)*
4. Go to the **Deployments** tab, click the three dots `...` on the latest deployment, and select **Redeploy**.

Now open your Vercel URL and sign in with:
- **Email**: `josiah.harris@company.com`
- **Password**: `Password123!`

---

## 3. Permanent Fix: 100% Cloud Deployment (Free Tier)

For a 24/7 standalone deployment accessible by anyone without keeping your computer on:

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)
1. Sign up for a free MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** cluster.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
4. Under **Database Access**, create a user and password.
5. Click **Connect** &rarr; **Drivers** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Populate the cloud database with the 200 seed users and records:
   ```bash
   # In your local terminal, temporarily set MONGODB_URL:
   $env:MONGODB_URL="mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority"
   python -m backend.seed.seed_database --reset
   ```

### Step 2: Deploy Backend to Render (Free)
1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository: `AI-Powered-Workforce-Management-Automation-System`.
3. Configure the service:
   - **Name**: `workforce-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add:
   - `MONGODB_URL`: `<your-mongodb-atlas-connection-string>`
   - `DATABASE_NAME`: `workforce_management`
   - `JWT_SECRET`: `super-secret-jwt-key-for-workforce-system-2026-production`
   - `JWT_ALGORITHM`: `HS256`
   - `ENVIRONMENT`: `production`
5. Click **Create Web Service**. Once deployed, copy your Render URL (e.g., `https://workforce-api-xxxx.onrender.com`).

### Step 3: Link Backend to Vercel Frontend
1. Open your Vercel Project &rarr; **Settings** &rarr; **Environment Variables**.
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://workforce-api-xxxx.onrender.com`
3. Click **Deployments** &rarr; **Redeploy**.

---

## 4. Key Pre-Seeded Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **HR Administrator** | `sarah.jenkins@company.com` | `Password123!` |
| **Engineering Manager** | `alexander.wright@company.com` | `Password123!` |
| **Employee** | `josiah.harris@company.com` | `Password123!` |
| **Pending Activation** | `priya.sharma@company.com` | Token: `ACTIVATE-HR-TEST` |
