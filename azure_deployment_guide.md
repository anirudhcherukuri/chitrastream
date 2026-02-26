# 🚀 Azure + Docker Deployment Guide for ChitraStream

This guide will help you deploy your application to **Microsoft Azure** using the **Docker** setup I have already built for you. 

Azure is a professional-grade platform. Using it with Docker makes your application "Scaleable," which is a highly valued skill in the industry.

---

## 🛠 Prerequisites

1.  **Azure Account**: Sign up at [portal.azure.com](https://portal.azure.com).
2.  **GitHub Account**: Your code must be in a GitHub repository.
3.  **Azure CLI**: Optional, but recommended.

---

## Part 1: Setting up the Database (Azure SQL)

Azure Web Apps cannot talk to your local computer, so we need a Cloud Database.

1.  Go to the Azure Portal and search for **"SQL Database"**.
2.  Click **Create**.
3.  **Resource Group**: Create a new one (e.g., `chitrastream-group`).
4.  **Database Name**: `signinuser`
5.  **Server**: Click "Create new". Name it something unique (e.g., `chitra-server-XXXX`).
6.  **Authentication**: Use **"SQL Authentication"**. 
    *   Set a Login (e.g., `dbadmin`) and a strong Password. **Save these!**
7.  **Networking**:
    *   Go to "Networking" tab.
    *   Set "Public access" to **Selected networks**.
    *   Check **"Allow Azure services and resources to access this server"** (CRITICAL).
8.  Click **Review + Create**.

---

## Part 2: Deploying the Application

Now we tell Azure to take your code, read the `Dockerfile`, and run it.

1.  Search for **"App Service"** in Azure Portal and click **Create**.
2.  **Basic Settings**:
    *   **Publish**: Select **"Container"**.
    *   **Operating System**: Linux.
    *   **Region**: Pick one close to you (e.g., East US or India South).
    *   **Pricing Plan**: Pick the **Basic B1** or **Starter**.
3.  **Container Settings**:
    *   **Image Source**: GitHub.
    *   Azure will ask you to login to GitHub and select your Repository and the `main` branch.
4.  Click **Review + Create**. Azure will now build your Docker image automatically!

---

## Part 3: Connecting the App to the Database

Your app is now running, but it doesn't know where the database is. We need to set the **Environment Variables**.

1.  Go to your new **App Service** > **Configuration** (under Settings).
2.  Add the following **Application Settings**:

| Setting Name | Value |
| :--- | :--- |
| `DB_SERVER` | `your-server-name.database.windows.net` |
| `DB_NAME` | `signinuser` |
| `DB_USER` | `dbadmin` (the login you created) |
| `DB_PWD` | `your-password` |
| `OPENAI_API_KEY` | `sk-proj-...` |
| `SECRET_KEY` | (Anything random strings) |
| `WEBSITES_PORT` | `5000` (Tells Azure your Docker uses 5000) |

3.  Click **Save** and **Continue**.

---

## 💎 Why this is "High Earn" Skill:
*   **Dockerization**: You are shipping a "containerized" app. It runs exactly the same on your computer, on Azure, or on AWS.
*   **Cloud Infrastructure**: You are managing a separate Web Tier (App Service) and Data Tier (Azure SQL).
*   **Security**: You are using "Environment Variables" to hide passwords—the professional standard.

**Do you want me to help you push your current code to GitHub so you can start Step 2?**
