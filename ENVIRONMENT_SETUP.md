# Environment Variables Setup Guide

## 🔐 Admin Access Setup

To access the admin dashboard, you need to set the `ADMIN_EMAILS` environment variable with your email address.

### **Option 1: Local Development (.env.local)**

Create a `.env.local` file in your project root:

```bash
# Admin Access
ADMIN_EMAILS="your-email@gmail.com"

# Other required variables
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### **Option 2: Vercel Production**

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - **Name**: `ADMIN_EMAILS`
   - **Value**: `your-email@gmail.com`
   - **Environment**: Production (and Preview if needed)

### **Step 3: Test Admin Access**

1. Make sure you're logged in with the email you added to `ADMIN_EMAILS`
2. Navigate to `/admin`
3. You should now have access to the admin dashboard

## 📊 Current Admin Features

- **Event Management**: Approve/deny/feature/cancel/archive events
- **Newsletter Management**: Manage subscribers and campaigns
- **Ad Management**: Manage advertisements and track performance

## 🚀 Deploy Academic Filtering

The academic event filtering system is now ready to deploy. It will automatically filter out internal academic events from law school scrapers once deployed.
