# How to Set Up `neurynx.com`

To make your site load at **neurynx.com** instead of the vercel link, follow these 2 simple steps:

## Step 1: Tell Vercel about "neurynx.com"
1.  Go to your Vercel Project Settings:
    *   **Link**: [Vercel Domains Settings](https://vercel.com/robinma1102-gmailcoms-projects/alpha-lens/settings/domains)
2.  Type `neurynx.com` in the box and click **Add**.
3.  Vercel will give you a warning that "Invalid Configuration" is detected. This is normal because we haven't set up the DNS yet.

## Step 2: Configure DNS (Where you bought the domain)
Log in to your domain provider (GoDaddy, Namecheap, Aliyun, etc.) and add these **2 Records**:

| Type | Name | Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Automatic / 1 Hour |
| **CNAME** | `www` | `cname.vercel-dns.com` | Automatic / 1 Hour |

## Step 3: Done!
*   **Wait**: It usually takes 5-10 minutes for the changes to propagate.
*   **HTTPS**: Vercel will automatically set up the secure lock (HTTPS) for you.
*   **Result**: Your site will be accessible at `https://neurynx.com`.

> **Note**: If you want `neurynx.com` to automatically go to the Dashboard (instead of the home page), we can add a redirect in `next.config.js`, but usually users keep the homepage as the landing.
