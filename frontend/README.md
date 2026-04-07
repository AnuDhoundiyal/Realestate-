# Real Estate Management System (MEAN Stack)

A premium, modern real estate platform built with the **MEAN Stack** (MongoDB, Express, Angular, Node.js). Features include real-time chat, property management, role-based dashboards, and a subscription-based "Pro" model.

---

## 🚀 Getting Started

### 1. Prerequisites
*   **Node.js**: v18 or higher.
*   **MongoDB**: Local instance or MongoDB Atlas URI.
*   **Angular CLI**: `npm install -g @angular/cli`.

### 2. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment:
    Create a `.env` file in the `backend` folder:
    ```env
    MONGO_URI=mongodb://127.0.0.1:27017/realestate
    JWT_SECRET=your_secret_key
    PORT=5000
    ```
4.  Seed the Database (Optional):
    ```bash
    node seed_full.js
    ```
5.  Start the Server:
    ```bash
    node server.js
    ```

### 3. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Development Server:
    ```bash
    ng serve
    ```
4.  Access the app at: `http://localhost:4200`

---

## ☁️ Vercel Deployment

This project is configured for **Vercel** monorepo deployment.

1.  **Frontend Config**: Ensure `dist/frontend/browser` is the output directory (Standard for Angular 17+).
2.  **Backend Config**: The backend exports the `app` for serverless execution.
3.  **Environment Variables**: Add `MONGO_URI` and `JWT_SECRET` in the Vercel Dashboard settings.
4.  **Deployment**: Push to GitHub or run `vercel` from the root directory.

---

## 📑 Admin & Role Rights

The system uses **Role-Based Access Control (RBAC)**:

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full access. Manage users, verify agents, view all properties, and access revenue analytics. |
| **Agent** | List properties, manage their own inventory, and chat with interested clients. |
| **Client** | Browse properties, save favorites, and chat with agents. |

---

## 🔑 Demo Credentials

*   **Admin**: `admin@example.com` / `admin123`
*   **Agent**: `agent@example.com` / `agent123`
*   **User**: `user@example.com` / `user123`

*(Quick login chips are available on the login page for convenience)*

---

## 🛠️ Technology Stack
*   **Frontend**: Angular 17, Bootstrap, SCSS, RxJS.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose).
*   **Security**: JSON Web Tokens (JWT), Bcrypt hashing.
*   **File Handling**: Multer (Local/Server storage).
