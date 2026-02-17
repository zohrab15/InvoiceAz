# InvoiceAZ Deployment Guide (The Golden Trio)

This guide will help you deploy your application for **free** and **long-term** access using:
1.  **Vercel** (Frontend)
2.  **Render** (Backend)
3.  **Neon** (Database)

---

## Prerequisite: GitHub
1.  Create a new repository on [GitHub](https://github.com/new) (e.g., `invoice-az`).
2.  Push your code to this repository:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/<YOUR_USERNAME>/invoice-az.git
    git push -u origin main
    ```

---

## Step 1: Database (Neon.tech)
1.  Go to [Neon.tech](https://neon.tech) and Sign Up.
2.  Create a **New Project**.
3.  Copy the **Connection String** (it looks like `postgres://mirza:password@...`).
    *   *Save this, you will need it for Render.*

---

## Step 2: Backend (Render)
1.  Go to [Render.com](https://render.com) and Sign Up.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name:** `invoice-az-backend`
    *   **Region:** Frankfurt (closest to Azerbaijan)
    *   **Branch:** `main`
    *   **Root Directory:** `backend`
    *   **Runtime:** `Python 3`
    *   **Build Command:** `./build.sh`
    *   **Start Command:** `gunicorn config.wsgi:application`
    *   **Instance Type:** Free
5.  **Environment Variables** (Click "Advanced"):
    *   Key: `DATABASE_URL`
    *   Value: `(Paste the Neon Connection String from Step 1)`
    *   Key: `PYTHON_VERSION`
    *   Value: `3.11.0`
    *   Key: `SECRET_KEY`
    *   Value: `(Generate a random string)`
6.  Click **Create Web Service**.
7.  Wait for it to deploy. Copy the **Service URL** (e.g., `https://invoice-az-backend.onrender.com`).

---

## Step 3: Frontend (Vercel)
1.  Go to [Vercel.com](https://vercel.com) and Sign Up.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Root Directory:** click `Edit` and select `frontend`.
    *   **Framework Preset:** Vite
5.  **Environment Variables**:
    *   Key: `VITE_API_URL`
    *   Value: `(Paste the Render Backend URL from Step 2)` **IMPORTANT: Remove the trailing slash `/`**
6.  Click **Deploy**.

---

## Step 5: Google Cloud Console (OAuth)
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project and go to **APIs & Services** > **Credentials**.
3.  Edit your **OAuth 2.0 Client ID**.
4.  **Authorized JavaScript origins**:
    *   Add: `https://invoiceaz.vercel.app` (Your Vercel Domain)
5.  **Authorized redirect URIs**:
    *   Add: `https://invoice-az-backend.onrender.com/accounts/google/login/callback/` (Your Render Backend URL + callback path)
6.  Click **Save**.

## Step 6: Final Connection
1.  Go back to your **Render** Dashboard -> Environment Variables.
2.  Add/Update:
    *   Key: `CORS_ALLOWED_ORIGINS`
    *   Value: `(Paste your Vercel Frontend URL, e.g., https://invoiceaz.vercel.app)`
3.  Render will restart automatically.

**Done!** Your app is now live.
