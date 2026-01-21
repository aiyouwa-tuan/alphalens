# Deployment Guide: Zeabur

You have chosen to deploy to **Zeabur**.

> **CRITICAL: Fix Your Mac First**
> You cannot deploy yet because your `git` command is broken.
> You **MUST** run this in your terminal and follow the prompts:
> ```bash
> sudo xcodebuild -license
> ```
> 1. Type your computer password (it won't show on screen).
> 2. Press **Space** repeatedly to scroll to the bottom.
> 3. Type `agree` and press **Enter**.

---

## Deploying to Zeabur

Once `git` is fixed, follow these steps:

### 1. Push Code to GitHub
(Zeabur deploys directly from GitHub)

run these commands in your terminal:
```bash
# Initialize Git
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Create a repo on GitHub.com (skip this if you have one)
# Then link it:
git remote add origin https://github.com/YOUR_USERNAME/alphalens.git
git push -u origin main
```

### 2. Connect Zeabur
1.  Go to [Zeabur.com](https://zeabur.com) and Login.
2.  Click **"Create Project"**.
3.  Click **"Deploy New Service"** -> **"GitHub"**.
4.  Select your `alphalens` repository.
5.  Zeabur will automatically detect it is a Next.js app.

### 3. Add Environment Variables
In the Zeabur Dashboard for your service, go to **"Settings"** -> **"Variables"** and add these (copy from your `.env.local` file):

*   `NEXT_PUBLIC_SUPABASE_URL`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `STOCK_API_URL_TEMPLATE`
*   `NEXT_PUBLIC_MARKET_API_KEY`

Redeploy the service if needed.
