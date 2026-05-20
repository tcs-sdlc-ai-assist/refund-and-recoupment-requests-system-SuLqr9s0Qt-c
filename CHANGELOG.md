# Changelog

All notable changes to the Refund & Recoupment Requests project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-15

### Added

- **Dashboard** — Overview page displaying summary metric cards for total requests, total refund amount, total recoupment amount, and total amount paid. Includes status breakdown counts (New, In Progress, Processed, Closed), quick action buttons, and a recent requests table sorted by created date descending.

- **Create Request** — Form page for submitting new refund or recoupment requests with fields for Request Type, Member, Provider, Claim ID, and Amount. Includes client-side field-level validation via `ValidationService` with descriptive error messages. Automatically assigns a sequential Request ID (e.g., `REQ-006`) and sets the initial status to New.

- **Edit Request** — Detail page for viewing and updating existing requests. Displays read-only system fields (Request ID, Created Date, Updated Date) and a status badge. Supports inline editing for requests with New or In Progress status. Disables all form fields for Processed and Closed requests with a warning message.

- **Status Management** — Lifecycle state transitions for requests following the defined flow:
  - New → In Progress → Processed → Closed
  - New → Closed (direct close)
  - In Progress → Closed (direct close)
  - Processed → Closed
  - Confirmation dialogs for all status change and delete actions.

- **Delete Request** — Ability to remove requests with New or In Progress status. Includes a destructive confirmation dialog. Requests with Processed or Closed status cannot be deleted.

- **Search & Filter Requests** — Search page with a filter panel supporting filtering by Request ID (case-insensitive partial match), Member (dropdown), Status (dropdown), and Date Range (from/to). Displays results in a sortable table with a results count indicator. Includes Clear button to reset all filters and Refresh button to reload data.

- **Reports** — Analytics page with four report types:
  - **Summary Report** — Aggregate metrics across all requests and payments.
  - **Monthly Report** — Metrics filtered by selected year and month, with detailed request and payment tables.
  - **Status Breakdown** — Count of requests grouped by status with bar chart visualization.
  - **Type Breakdown** — Count and amounts grouped by request type (Refund vs. Recoupment).
  - Bar chart visualizations rendered with pure Tailwind CSS (no external chart library).

- **localStorage Persistence** — All application data (requests, members, providers, payments) stored in the browser's `localStorage` with JSON serialization. Includes a `DataStore` abstraction layer with retry logic (up to 3 attempts with exponential backoff) for write operations and storage availability detection.

- **Seed Data** — Automatic population of sample data on first load:
  - 5 members (M001–M005)
  - 5 providers (P001–P005)
  - 8 payments (PAY001–PAY008)
  - 5 requests (REQ-001–REQ-005) across all status types
  - Data version tracking (`1.0.0`) to prevent re-seeding on subsequent loads.

- **Validation** — Client-side validation service for request data:
  - Request Type is required and must be `refund` or `recoupment`.
  - Member ID is required and must be a non-empty string.
  - Amount is required, must be greater than 0, and must not exceed 999,999,999.99.
  - Claim ID (optional) must follow the format `CLM-<number>` (e.g., `CLM-1001`).
  - Provider ID (optional) must be a non-empty string if provided.

- **Responsive Layout** — Application shell with a sidebar navigation and top header bar. Mobile-friendly hamburger menu toggle for screens below the `lg` breakpoint. Sidebar overlay with backdrop on mobile.

- **Tailwind CSS Styling** — Complete design system using custom Tailwind configuration:
  - Custom color palette: primary (blue), secondary (teal), success (green), warning (amber), danger (red), neutral (slate).
  - Custom border radius (`rounded-healthcare`), box shadows (`shadow-card`, `shadow-card-hover`).
  - Inter font family with system font fallbacks.
  - Consistent component styling across cards, buttons, form fields, tables, badges, and alerts.

- **Accessible UI** — ARIA labels on interactive elements, keyboard navigation support on table rows, focus trapping in confirmation dialogs, Escape key dismissal for modals, and `role="alert"` on validation and notification messages.

- **Reusable Components**:
  - `AlertMessage` — Notification component with success, error, warning, and info variants. Supports auto-dismiss with configurable timeout and manual dismissal.
  - `ConfirmDialog` — Modal confirmation dialog with focus trapping, Escape key support, and destructive action styling.
  - `FormField` — Form field wrapper supporting text, number, select, and date input types with label, error message, and required indicator.
  - `Layout` — Application shell with sidebar navigation and responsive mobile menu.
  - `ReportChart` — Bar chart visualization using pure Tailwind CSS with currency and number formatting.
  - `RequestTable` — Data table with column headers, row click navigation, member/provider name resolution, and empty state.
  - `SearchFilters` — Filter panel with Request ID, Member, Status, and Date Range inputs.
  - `StatusBadge` — Colored badge component for request status display.
  - `SummaryCard` — Metric card with title, value, optional icon, and accent color.

- **Service Layer**:
  - `DataStore` — localStorage abstraction with get/set/remove operations, version management, and seed data initialization.
  - `RequestRepository` — CRUD operations for requests with validation, status transition enforcement, and search/filter support.
  - `MemberRepository` — Read operations for member data.
  - `ProviderRepository` — Read operations for provider data.
  - `PaymentRepository` — Read operations for payment data with claim ID filtering.
  - `ReportingService` — Summary metrics aggregation and monthly report generation.
  - `ValidationService` — Field-level validation with descriptive error messages.

- **Utility Functions**:
  - `formatters.js` — Currency, date, date-time, request type, status, and percentage formatting.
  - `helpers.js` — ID generation, editable status checks, status badge color mapping, and debounce utility.

- **Test Suite** — Comprehensive test coverage using Vitest and React Testing Library:
  - `DataStore` — Storage operations, seeding, version management, and unavailability handling.
  - `RequestRepository` — CRUD operations, status transitions, search/filter, and error cases.
  - `ReportingService` — Summary metrics, monthly reports, boundary conditions, and edge cases.
  - `ValidationService` — All field validations, combined scenarios, and edge cases.
  - `Dashboard` — Metrics display, status breakdown, quick actions, recent requests table, and error handling.
  - `CreateEditRequest` — Form rendering, validation, creation, editing, status changes, deletion, and read-only states.
  - `SearchRequests` — Filter rendering, search functionality, combined filters, date ranges, clear/refresh, and navigation.

- **404 Page** — Not Found page with navigation back to dashboard and browser back button.

- **Deployment Configuration**:
  - `vercel.json` — SPA routing rewrites for Vercel deployment.
  - Vite build configuration with `dist` output directory.
  - Environment variable support via `.env` files (`VITE_APP_TITLE`, `VITE_API_BASE_URL`, `VITE_APP_ENV`).