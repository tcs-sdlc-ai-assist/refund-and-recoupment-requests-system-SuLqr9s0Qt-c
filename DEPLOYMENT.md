# Deployment Guide

This document covers deployment of the **Refund & Recoupment Requests** application to production environments, with a focus on Vercel static site hosting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Configuration](#build-configuration)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
  - [Automatic Deployment (Git Integration)](#automatic-deployment-git-integration)
  - [Manual Deployment (Vercel CLI)](#manual-deployment-vercel-cli)
  - [SPA Routing Configuration](#spa-routing-configuration)
- [Other Static Hosting Providers](#other-static-hosting-providers)
- [CI/CD Pipeline](#cicd-pipeline)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have the following:

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- A [Vercel](https://vercel.com/) account (for Vercel deployment)
- The [Vercel CLI](https://vercel.com/docs/cli) installed globally (optional, for manual deployment):

```bash
npm install -g vercel
```

---

## Build Configuration

The application uses **Vite 5** as its build tool. The production build is configured in `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
```

### Build Command

To generate the production build:

```bash
npm run build
```

This outputs optimized static assets to the `dist/` directory, including:

- `dist/index.html` — The single HTML entry point
- `dist/assets/` — Hashed JavaScript, CSS, and other static assets

### Preview the Build Locally

To preview the production build before deploying:

```bash
npm run preview
```

This starts a local static server serving the `dist/` directory.

---

## Environment Variables

The application uses Vite environment variables prefixed with `VITE_`. These are embedded at build time and are **not** secret — they are included in the client-side JavaScript bundle.

| Variable | Description | Default | Required |
|---|---|---|---|
| `VITE_APP_TITLE` | Application title displayed in the header and browser tab | `Refund & Recoupment Requests` | No |
| `VITE_API_BASE_URL` | Base URL for the API backend (reserved for future use) | `http://localhost:8080/api` | No |
| `VITE_APP_ENV` | Environment mode identifier | `development` | No |

### Setting Environment Variables Locally

Copy the example file and adjust values:

```bash
cp .env.example .env
```

Edit `.env` with your desired values:

```
VITE_APP_TITLE=Refund & Recoupment Requests
VITE_API_BASE_URL=https://api.example.com/api
VITE_APP_ENV=production
```

### Setting Environment Variables on Vercel

1. Navigate to your project in the [Vercel Dashboard](https://vercel.com/dashboard).
2. Go to **Settings** → **Environment Variables**.
3. Add each variable with the appropriate value for each environment (Production, Preview, Development).

| Variable | Production Value | Preview Value |
|---|---|---|
| `VITE_APP_TITLE` | `Refund & Recoupment Requests` | `Refund & Recoupment Requests (Preview)` |
| `VITE_API_BASE_URL` | `https://api.example.com/api` | `https://staging-api.example.com/api` |
| `VITE_APP_ENV` | `production` | `staging` |

> **Note:** Since this application currently uses localStorage for data persistence and does not make API calls, `VITE_API_BASE_URL` is reserved for future use. You can omit it or set it to a placeholder value.

---

## Vercel Deployment

### Automatic Deployment (Git Integration)

This is the recommended approach. Vercel automatically builds and deploys on every push to your repository.

#### Step 1: Connect Your Repository

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Select your Git provider (GitHub, GitLab, or Bitbucket).
4. Import the `refund-recoupment-requests` repository.

#### Step 2: Configure Build Settings

Vercel should auto-detect the Vite framework. Verify the following settings:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or higher |

#### Step 3: Configure Environment Variables

Add the environment variables listed in the [Environment Variables](#environment-variables) section above via the Vercel Dashboard.

#### Step 4: Deploy

Click **Deploy**. Vercel will:

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Run `npm run build` to generate the `dist/` directory.
4. Deploy the contents of `dist/` to the Vercel CDN.

#### Automatic Deployments on Push

Once connected, Vercel automatically deploys:

- **Production deployment** — On every push to the `main` branch (or your configured production branch).
- **Preview deployment** — On every push to any other branch or on pull request creation. Each preview deployment gets a unique URL for testing.

#### Branch Configuration

To configure which branch triggers production deployments:

1. Go to **Settings** → **Git** in your Vercel project.
2. Under **Production Branch**, set the branch name (default: `main`).

### Manual Deployment (Vercel CLI)

For one-off deployments or when Git integration is not configured:

#### Step 1: Log In

```bash
vercel login
```

#### Step 2: Build Locally

```bash
npm run build
```

#### Step 3: Deploy to Preview

```bash
vercel
```

This deploys to a preview URL. Follow the CLI prompts to link or create a project.

#### Step 4: Deploy to Production

```bash
vercel --prod
```

This deploys to your production domain.

#### Step 5: Set Environment Variables via CLI

```bash
vercel env add VITE_APP_TITLE production
vercel env add VITE_API_BASE_URL production
vercel env add VITE_APP_ENV production
```

> **Note:** After adding environment variables via the CLI, you must redeploy for the changes to take effect.

### SPA Routing Configuration

This application uses React Router with client-side routing (`BrowserRouter`). All routes must be rewritten to serve `index.html` so that React Router can handle navigation.

The `vercel.json` file in the project root configures this:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**How it works:**

- Any request that does **not** start with `/assets/` is rewritten to `/index.html`.
- Requests to `/assets/*` are served directly as static files (JavaScript, CSS, images).
- This ensures that deep links like `/requests/REQ-001` or `/reports` load the application correctly instead of returning a 404.

> **Important:** Do not remove or modify `vercel.json` unless you understand the impact on client-side routing. Without these rewrites, refreshing the browser on any route other than `/` will result in a 404 error.

---

## Other Static Hosting Providers

The application can be deployed to any static hosting provider that supports SPA routing rewrites.

### Netlify

Create a `_redirects` file in the `public/` directory (or configure in `netlify.toml`):

```
/*    /index.html   200
```

Or create a `netlify.toml` in the project root:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Build settings:

| Setting | Value |
|---|---|
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

### AWS S3 + CloudFront

1. Run `npm run build`.
2. Upload the contents of `dist/` to an S3 bucket configured for static website hosting.
3. Configure a CloudFront distribution with the S3 bucket as the origin.
4. Set up a custom error response: for 403 and 404 errors, return `/index.html` with a 200 status code.

### GitHub Pages

1. Run `npm run build`.
2. Deploy the `dist/` directory using the `gh-pages` package or GitHub Actions.
3. Add a `404.html` file that redirects to `index.html` (GitHub Pages does not support native SPA rewrites).

### Nginx

Configure the server block to fall back to `index.html`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## CI/CD Pipeline

### Running Tests Before Deployment

It is recommended to run the test suite before deploying to catch regressions:

```bash
npm test
```

This runs all Vitest tests including:

- `DataStore` — Storage operations and seeding
- `RequestRepository` — CRUD operations and status transitions
- `ReportingService` — Summary metrics and monthly reports
- `ValidationService` — Field-level validation
- `Dashboard` — Metrics display and navigation
- `CreateEditRequest` — Form rendering, validation, and status changes
- `SearchRequests` — Filter rendering and search functionality

### GitHub Actions Example

Create `.github/workflows/deploy.yml` for automated testing and deployment:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_APP_TITLE: 'Refund & Recoupment Requests'
          VITE_API_BASE_URL: 'https://api.example.com/api'
          VITE_APP_ENV: 'production'

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

#### Required GitHub Secrets

| Secret | Description | How to Obtain |
|---|---|---|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization/team ID | Run `vercel link` locally, check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Run `vercel link` locally, check `.vercel/project.json` |

### Vercel Git Integration (Alternative to GitHub Actions)

If you use Vercel's built-in Git integration (recommended for simplicity), no GitHub Actions workflow is needed for deployment. Vercel handles the build and deploy automatically on push. You can still use GitHub Actions for running tests only:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build check
        run: npm run build
```

---

## Post-Deployment Verification

After deploying, verify the application is working correctly:

### 1. Check the Home Page

Navigate to your deployment URL. The Dashboard should load with:

- Summary metric cards (Total Requests, Total Refund Amount, Total Recoupment Amount, Total Amount Paid)
- Status breakdown cards (New, In Progress, Processed, Closed)
- Quick action buttons (Create Request, Search Requests, Reports)
- Recent Requests table with seeded data

### 2. Test Client-Side Routing

Navigate directly to these URLs (paste in browser address bar, not via in-app navigation):

- `/requests/create` — Should load the Create Request form
- `/requests` — Should load the Search Requests page
- `/reports` — Should load the Reports page
- `/requests/REQ-001` — Should load the Edit Request page for REQ-001
- `/nonexistent-page` — Should load the 404 Not Found page

If any of these return a blank page or a server 404, the SPA routing rewrites are not configured correctly. See [SPA Routing Configuration](#spa-routing-configuration).

### 3. Test Data Persistence

1. Create a new request via the Create Request form.
2. Refresh the browser.
3. Navigate to Search Requests and verify the new request appears.

> **Note:** Data is stored in the browser's `localStorage`. Each user/browser has its own independent data store. Data does not sync across devices or browsers.

### 4. Test Responsive Layout

- On desktop (≥1024px): Sidebar navigation should be visible.
- On mobile (<1024px): Sidebar should be hidden, accessible via the hamburger menu button.

---

## Troubleshooting

### Build Fails with "Module not found"

Ensure all dependencies are installed:

```bash
rm -rf node_modules
npm install
npm run build
```

### 404 Errors on Page Refresh

The SPA routing rewrites are not configured. Ensure `vercel.json` is present in the project root with the correct rewrite rules. See [SPA Routing Configuration](#spa-routing-configuration).

### Environment Variables Not Applied

- Vite environment variables are embedded at **build time**, not runtime. After changing environment variables, you must rebuild and redeploy.
- Ensure variables are prefixed with `VITE_`. Variables without this prefix are not exposed to the client-side code.
- On Vercel, ensure the variables are set for the correct environment (Production, Preview, or Development).

### Blank Page After Deployment

1. Open the browser developer console (F12) and check for JavaScript errors.
2. Verify the `dist/` directory contains `index.html` and an `assets/` folder with `.js` and `.css` files.
3. Ensure the build command completed successfully without errors.

### localStorage Quota Exceeded

If users encounter storage errors, the browser's localStorage quota (typically 5–10 MB) may be full. Users can clear the application data by:

1. Opening browser developer tools (F12).
2. Going to the **Application** tab → **Local Storage**.
3. Clearing the entries for the deployment domain.

The application will re-seed sample data on the next page load.

### Tests Fail in CI

Ensure the CI environment uses Node.js v18 or higher. The test suite uses Vitest with jsdom and requires:

- `@testing-library/react` for component tests
- `@testing-library/jest-dom` for DOM assertions
- `@testing-library/user-event` for user interaction simulation

Run tests locally first to verify:

```bash
npm test
```