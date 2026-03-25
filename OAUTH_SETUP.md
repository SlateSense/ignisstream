# OAuth Setup Guide for IgnisStream

## Current Issue
OAuth sign-in (Google, Discord) is not working because the providers need to be configured in Supabase.

## Quick Fix - Enable OAuth Providers

### 1. **Google OAuth Setup**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `odireqkjlgwdvmtscfqn`
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and click **Enable**
5. You'll need to create a Google OAuth app:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://odireqkjlgwdvmtscfqn.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**
6. Paste them into Supabase Google provider settings
7. Save

### 2. **Discord OAuth Setup**

1. In Supabase Dashboard: **Authentication** > **Providers**
2. Find **Discord** and click **Enable**
3. Create Discord OAuth app:
   - Go to https://discord.com/developers/applications
   - Click **New Application**
   - Go to **OAuth2** section
   - Copy **Client ID** and **Client Secret**
   - Add redirect URI: `https://odireqkjlgwdvmtscfqn.supabase.co/auth/v1/callback`
4. Paste credentials into Supabase Discord provider settings
5. Save

### 3. **Email/Password Authentication**

This should already work! Just create an account:
- Go to: http://localhost:3000/auth/signup
- Enter email and password
- Create account

## Testing OAuth

After setup:
1. Go to: http://localhost:3000/auth/signin
2. Click "Google" or "Discord" button
3. You'll be redirected to authenticate
4. After authentication, you'll be redirected back to your app

## Alternative: Use Email Authentication for Now

While setting up OAuth, you can use email/password authentication which works out of the box:

1. Go to `/auth/signup`
2. Create account with email/password
3. Sign in at `/auth/signin`

## Common Issues

### "OAuth provider not enabled"
- Make sure you clicked "Enable" for the provider in Supabase dashboard
- Save the settings after entering credentials

### "Invalid redirect URI"
- Ensure the callback URL in your OAuth app matches exactly:
  `https://odireqkjlgwdvmtscfqn.supabase.co/auth/v1/callback`

### "Credentials invalid"
- Double-check Client ID and Client Secret
- Make sure there are no extra spaces
- Regenerate credentials if needed

## Need Help?

Check the Supabase docs:
- [Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Discord OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-discord)
