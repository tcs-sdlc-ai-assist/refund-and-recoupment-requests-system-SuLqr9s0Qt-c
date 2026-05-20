import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import RequestRepository from '../services/requestRepository.js';
import MemberRepository from '../services/memberRepository.js';
import ProviderRepository from '../services/providerRepository.js';
import ValidationService from '../services/validationService.js';
import { formatDate, formatDateTime } from '../utils/formatters.js';
import { isEditableStatus } from '../utils/helpers.js';
import {
  REQUEST_TYPE_LIST,
  REQUEST_TYPE_LABELS,
  REQUEST_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
} from '../constants.js';

/**
 * Create and Edit Request page component.
 * Renders a form with fields for Request Type, Member, Provider, Claim ID, and Amount.
 * In edit mode, displays system info (Request ID, Created Date, Updated Date) as read-only.
 * Includes Save, Update, Process, Clear buttons with visibility based on mode and status.
 * Validates input via ValidationService and shows field-level errors.
 * Disables editing for processed/closed requests.
 * Uses React Router params for edit mode.
 * @returns {JSX.Element} The create/edit request page element.
 */
export default function CreateEditRequest() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!requestId;

  const [formData, setFormData] = useState({
    request_type: '',
    member_id: '',
    provider_id: '',
    claim_id: '',
    amount: '',
  });

  const [existingRequest, setExistingRequest] = useState(null);
  const [members, setMembers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    destructive: false,
    confirmLabel: 'Confirm',
  });

  const loadData = useCallback(() => {
    try {
      setMembers(MemberRepository.getMembers());
      setProviders(ProviderRepository.getProviders());

      if (isEditMode) {
        const request = RequestRepository.getRequestById(requestId);
        if (!request) {
          setAlertType('error');
          setAlertMessage(`Request with ID "${requestId}" not found.`);
          setLoading(false);
          return;
        }

        setExistingRequest(request);
        setFormData({
          request_type: request.request_type || '',
          member_id: request.member_id || '',
          provider_id: request.provider_id || '',
          claim_id: request.claim_id || '',
          amount: request.amount !== undefined && request.amount !== null ? String(request.amount) : '',
        });
      }
    } catch (e) {
      console.error('CreateEditRequest: Failed to load data.', e);
      setAlertType('error');
      setAlertMessage('Failed to load data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const editable = isEditMode ? (existingRequest ? isEditableStatus(existingRequest.status) : false) : true;

  /**
   * Handles form field changes and updates form data state.
   * Clears the field-level error for the changed field.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - The change event.
   */
  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }

  /**
   * Validates the current form data using ValidationService.
   * @returns {boolean} True if validation passes, false otherwise.
   */
  function validateForm() {
    const dataToValidate = {
      request_type: formData.request_type,
      member_id: formData.member_id,
      provider_id: formData.provider_id || undefined,
      claim_id: formData.claim_id || undefined,
      amount: formData.amount,
    };

    const validation = ValidationService.validateRequestData(dataToValidate);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return false;
    }

    setFieldErrors({});
    return true;
  }

  /**
   * Handles the Save button click for creating a new request.
   */
  function handleSave() {
    if (!validateForm()) {
      setAlertType('error');
      setAlertMessage('Please fix the validation errors before saving.');
      return;
    }

    const result = RequestRepository.createRequest({
      request_type: formData.request_type,
      member_id: formData.member_id,
      provider_id: formData.provider_id || undefined,
      claim_id: formData.claim_id || undefined,
      amount: Number(formData.amount),
    });

    if (result.success) {
      setAlertType('success');
      setAlertMessage(`Request ${result.data.request_id} created successfully.`);
      navigate(`/requests/${result.data.request_id}`);
    } else {
      setAlertType('error');
      setAlertMessage(result.error || 'Failed to create request.');
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
  }

  /**
   * Handles the Update button click for updating an existing request.
   */
  function handleUpdate() {
    if (!validateForm()) {
      setAlertType('error');
      setAlertMessage('Please fix the validation errors before updating.');
      return;
    }

    const result = RequestRepository.updateRequest(requestId, {
      request_type: formData.request_type,
      member_id: formData.member_id,
      provider_id: formData.provider_id || undefined,
      claim_id: formData.claim_id || undefined,
      amount: Number(formData.amount),
    });

    if (result.success) {
      setExistingRequest(result.data);
      setAlertType('success');
      setAlertMessage('Request updated successfully.');
    } else {
      setAlertType('error');
      setAlertMessage(result.error || 'Failed to update request.');
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
  }

  /**
   * Handles the Process button click to transition the request to In Progress status.
   */
  function handleProcess() {
    if (!existingRequest) return;

    const currentStatus = existingRequest.status;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    let targetStatus = null;
    if (currentStatus === REQUEST_STATUSES.NEW && allowedTransitions.includes(REQUEST_STATUSES.IN_PROGRESS)) {
      targetStatus = REQUEST_STATUSES.IN_PROGRESS;
    } else if (currentStatus === REQUEST_STATUSES.IN_PROGRESS && allowedTransitions.includes(REQUEST_STATUSES.PROCESSED)) {
      targetStatus = REQUEST_STATUSES.PROCESSED;
    }

    if (!targetStatus) {
      setAlertType('error');
      setAlertMessage(`Cannot process request from status "${currentStatus}".`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Process Request',
      message: `Are you sure you want to change the status from "${currentStatus}" to "${targetStatus}"?`,
      confirmLabel: 'Process',
      destructive: false,
      onConfirm: () => {
        const result = RequestRepository.changeRequestStatus(requestId, targetStatus);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (result.success) {
          setExistingRequest(result.data);
          setAlertType('success');
          setAlertMessage(`Request status changed to "${targetStatus}" successfully.`);
        } else {
          setAlertType('error');
          setAlertMessage(result.error || 'Failed to process request.');
        }
      },
    });
  }

  /**
   * Handles the Close button click to transition the request to Closed status.
   */
  function handleClose() {
    if (!existingRequest) return;

    const currentStatus = existingRequest.status;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(REQUEST_STATUSES.CLOSED)) {
      setAlertType('error');
      setAlertMessage(`Cannot close request from status "${currentStatus}".`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Close Request',
      message: 'Are you sure you want to close this request? This action cannot be undone.',
      confirmLabel: 'Close Request',
      destructive: true,
      onConfirm: () => {
        const result = RequestRepository.changeRequestStatus(requestId, REQUEST_STATUSES.CLOSED);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (result.success) {
          setExistingRequest(result.data);
          setAlertType('success');
          setAlertMessage('Request closed successfully.');
        } else {
          setAlertType('error');
          setAlertMessage(result.error || 'Failed to close request.');
        }
      },
    });
  }

  /**
   * Handles the Delete button click to delete the request.
   */
  function handleDelete() {
    if (!existingRequest) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Request',
      message: `Are you sure you want to delete request ${requestId}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        const result = RequestRepository.deleteRequest(requestId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (result.success) {
          setAlertType('success');
          setAlertMessage('Request deleted successfully.');
          navigate('/requests');
        } else {
          setAlertType('error');
          setAlertMessage(result.error || 'Failed to delete request.');
        }
      },
    });
  }

  /**
   * Handles the Clear button click to reset the form fields.
   */
  function handleClear() {
    if (isEditMode && existingRequest) {
      setFormData({
        request_type: existingRequest.request_type || '',
        member_id: existingRequest.member_id || '',
        provider_id: existingRequest.provider_id || '',
        claim_id: existingRequest.claim_id || '',
        amount: existingRequest.amount !== undefined && existingRequest.amount !== null ? String(existingRequest.amount) : '',
      });
    } else {
      setFormData({
        request_type: '',
        member_id: '',
        provider_id: '',
        claim_id: '',
        amount: '',
      });
    }
    setFieldErrors({});
    setAlertMessage('');
  }

  /**
   * Determines whether the Process button should be visible.
   * @returns {boolean}
   */
  function showProcessButton() {
    if (!isEditMode || !existingRequest) return false;
    const currentStatus = existingRequest.status;
    if (currentStatus === REQUEST_STATUSES.NEW || currentStatus === REQUEST_STATUSES.IN_PROGRESS) {
      return true;
    }
    return false;
  }

  /**
   * Determines whether the Close button should be visible.
   * @returns {boolean}
   */
  function showCloseButton() {
    if (!isEditMode || !existingRequest) return false;
    const currentStatus = existingRequest.status;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(REQUEST_STATUSES.CLOSED);
  }

  /**
   * Returns the label for the Process button based on current status.
   * @returns {string}
   */
  function getProcessButtonLabel() {
    if (!existingRequest) return 'Process';
    if (existingRequest.status === REQUEST_STATUSES.NEW) return 'Start Processing';
    if (existingRequest.status === REQUEST_STATUSES.IN_PROGRESS) return 'Mark as Processed';
    return 'Process';
  }

  const requestTypeOptions = REQUEST_TYPE_LIST.map((type) => ({
    value: type,
    label: REQUEST_TYPE_LABELS[type] || type,
  }));

  const memberOptions = members.map((m) => ({
    value: m.member_id,
    label: m.member_name,
  }));

  const providerOptions = providers.map((p) => ({
    value: p.provider_id,
    label: p.provider_name,
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg
          className="h-10 w-10 animate-spin text-primary-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-neutral-600">
          {isEditMode ? 'Loading request...' : 'Loading form...'}
        </p>
      </div>
    );
  }

  if (isEditMode && !existingRequest) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Request Not Found</h2>
          <p className="mt-1 text-sm text-neutral-500">
            The request you are looking for does not exist.
          </p>
        </div>
        {alertMessage && (
          <AlertMessage
            type={alertType}
            message={alertMessage}
            onDismiss={() => setAlertMessage('')}
          />
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 self-start"
          onClick={() => navigate('/requests')}
        >
          Back to Requests
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">
            {isEditMode ? `Request ${requestId}` : 'Create Request'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {isEditMode
              ? 'View and manage request details.'
              : 'Fill in the form below to create a new refund or recoupment request.'}
          </p>
        </div>
        {isEditMode && existingRequest && (
          <StatusBadge status={existingRequest.status} />
        )}
      </div>

      {/* Alert message */}
      {alertMessage && (
        <AlertMessage
          type={alertType}
          message={alertMessage}
          onDismiss={() => setAlertMessage('')}
          autoDismiss={alertType === 'success'}
          autoDismissTimeout={5000}
        />
      )}

      {/* Non-editable notice */}
      {isEditMode && !editable && (
        <AlertMessage
          type="warning"
          message={`This request has status "${existingRequest.status}" and cannot be edited.`}
        />
      )}

      {/* Form */}
      <div className="rounded-healthcare border border-neutral-200 bg-white p-6 shadow-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isEditMode) {
              handleUpdate();
            } else {
              handleSave();
            }
          }}
          noValidate
        >
          {/* System info fields (edit mode only) */}
          {isEditMode && existingRequest && (
            <div className="mb-6 grid grid-cols-1 gap-4 rounded-healthcare border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Request ID
                </span>
                <span className="text-sm font-semibold text-neutral-800">
                  {existingRequest.request_id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Created Date
                </span>
                <span className="text-sm text-neutral-700">
                  {formatDateTime(existingRequest.created_date)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Updated Date
                </span>
                <span className="text-sm text-neutral-700">
                  {formatDateTime(existingRequest.updated_date)}
                </span>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Request Type"
              name="request_type"
              type="select"
              value={formData.request_type}
              onChange={handleFieldChange}
              options={requestTypeOptions}
              placeholder="Select request type"
              required
              disabled={!editable}
              error={fieldErrors.request_type || ''}
            />

            <FormField
              label="Member"
              name="member_id"
              type="select"
              value={formData.member_id}
              onChange={handleFieldChange}
              options={memberOptions}
              placeholder="Select member"
              required
              disabled={!editable}
              error={fieldErrors.member_id || ''}
            />

            <FormField
              label="Provider"
              name="provider_id"
              type="select"
              value={formData.provider_id}
              onChange={handleFieldChange}
              options={providerOptions}
              placeholder="Select provider"
              disabled={!editable}
              error={fieldErrors.provider_id || ''}
            />

            <FormField
              label="Claim ID"
              name="claim_id"
              type="text"
              value={formData.claim_id}
              onChange={handleFieldChange}
              placeholder="e.g. CLM-1001"
              disabled={!editable}
              error={fieldErrors.claim_id || ''}
            />

            <FormField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleFieldChange}
              placeholder="0.00"
              required
              disabled={!editable}
              error={fieldErrors.amount || ''}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-6">
            {/* Save button (create mode only) */}
            {!isEditMode && (
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Save
              </button>
            )}

            {/* Update button (edit mode, editable status only) */}
            {isEditMode && editable && (
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Update
              </button>
            )}

            {/* Process button (edit mode, appropriate status) */}
            {showProcessButton() && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-success-500 hover:bg-success-600 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2"
                onClick={handleProcess}
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
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {getProcessButtonLabel()}
              </button>
            )}

            {/* Close button (edit mode, allowed transition) */}
            {showCloseButton() && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-neutral-500 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                onClick={handleClose}
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close Request
              </button>
            )}

            {/* Delete button (edit mode, editable status only) */}
            {isEditMode && editable && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-danger-500 hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2"
                onClick={handleDelete}
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
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Delete
              </button>
            )}

            {/* Clear button */}
            {editable && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={handleClear}
              >
                Clear
              </button>
            )}

            {/* Back button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-auto"
              onClick={() => navigate(isEditMode ? '/requests' : '/')}
            >
              {isEditMode ? 'Back to Requests' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        confirmLabel={confirmDialog.confirmLabel}
        destructive={confirmDialog.destructive}
      />
    </div>
  );
}