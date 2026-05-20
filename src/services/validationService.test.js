import { describe, it, expect } from 'vitest';
import ValidationService from './validationService.js';

describe('ValidationService', () => {
  describe('validateRequestData', () => {
    describe('amount validation', () => {
      it('passes validation for a valid positive amount', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 100.50,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('passes validation for the minimum allowed amount (0.01)', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 0.01,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.amount).toBeUndefined();
      });

      it('passes validation for a large valid amount', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 999999999.99,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.amount).toBeUndefined();
      });

      it('fails validation when amount is zero', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 0,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount must be greater than 0.');
      });

      it('fails validation when amount is negative', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: -50,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount must be greater than 0.');
      });

      it('fails validation when amount is non-numeric string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 'abc',
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount must be a valid number.');
      });

      it('fails validation when amount is undefined', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: undefined,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount is required.');
      });

      it('fails validation when amount is null', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: null,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount is required.');
      });

      it('fails validation when amount is an empty string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: '',
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount is required.');
      });

      it('fails validation when amount exceeds the maximum allowed value', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 1000000000,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('Amount must not exceed 999,999,999.99.');
      });

      it('passes validation when amount is a valid numeric string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: '250.75',
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.amount).toBeUndefined();
      });
    });

    describe('member_id validation', () => {
      it('passes validation for a valid member_id', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.member_id).toBeUndefined();
      });

      it('fails validation when member_id is missing', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.member_id).toBe('Member ID is required.');
      });

      it('fails validation when member_id is an empty string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: '',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.member_id).toBe('Member ID is required.');
      });

      it('fails validation when member_id is null', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: null,
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.member_id).toBe('Member ID is required.');
      });

      it('fails validation when member_id is undefined', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: undefined,
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.member_id).toBe('Member ID is required.');
      });

      it('fails validation when member_id is a whitespace-only string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: '   ',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.member_id).toBe('Member ID must be a non-empty string.');
      });

      it('fails validation when member_id is a number instead of string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 123,
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.member_id).toBeDefined();
      });
    });

    describe('request_type validation', () => {
      it('passes validation for request_type "refund"', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.request_type).toBeUndefined();
      });

      it('passes validation for request_type "recoupment"', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'recoupment',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.request_type).toBeUndefined();
      });

      it('fails validation when request_type is missing', () => {
        const result = ValidationService.validateRequestData({
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.request_type).toBe('Request type is required.');
      });

      it('fails validation when request_type is an empty string', () => {
        const result = ValidationService.validateRequestData({
          request_type: '',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.request_type).toBe('Request type is required.');
      });

      it('fails validation when request_type is an invalid value', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'invalid_type',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.request_type).toBe('Request type must be one of: refund, recoupment.');
      });

      it('fails validation when request_type is null', () => {
        const result = ValidationService.validateRequestData({
          request_type: null,
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.request_type).toBe('Request type is required.');
      });
    });

    describe('provider_id validation', () => {
      it('passes validation when provider_id is a valid string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          provider_id: 'P001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.provider_id).toBeUndefined();
      });

      it('passes validation when provider_id is undefined (optional field)', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.provider_id).toBeUndefined();
      });

      it('fails validation when provider_id is an empty string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          provider_id: '',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.provider_id).toBe('Provider ID must be a non-empty string.');
      });

      it('fails validation when provider_id is a whitespace-only string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          provider_id: '   ',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.provider_id).toBe('Provider ID must be a non-empty string.');
      });
    });

    describe('claim_id validation', () => {
      it('passes validation for a valid claim_id format (CLM-1001)', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          claim_id: 'CLM-1001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.claim_id).toBeUndefined();
      });

      it('passes validation when claim_id is undefined (optional field)', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.claim_id).toBeUndefined();
      });

      it('passes validation when claim_id is an empty string', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          claim_id: '',
          amount: 100,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors.claim_id).toBeUndefined();
      });

      it('fails validation when claim_id does not match the CLM-<number> format', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          claim_id: 'INVALID-ID',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.claim_id).toBe('Claim ID must follow the format CLM-<number> (e.g., CLM-1001).');
      });

      it('fails validation when claim_id is missing the CLM- prefix', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          claim_id: '1001',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.claim_id).toBe('Claim ID must follow the format CLM-<number> (e.g., CLM-1001).');
      });

      it('fails validation when claim_id has letters after CLM-', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          claim_id: 'CLM-abc',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.claim_id).toBe('Claim ID must follow the format CLM-<number> (e.g., CLM-1001).');
      });
    });

    describe('combined validation scenarios', () => {
      it('returns isValid true and empty errors for fully valid data', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          provider_id: 'P001',
          claim_id: 'CLM-1001',
          amount: 250.00,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('returns isValid true for valid recoupment request with all fields', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'recoupment',
          member_id: 'M002',
          provider_id: 'P003',
          claim_id: 'CLM-2000',
          amount: 475.50,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('returns isValid true for minimal valid data (only required fields)', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 50,
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('returns multiple errors when multiple fields are invalid', () => {
        const result = ValidationService.validateRequestData({
          request_type: '',
          member_id: '',
          claim_id: 'INVALID',
          amount: -10,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.request_type).toBeDefined();
        expect(result.errors.member_id).toBeDefined();
        expect(result.errors.claim_id).toBeDefined();
        expect(result.errors.amount).toBeDefined();
      });

      it('returns all errors when all required fields are missing', () => {
        const result = ValidationService.validateRequestData({});

        expect(result.isValid).toBe(false);
        expect(result.errors.request_type).toBe('Request type is required.');
        expect(result.errors.member_id).toBe('Member ID is required.');
        expect(result.errors.amount).toBe('Amount is required.');
      });

      it('returns errors object with correct field keys only for invalid fields', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: '',
          amount: 100,
        });

        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors)).toEqual(['member_id']);
        expect(result.errors.member_id).toBe('Member ID is required.');
        expect(result.errors.request_type).toBeUndefined();
        expect(result.errors.amount).toBeUndefined();
      });

      it('validates amount passed as a string number correctly', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'recoupment',
          member_id: 'M003',
          amount: '999.99',
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('returns the correct structure with isValid and errors properties', () => {
        const result = ValidationService.validateRequestData({
          request_type: 'refund',
          member_id: 'M001',
          amount: 100,
        });

        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(typeof result.isValid).toBe('boolean');
        expect(typeof result.errors).toBe('object');
      });
    });
  });
});