# How to Connect Your Custom Domain

Using your own domain (like `www.yourname.com`) instead of the `.vercel.app` link is very easy.

## Step 1: Add Domain in Vercel
1.  Go to your **Vercel Dashboard** -> **Settings** -> **Domains**.
    *   (Direct Link: `https://vercel.com/robinma1102-gmailcoms-projects/alpha-lens/settings/domains`)
2.  Enter your domain name (e.g., `example.com`) in the input box and click **Add**.
3.  Choose the "Recommended" option if asked.

## Step 2: Configure Your DNS
Vercel will show you exactly what to copy and paste. You will need to log in to where you bought your domain (GoDaddy, Namecheap, Aliyun, etc.) and add these records:

| Type | Name | Value |
| :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

*(Note: If Vercel gives you different values, use theirs).*

## Step 3: Wait
*   It usually takes **minutes** (but can take up to 24 hours).
*   Vercel will automatically generate an **SSL Certificate** (HTTPS) for you.
*   Once the indicators turn **Green** on Vercel, your site is live at your custom domain!
