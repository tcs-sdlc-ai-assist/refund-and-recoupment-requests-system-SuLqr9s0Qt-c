import RequestRepository from './requestRepository.js';
import PaymentRepository from './paymentRepository.js';
import { REQUEST_STATUSES, REQUEST_TYPES } from '../constants.js';

/**
 * Reporting and aggregation service.
 * Provides summary metrics and monthly report generation
 * by reading data from RequestRepository and PaymentRepository.
 */
const ReportingService = {
  /**
   * Computes summary metrics across all requests.
   * @returns {{
   *   totalRequests: number,
   *   totalRefundAmount: number,
   *   totalRecoupmentAmount: number,
   *   countByStatus: Object.<string, number>,
   *   countByType: Object.<string, number>,
   *   averageAmount: number,
   *   totalPayments: number,
   *   totalAmountPaid: number
   * }} Summary metrics object.
   */
  getSummaryMetrics() {
    const requests = RequestRepository.getRequests();
    const payments = PaymentRepository.getPayments();

    let totalRefundAmount = 0;
    let totalRecoupmentAmount = 0;

    const countByStatus = {
      [REQUEST_STATUSES.NEW]: 0,
      [REQUEST_STATUSES.IN_PROGRESS]: 0,
      [REQUEST_STATUSES.PROCESSED]: 0,
      [REQUEST_STATUSES.CLOSED]: 0,
    };

    const countByType = {
      [REQUEST_TYPES.REFUND]: 0,
      [REQUEST_TYPES.RECOUPMENT]: 0,
    };

    for (const request of requests) {
      const amount = Number(request.amount) || 0;

      if (request.request_type === REQUEST_TYPES.REFUND) {
        totalRefundAmount += amount;
        countByType[REQUEST_TYPES.REFUND]++;
      } else if (request.request_type === REQUEST_TYPES.RECOUPMENT) {
        totalRecoupmentAmount += amount;
        countByType[REQUEST_TYPES.RECOUPMENT]++;
      }

      if (request.status && countByStatus[request.status] !== undefined) {
        countByStatus[request.status]++;
      }
    }

    const totalRequests = requests.length;
    const totalAmount = totalRefundAmount + totalRecoupmentAmount;
    const averageAmount = totalRequests > 0 ? totalAmount / totalRequests : 0;

    let totalAmountPaid = 0;
    for (const payment of payments) {
      totalAmountPaid += Number(payment.amount_paid) || 0;
    }

    return {
      totalRequests,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
      totalRecoupmentAmount: Math.round(totalRecoupmentAmount * 100) / 100,
      countByStatus,
      countByType,
      averageAmount: Math.round(averageAmount * 100) / 100,
      totalPayments: payments.length,
      totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
    };
  },

  /**
   * Generates a monthly report for a given year and month.
   * Filters requests by created_date falling within the specified month.
   * Filters payments by payment_date falling within the specified month.
   * @param {number} year - The year (e.g., 2024).
   * @param {number} month - The month (1-12).
   * @returns {{
   *   year: number,
   *   month: number,
   *   totalRequests: number,
   *   totalRefundAmount: number,
   *   totalRecoupmentAmount: number,
   *   countByStatus: Object.<string, number>,
   *   countByType: Object.<string, number>,
   *   totalPayments: number,
   *   totalAmountPaid: number,
   *   requests: Array<Object>,
   *   payments: Array<Object>
   * }} Monthly report object.
   */
  getMonthlyReport(year, month) {
    if (year === undefined || year === null || month === undefined || month === null) {
      return {
        year: null,
        month: null,
        totalRequests: 0,
        totalRefundAmount: 0,
        totalRecoupmentAmount: 0,
        countByStatus: {
          [REQUEST_STATUSES.NEW]: 0,
          [REQUEST_STATUSES.IN_PROGRESS]: 0,
          [REQUEST_STATUSES.PROCESSED]: 0,
          [REQUEST_STATUSES.CLOSED]: 0,
        },
        countByType: {
          [REQUEST_TYPES.REFUND]: 0,
          [REQUEST_TYPES.RECOUPMENT]: 0,
        },
        totalPayments: 0,
        totalAmountPaid: 0,
        requests: [],
        payments: [],
      };
    }

    const numericYear = Number(year);
    const numericMonth = Number(month);

    if (isNaN(numericYear) || isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      return {
        year: numericYear,
        month: numericMonth,
        totalRequests: 0,
        totalRefundAmount: 0,
        totalRecoupmentAmount: 0,
        countByStatus: {
          [REQUEST_STATUSES.NEW]: 0,
          [REQUEST_STATUSES.IN_PROGRESS]: 0,
          [REQUEST_STATUSES.PROCESSED]: 0,
          [REQUEST_STATUSES.CLOSED]: 0,
        },
        countByType: {
          [REQUEST_TYPES.REFUND]: 0,
          [REQUEST_TYPES.RECOUPMENT]: 0,
        },
        totalPayments: 0,
        totalAmountPaid: 0,
        requests: [],
        payments: [],
      };
    }

    // Build start and end dates for the month
    const startDate = new Date(Date.UTC(numericYear, numericMonth - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(numericYear, numericMonth, 1, 0, 0, 0, 0));

    const allRequests = RequestRepository.getRequests();
    const allPayments = PaymentRepository.getPayments();

    // Filter requests within the month by created_date
    const monthlyRequests = allRequests.filter((r) => {
      if (!r.created_date) {
        return false;
      }
      const createdDate = new Date(r.created_date);
      return !isNaN(createdDate.getTime()) && createdDate >= startDate && createdDate < endDate;
    });

    // Filter payments within the month by payment_date
    const monthlyPayments = allPayments.filter((p) => {
      if (!p.payment_date) {
        return false;
      }
      const paymentDate = new Date(p.payment_date);
      return !isNaN(paymentDate.getTime()) && paymentDate >= startDate && paymentDate < endDate;
    });

    let totalRefundAmount = 0;
    let totalRecoupmentAmount = 0;

    const countByStatus = {
      [REQUEST_STATUSES.NEW]: 0,
      [REQUEST_STATUSES.IN_PROGRESS]: 0,
      [REQUEST_STATUSES.PROCESSED]: 0,
      [REQUEST_STATUSES.CLOSED]: 0,
    };

    const countByType = {
      [REQUEST_TYPES.REFUND]: 0,
      [REQUEST_TYPES.RECOUPMENT]: 0,
    };

    for (const request of monthlyRequests) {
      const amount = Number(request.amount) || 0;

      if (request.request_type === REQUEST_TYPES.REFUND) {
        totalRefundAmount += amount;
        countByType[REQUEST_TYPES.REFUND]++;
      } else if (request.request_type === REQUEST_TYPES.RECOUPMENT) {
        totalRecoupmentAmount += amount;
        countByType[REQUEST_TYPES.RECOUPMENT]++;
      }

      if (request.status && countByStatus[request.status] !== undefined) {
        countByStatus[request.status]++;
      }
    }

    let totalAmountPaid = 0;
    for (const payment of monthlyPayments) {
      totalAmountPaid += Number(payment.amount_paid) || 0;
    }

    return {
      year: numericYear,
      month: numericMonth,
      totalRequests: monthlyRequests.length,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
      totalRecoupmentAmount: Math.round(totalRecoupmentAmount * 100) / 100,
      countByStatus,
      countByType,
      totalPayments: monthlyPayments.length,
      totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
      requests: monthlyRequests,
      payments: monthlyPayments,
    };
  },
};

export default ReportingService;