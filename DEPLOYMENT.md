# Deployment Guide

## GitHub Pages Deployment

This project is configured to deploy to GitHub Pages automatically.

### Prerequisites

1. Push your code to the `main` branch of `hardcodeddev/festiPlanner`
2. Make sure your `.env.local` contains your Supabase and EmailJS credentials (these should NOT be committed)

### Setup Steps

1. **Install gh-pages package**
   ```bash
   npm install
   ```

2. **Manual Deployment (Local)**
   ```bash
   npm run deploy
   ```
   This builds the project and pushes to the `gh-pages` branch.

3. **Automatic Deployment (GitHub Actions)**
   - The workflow is already configured in `.github/workflows/deploy.yml`
   - Every push to `main` will automatically build and deploy
   - No additional setup needed!

### GitHub Pages Configuration

1. Go to your repo: https://github.com/hardcodeddev/festiPlanner
2. Settings → Pages
3. Set source to: **Deploy from a branch**
4. Branch: **gh-pages**
5. Folder: **/(root)**
6. Save

### Environment Variables for Production

Your production site at `https://hardcodeddev.github.io/festiPlanner/` will use the Supabase and EmailJS credentials from your `.env.local` file during build time. Make sure these are set before building:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_USER_ID=your_emailjs_user_id
```

### Troubleshooting

- **404 errors on refresh**: This is because GitHub Pages serves a static site. The app is configured with the correct base path (`/festiPlanner/`).
- **Blank page**: Check browser console for errors, ensure env vars are set.
- **Old content showing**: GitHub Pages cache may take a few minutes. Do a hard refresh (Cmd+Shift+R on Mac).

### Workflow

After setup, your deployment workflow is:

1. Make changes locally
2. Commit and push to `main`
3. GitHub Actions automatically builds and deploys
4. Site updates at `https://hardcodeddev.github.io/festiPlanner/`
