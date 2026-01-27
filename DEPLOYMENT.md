# The Easiest Free Deployment (Vercel CLI)

Since Zeabur was complicated or asked for payment, we will use **Vercel** directly. It is free and you don't need GitHub.

## One-Command Deployment

1.  **Run this command in your terminal**:
    ```bash
    npx vercel
    ```

2.  **Answer the prompts**:
    *   Set up and deploy? **y** (Yes)
    *   Which scope? (Press **Enter** to accept default)
    *   Link to existing project? **n** (No)
    *   Project name? (Press **Enter**, or type `alphalens`)
    *   In which directory? (Press **Enter**)
    *   Want to modify settings? **n** (No)

3.  **Wait for Upload**:
    It will give you a "Production" URL (something like `https://alphalens-xyz.vercel.app`).

---

## IMPORTANT: Fix the Database & API

After the command finishes, your site is online, **BUT** it won't have stock prices because it doesn't know your secrets (API Keys).

1.  Go to the URL it gave you (e.g., `vercel.com/.../alphalens`).
2.  Click **Settings** -> **Environment Variables**.
3.  Add these 4 items (copy from your `.env.local` file):
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `STOCK_API_URL_TEMPLATE`
    *   `NEXT_PUBLIC_MARKET_API_KEY`
4.  **Redeploy**: Go to **Deployments** tab -> Click the top one (three dots) -> **Redeploy**.

That's it! completely free.
