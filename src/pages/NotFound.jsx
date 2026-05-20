import { useNavigate } from 'react-router-dom';

/**
 * 404 Not Found page component.
 * Displayed when navigating to an undefined route.
 * Includes a link back to the dashboard.
 * @returns {JSX.Element} The 404 page element.
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
        <svg
          className="h-10 w-10 text-primary-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="mt-6 text-3xl font-semibold text-neutral-800">404</h2>
      <p className="mt-2 text-lg font-medium text-neutral-600">Page Not Found</p>
      <p className="mt-2 max-w-md text-center text-sm text-neutral-500">
        The page you are looking for does not exist or has been moved. Please check the URL or navigate back to the dashboard.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={() => navigate('/')}
        >
          <svg
            className="mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Go to Dashboard
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}