import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateEditRequest from './pages/CreateEditRequest.jsx';
import SearchRequests from './pages/SearchRequests.jsx';
import Reports from './pages/Reports.jsx';
import NotFound from './pages/NotFound.jsx';
import './services/dataStore.js';

/**
 * Root application component.
 * Sets up React Router with BrowserRouter and defines all application routes.
 * Wraps routes in the Layout component for consistent navigation and structure.
 * Initializes seed data in localStorage on first load via dataStore import.
 * @returns {JSX.Element} The root application element with routing configuration.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests/create" element={<CreateEditRequest />} />
          <Route path="/requests/:requestId" element={<CreateEditRequest />} />
          <Route path="/requests" element={<SearchRequests />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}