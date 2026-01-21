<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lq-RTSdujCIOuibc3D4L_dGWRRLA9VSr

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
4. (Optional) Install Supabase client for auth hookup:
   `npm install @supabase/supabase-js`
5. Create an env file from the example and set Supabase keys:
   - Copy `.env.example` to `.env` or `.env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. (Optional) Configure Email sending for invites:
   - You can use EmailJS (free tier) to send invite emails directly from the browser.
   - Create a service + template at https://www.emailjs.com and add `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_USER_ID` to your `.env`.

Database setup (Supabase)
1. Open your Supabase project and go to the SQL editor.
2. Run the SQL in `supabase.sql` to create the necessary tables (`profiles`, `camps`, `invitations`).

Invite flow
- The app will create an `invitations` row and generate an invite link. If EmailJS vars are set, the app will attempt to send the invite email automatically. Otherwise copy the generated link and send it manually.

Security note
- Do not commit `.env` with any keys. EmailJS uses public client keys; SendGrid or other server-side providers should use serverless functions or backend to keep secrets private.
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
