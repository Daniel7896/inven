# 🚀 Production Hosting & Deployment Guide

This guide describes how to deploy your Express backend on **Render.com** (Free Tier) and connect your Expo application to it.

---

## Part 1: Prepare MongoDB Atlas (Done)
You have already configured this, but make sure:
1. Under **Network Access** in Atlas, `0.0.0.0/0` (Allow Access from Anywhere) is **Active**.
2. Keep your username (`daniel12`) and password (`L0RFoGf2vGmSp5ZS`) handy for the connection string.

---

## Part 2: Deploy Backend to Render.com

Render is a free-tier hosting platform perfect for Node.js backends.

### Step 1: Create a Render Account
1. Go to [Render.com](https://render.com) and sign up (using your GitHub account is easiest).

### Step 2: Create a Web Service
1. Click the **New +** button in the top right and select **Web Service**.
2. Connect your GitHub repository (`Daniel7896/inven`).
3. Set the following details:
   - **Name**: `mobile-inventory-backend` (or any name you like)
   - **Region**: Select the region closest to you (e.g., Singapore/Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` (⚠️ Important: set this to `backend` since your code is in a monorepos structure)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

### Step 3: Configure Environment Variables
Scroll down to the **Advanced** section or go to the **Environment** tab in your service dashboard and add these variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://daniel12:L0RFoGf2vGmSp5ZS@cluster0.whv5kij.mongodb.net/inventory?retryWrites=true&w=majority` |
| `JWT_SECRET` | *Create a secure random string (e.g., `8d2f09a5b3c1d4...`)* |
| `GEMINI_API_KEY` | *Your Gemini API Key* |

### Step 4: Deploy
1. Click **Create Web Service**.
2. Render will build and deploy your backend. Once done, you will see a live URL in the top left (e.g., `https://mobile-inventory-backend.onrender.com`).

---

## Part 3: Connect Frontend to Hosted Backend

Once the backend is hosted on Render, you need to point your mobile app to the Render URL.

### Option A: Via Settings Screen (No code change)
1. Open your app on the web or Expo Go.
2. Go to the **Settings** tab.
3. Under **Network Settings**, paste your live Render URL into the **Backend API Endpoint** input:
   - Example: `https://mobile-inventory-backend.onrender.com`
4. Click **Save Preferences**.
5. The app will now communicate directly with your live hosted database!

### Option B: Make Render the Default URL (Permanent)
If you want the app to connect to Render automatically without typing it in the Settings screen:
1. Open `frontend/src/config/api.ts`
2. Change the fallback `http://localhost:5000` to your Render URL:
   ```typescript
   const getApiBaseUrl = () => {
     if (Platform.OS === 'web') {
       // Replace this with your Render URL for production Web builds
       return 'https://mobile-inventory-backend.onrender.com';
     }
     ...
   ```
