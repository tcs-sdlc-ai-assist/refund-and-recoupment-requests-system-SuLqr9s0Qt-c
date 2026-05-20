import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS, CURRENT_DATA_VERSION, SEED_MEMBERS, SEED_PROVIDERS, SEED_PAYMENTS, SEED_REQUESTS } from '../constants.js';

describe('DataStore', () => {
  let originalLocalStorage;
  let mockStorage;

  function createMockStorage() {
    const store = {};
    return {
      getItem: vi.fn((key) => {
        return store[key] !== undefined ? store[key] : null;
      }),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      _store: store,
    };
  }

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    mockStorage = createMockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('getEntity', () => {
    it('returns an empty array when key does not exist in localStorage', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.getEntity('nonexistent_key');
      expect(result).toEqual([]);
    });

    it('returns parsed array from localStorage for a valid key', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      mockStorage._store['test_key'] = JSON.stringify(testData);
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.getEntity('test_key');
      expect(result).toEqual(testData);
    });

    it('returns an empty array when stored value is not an array', async () => {
      mockStorage._store['test_key'] = JSON.stringify({ not: 'an array' });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.getEntity('test_key');
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('returns an empty array when stored value is invalid JSON', async () => {
      mockStorage._store['test_key'] = 'not valid json{{{';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.getEntity('test_key');
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('setEntity', () => {
    it('serializes and persists data to localStorage', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      const testData = [{ id: '1', name: 'Test Item' }];
      const result = DataStore.setEntity('test_key', testData);
      expect(result).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test_key', JSON.stringify(testData));
    });

    it('returns true on successful write', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.setEntity('test_key', []);
      expect(result).toBe(true);
    });

    it('retries and returns false after repeated localStorage failures', async () => {
      mockStorage.setItem.mockImplementation((key, value) => {
        if (key !== '__storage_test__') {
          throw new Error('QuotaExceededError');
        }
        mockStorage._store[key] = String(value);
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.setEntity('test_key', [{ big: 'data' }]);
      expect(result).toBe(false);
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeEntity', () => {
    it('removes the key from localStorage and returns true', async () => {
      mockStorage._store['test_key'] = JSON.stringify([{ id: '1' }]);
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.removeEntity('test_key');
      expect(result).toBe(true);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('returns false when localStorage.removeItem throws', async () => {
      mockStorage.removeItem.mockImplementation((key) => {
        if (key !== '__storage_test__') {
          throw new Error('Storage error');
        }
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.removeEntity('test_key');
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('getVersion / setVersion', () => {
    it('returns null when no version is set', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      // After seed, version will be set. Clear it to test.
      delete mockStorage._store[STORAGE_KEYS.DATA_VERSION];
      mockStorage.getItem.mockImplementation((key) => {
        return mockStorage._store[key] !== undefined ? mockStorage._store[key] : null;
      });
      const result = DataStore.getVersion();
      expect(result).toBeNull();
    });

    it('returns the version string after setVersion is called', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      DataStore.setVersion('2.0.0');
      expect(mockStorage._store[STORAGE_KEYS.DATA_VERSION]).toBe('2.0.0');
      const version = DataStore.getVersion();
      expect(version).toBe('2.0.0');
    });

    it('setVersion returns true on success', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      const result = DataStore.setVersion('1.0.0');
      expect(result).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('returns true when localStorage is available', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      expect(DataStore.isAvailable()).toBe(true);
    });
  });

  describe('seedInitialData', () => {
    it('seeds members, providers, payments, and requests when localStorage is empty', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      // The import itself triggers seedInitialData, so data should already be seeded
      const members = JSON.parse(mockStorage._store[STORAGE_KEYS.MEMBERS]);
      const providers = JSON.parse(mockStorage._store[STORAGE_KEYS.PROVIDERS]);
      const payments = JSON.parse(mockStorage._store[STORAGE_KEYS.PAYMENTS]);
      const requests = JSON.parse(mockStorage._store[STORAGE_KEYS.REQUESTS]);

      expect(members).toEqual(SEED_MEMBERS);
      expect(providers).toEqual(SEED_PROVIDERS);
      expect(payments).toEqual(SEED_PAYMENTS);
      expect(requests).toEqual(SEED_REQUESTS);
    });

    it('sets the data version after seeding', async () => {
      const { default: DataStore } = await import('./dataStore.js');
      const version = mockStorage._store[STORAGE_KEYS.DATA_VERSION];
      expect(version).toBe(CURRENT_DATA_VERSION);
    });

    it('does not overwrite existing data when version matches', async () => {
      // Pre-populate with custom data and set version
      const customMembers = [{ member_id: 'M999', member_name: 'Custom Member' }];
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(customMembers);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify(SEED_PAYMENTS);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(SEED_REQUESTS);
      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;

      const { default: DataStore } = await import('./dataStore.js');

      // Members should still be the custom data, not overwritten
      const members = JSON.parse(mockStorage._store[STORAGE_KEYS.MEMBERS]);
      expect(members).toEqual(customMembers);
    });

    it('does not overwrite existing entity data when version is outdated but data exists', async () => {
      const customRequests = [{ request_id: 'REQ-999', request_type: 'refund', amount: 100 }];
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify(SEED_PAYMENTS);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(customRequests);
      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = '0.0.1';

      const { default: DataStore } = await import('./dataStore.js');

      // Requests should not be overwritten because they already have data
      const requests = JSON.parse(mockStorage._store[STORAGE_KEYS.REQUESTS]);
      expect(requests).toEqual(customRequests);
      // But version should be updated
      expect(mockStorage._store[STORAGE_KEYS.DATA_VERSION]).toBe(CURRENT_DATA_VERSION);
    });
  });

  describe('storage unavailability', () => {
    it('returns empty array from getEntity when localStorage is unavailable', async () => {
      // Make localStorage throw on the availability test
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage is not available');
        },
        configurable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');

      expect(DataStore.isAvailable()).toBe(false);
      expect(DataStore.getEntity(STORAGE_KEYS.REQUESTS)).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('returns false from setEntity when localStorage is unavailable', async () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage is not available');
        },
        configurable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');

      expect(DataStore.setEntity('test_key', [])).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns false from removeEntity when localStorage is unavailable', async () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage is not available');
        },
        configurable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');

      expect(DataStore.removeEntity('test_key')).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns null from getVersion when localStorage is unavailable', async () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage is not available');
        },
        configurable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');

      expect(DataStore.getVersion()).toBeNull();
      consoleSpy.mockRestore();
    });

    it('returns false from setVersion when localStorage is unavailable', async () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage is not available');
        },
        configurable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: DataStore } = await import('./dataStore.js');

      expect(DataStore.setVersion('1.0.0')).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});