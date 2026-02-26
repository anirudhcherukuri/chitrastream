# 🚀 Professional "No-Card" Deployment (MongoDB + Render)

This stack is the industry standard for fast, professional web apps. It requires **ZERO credit cards** and is highly valued by employers.

---

## Part 1: Set up MongoDB Atlas (Free & No Card)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  **Create a Cluster**: Choose the **M0 Free Tier**. Pick any region (e.g., Azure or AWS, doesn't matter).
3.  **Security**:
    *   **Database User**: Create a user (e.g., `chitrauser`) and a password. **Save these!**
    *   **IP Access List**: Add `0.0.0.0/0` (Allow access from anywhere, so Render can connect).
4.  **Get Connection String**:
    *   Click **Connect** > **Drivers** > **Python**.
    *   Copy the URI (it looks like `mongodb+srv://chitrauser:<password>@cluster0...`).
    *   **Replace `<password>`** in the URI with your actual password.

---

## Part 2: Push to GitHub

1.  Create a new repository on GitHub called `chitrustream`.
2.  Run these commands in your terminal here:
    ```powershell
    git init
    git add .
    git commit -m "Initialize ChitraStream with MongoDB"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/chitrustream.git
    git push -u origin main
    ```

---

## Part 3: Deploy to Render.com (Free & No Card)

1.  Log in to [Render.com](https://render.com) using your GitHub account.
2.  Click **New +** > **Web Service**.
3.  Select your GitHub repository.
4.  **Settings**:
    *   **Name**: `chitrustream`
    *   **Runtime**: `Docker` (Render will automatically see your `Dockerfile`).
5.  **Environment Variables**:
    *   Click "Advanced" > **Add Environment Variable**:
        *   `MONGODB_URI`: (Paste your string from Part 1)
        *   `DB_NAME`: `chitrastream`
        *   `SECRET_KEY`: (Make up a long random string)
        *   `OPENAI_API_KEY`: (Your API key)
6.  Click **Create Web Service**.

---

## 💎 Why MongoDB is "High Earn":
*   **Scaleability**: Unlike SQL, MongoDB handles huge "unstructured" data (like movie plots and live chat) effortlessly.
*   **NoSQL Experience**: Modern startups (Netflix, Uber, etc.) use NoSQL for high-speed features.
*   **Cost Efficiency**: You just built a professional app for **$0**. This is a massive selling point for any developer.

**I have already migrated your code to support MongoDB. You are ready to go!**
