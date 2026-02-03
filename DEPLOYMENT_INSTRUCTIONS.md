# Vercel Deployment Instructions

Follow these steps to deploy your MEAN stack application to Vercel successfully.

## 1. Prerequisites
- Ensure you have a **Vercel account** (https://vercel.com/signup).
- Ensure your project is pushed to **GitHub**.

## 2. Environment Variables
Your backend requires a MongoDB connection string. You generally cannot use `mongodb://127.0.0.1...` in production. You need a cloud database (like MongoDB Atlas).

**Steps:**
1.  Get your MongoDB Atlas connection string (e.g., `mongodb+srv://<user>:<password>@cluster.mongodb.net/realestate`).
2.  You will add this to Vercel in step 4.

## 3. Deploy via Vercel Dashboard
This is the easiest method.

1.  Go to [https://vercel.com/new](https://vercel.com/new).
2.  Click **"Import"** next to your `Realestate-` repository.
3.  **Project Name**: Leave as is or change it.
4.  **Framework Preset**: It might say "Other" or "Angular". Since we have a custom `vercel.json`, Vercel should respect that.
5.  **Root Directory**: Leave this **empty** (default to root). We are managing the monorepo structure via `vercel.json`.
6.  **Environment Variables**:
    -   Click the arrow to expand.
    -   Key: `MONGO_URI`
    -   Value: Your MongoDB Atlas Connection String.
    -   Key: `JWT_SECRET` (if you use one)
    -   Value: Your secret key.
7.  Click **"Deploy"**.

## 4. Troubleshooting common errors

### "404 Not Found" (Frontend)
-   This usually means Vercel can't find the `index.html`.
-   We have configured `vercel.json` to look in `dist/frontend/browser`.
-   **Verification**: If the build succeeds but the site is 404, check the "Build Output" in Vercel. It should show the `browser` folder content.

### "500 Server Error" (Backend / API)
-   Check the **Functions** tab in your Vercel deployment logs.
-   Common cause: Missing `MONGO_URI` or database connection failure.
-   Common cause: Missing dependencies. (Ensure `cd backend && npm install` was run or dependencies are in `package.json`).

### "Module not found"
-   If the backend fails to load modules, ensure `backend/package.json` contains all the libraries used (`express`, `mongoose`, `cors`, etc.).

## 5. Local Vercel Testing (Optional)
If you want to test the build locally exactly how Vercel sees it:
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run: `vercel dev`
