# Vercel Deployment Guide

This project is now configured for deployment on Vercel using **Next.js** and **Vercel Postgres**.

## Step 1: Push to GitHub
If you haven't already, push your code to a GitHub repository.
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Create Vercel Project
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. (Optional) Set an environment variable `ADMIN_PIN` in the **Environment Variables** section if you want a custom admin PIN (defaults to `1234`).

## Step 3: Setup Vercel Postgres
1. Once the project is created, go to the **Storage** tab in your Vercel Dashboard.
2. Click **Create Database** and select **Postgres**.
3. Accept the terms and click **Create**.
4. Click **Connect** to link the database to your project.
   - Vercel will automatically add `POSTGRES_URL` and other variables to your project.

## Step 4: Run Data Migration (Important!)
Your local data (menu, products, categories) is in SQLite. We need to move it to Postgres.
1. Locate your local `postgres_seed.sql` file (I just updated it for you).
2. In the Vercel Dashboard, go to your **Postgres** database page.
3. Click the **Query** tab (SQL console).
4. Copy the entire content of `postgres_seed.sql` and paste it into the Vercel SQL query console.
5. Click **Run Query**. 
   - This will create all the tables and insert your local products/categories into Vercel.

## Step 5: Redeploy
1. Go back to the **Deployments** tab in Vercel.
2. Click the three dots (...) on your latest deployment and select **Redeploy**.
3. Once finished, your site is LIVE!

---

## Troubleshooting

### "Dynamic server usage" Error
If you see a `DYNAMIC_SERVER_USAGE` error during build, I have already added `export const dynamic = 'force-dynamic'` to all API routes. This ensures Vercel correctly handles the database connections and parameters.

### No Menu Items Displayed?
If your home page loads but the menu is empty, it means your **Vercel Postgres database is empty**.
- **Fix**: Follow **Step 4** again. Copy everything from `postgres_seed.sql` and run it in the Vercel Postgres **Query** console. This will populate your production site with your local products and categories.
