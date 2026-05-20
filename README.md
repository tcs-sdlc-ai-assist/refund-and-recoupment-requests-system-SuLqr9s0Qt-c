# Refund & Recoupment Requests

A single-page application for managing healthcare refund and recoupment requests. Built with React.js and Vite, using localStorage for client-side data persistence.

## Tech Stack

- **Framework:** React 18 with React Router v6
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Testing:** Vitest + React Testing Library
- **Language:** JavaScript (JSX)
- **State Management:** React hooks (useState, useEffect, useCallback)
- **Data Persistence:** localStorage with JSON serialization

## Features

- **Dashboard** — Overview of request metrics, status breakdowns, and recent requests table
- **Create Request** — Form to submit new refund or recoupment requests with field-level validation
- **Edit Request** — View and update existing requests; system fields (ID, dates) are read-only
- **Status Management** — Transition requests through lifecycle states: New → In Progress → Processed → Closed
- **Delete Request** — Remove editable requests with confirmation dialog
- **Search & Filter** — Filter requests by ID, member, status, and date range
- **Reports** — Generate summary, monthly, status breakdown, and type breakdown reports with bar chart visualizations
- **Responsive Layout** — Sidebar navigation with mobile-friendly hamburger menu
- **Seed Data** — Automatically populates sample members, providers, payments, and requests on first load
- **Validation** — Client-side validation for request type, member, amount, and claim ID format (CLM-\<number\>)
- **Accessible UI** — ARIA labels, keyboard navigation, focus trapping in dialogs

## Folder Structure

```
refund-recoupment-requests/
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Vitest configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── vercel.json                 # Vercel deployment rewrites
├── .env.example                # Environment variable template
├── src/
│   ├── main.jsx                # Application entry point
│   ├── App.jsx                 # Root component with routing
│   ├── index.css               # Tailwind directives and base styles
│   ├── setupTests.js           # Test setup (jest-dom)
│   ├── constants.js            # App-wide constants, seed data, status config
│   ├── components/
│   │   ├── AlertMessage.jsx    # Reusable alert/notification component
│   │   ├── ConfirmDialog.jsx   # Modal confirmation dialog
│   │   ├── FormField.jsx       # Form field wrapper with label and error
│   │   ├── Layout.jsx          # App shell with sidebar navigation
│   │   ├── ReportChart.jsx     # Bar chart visualization component
│   │   ├── RequestTable.jsx    # Request data table with row click
│   │   ├── SearchFilters.jsx   # Search filter panel
│   │   ├── StatusBadge.jsx     # Colored status badge
│   │   └── SummaryCard.jsx     # Metric summary card
│   ├── pages/
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── Dashboard.test.jsx  # Dashboard tests
│   │   ├── CreateEditRequest.jsx   # Create/Edit request page
│   │   ├── CreateEditRequest.test.jsx # Create/Edit tests
│   │   ├── SearchRequests.jsx  # Search requests page
│   │   ├── SearchRequests.test.jsx # Search tests
│   │   ├── Reports.jsx         # Reports page
│   │   └── NotFound.jsx        # 404 page
│   ├── services/
│   │   ├── dataStore.js        # localStorage abstraction layer
│   │   ├── dataStore.test.js   # DataStore tests
│   │   ├── requestRepository.js    # Request CRUD operations
│   │   ├── requestRepository.test.js # Request repository tests
│   │   ├── memberRepository.js     # Member data access
│   │   ├── providerRepository.js   # Provider data access
│   │   ├── paymentRepository.js    # Payment data access
│   │   ├── reportingService.js     # Report aggregation logic
│   │   ├── reportingService.test.js # Reporting tests
│   │   ├── validationService.js    # Request data validation
│   │   └── validationService.test.js # Validation tests
│   └── utils/
│       ├── formatters.js       # Currency, date, status formatting
│       └── helpers.js          # ID generation, status checks, debounce
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd refund-recoupment-requests
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and adjust values as needed:

```bash
cp .env.example .env
```

Available environment variables:

| Variable | Description | Default |
|---|---|---|
| `VITE_APP_TITLE` | Application title displayed in the header | `Refund & Recoupment Requests` |
| `VITE_API_BASE_URL` | Base URL for the API backend | `http://localhost:8080/api` |
| `VITE_APP_ENV` | Environment mode | `development` |

### 4. Start the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
```

The production build output is written to the `dist/` directory.

### 6. Preview the production build

```bash
npm run preview
```

## Running Tests

Run all tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Usage Guide

### Creating a Request

1. Navigate to **Create Request** from the sidebar or dashboard.
2. Select a **Request Type** (Refund or Recoupment).
3. Select a **Member** from the dropdown.
4. Optionally select a **Provider** and enter a **Claim ID** (format: `CLM-<number>`).
5. Enter the **Amount** (must be greater than 0).
6. Click **Save** to create the request.

### Managing Request Status

Requests follow a defined lifecycle:

```
New → In Progress → Processed → Closed
 └──────────────────────────────→ Closed
          └─────────────────────→ Closed
```

- **New** requests can be edited, deleted, started, or closed.
- **In Progress** requests can be edited, deleted, marked as processed, or closed.
- **Processed** requests are read-only and can only be closed.
- **Closed** requests are fully read-only with no further actions.

### Searching Requests

1. Navigate to **Search Requests** from the sidebar.
2. Use the filter panel to narrow results by Request ID, Member, Status, or Date Range.
3. Click **Search** to apply filters or **Clear** to reset.
4. Click any row to view or edit the request.

### Generating Reports

1. Navigate to **Reports** from the sidebar.
2. Select a **Report Type**: Summary, Monthly, Status Breakdown, or Type Breakdown.
3. For Monthly reports, select a **Year** and **Month**.
4. Click **Generate Report** to view metrics and visualizations.

## Data Persistence

All data is stored in the browser's `localStorage`. On first load, the application seeds sample data including:

- 5 members
- 5 providers
- 8 payments
- 5 requests

Data persists across page refreshes. Clearing browser storage will reset the application to its initial seed state on the next load.

## Deployment

### Vercel

The project includes a `vercel.json` configuration for SPA routing. Deploy directly from the repository:

1. Connect the repository to [Vercel](https://vercel.com/).
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Deploy.

### Static Hosting

For any static hosting provider:

1. Run `npm run build` to generate the `dist/` directory.
2. Upload the contents of `dist/` to your hosting provider.
3. Configure URL rewrites to serve `index.html` for all routes (required for client-side routing).

## License

Private