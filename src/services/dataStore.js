import {
  STORAGE_KEYS,
  CURRENT_DATA_VERSION,
  SEED_MEMBERS,
  SEED_PROVIDERS,
  SEED_PAYMENTS,
  SEED_REQUESTS,
} from '../constants.js';

/**
 * Checks whether localStorage is available in the current environment.
 * @returns {boolean} True if localStorage is accessible and functional.
 */
function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

/**
 * Core localStorage abstraction layer.
 * Provides JSON serialization/deserialization, error handling,
 * storage availability detection, and initial data seeding.
 */
const DataStore = {
  /**
   * Retrieves and deserializes an entity array from localStorage.
   * @param {string} key - The localStorage key to read from.
   * @returns {Array<Object>} The parsed array, or an empty array if not found or on error.
   */
  getEntity(key) {
    if (!storageAvailable) {
      console.error('DataStore: localStorage is not available.');
      return [];
    }

    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn(`DataStore: Expected array for key "${key}", got ${typeof parsed}. Returning empty array.`);
        return [];
      }
      return parsed;
    } catch (e) {
      console.error(`DataStore: Failed to read key "${key}" from localStorage.`, e);
      return [];
    }
  },

  /**
   * Serializes and persists an entity array to localStorage.
   * Retries up to 3 times with exponential backoff on failure.
   * @param {string} key - The localStorage key to write to.
   * @param {Array<Object>} data - The array of entity objects to persist.
   * @returns {boolean} True if the write succeeded, false otherwise.
   */
  setEntity(key, data) {
    if (!storageAvailable) {
      console.error('DataStore: localStorage is not available.');
      return false;
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
        return true;
      } catch (e) {
        attempt++;
        console.warn(`DataStore: Write attempt ${attempt} failed for key "${key}".`, e);
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 50;
          const start = Date.now();
          while (Date.now() - start < delay) {
            // synchronous backoff
          }
        }
      }
    }

    console.error(`DataStore: Failed to write key "${key}" after ${maxRetries} attempts.`);
    return false;
  },

  /**
   * Removes an entity from localStorage.
   * @param {string} key - The localStorage key to remove.
   * @returns {boolean} True if the removal succeeded, false otherwise.
   */
  removeEntity(key) {
    if (!storageAvailable) {
      console.error('DataStore: localStorage is not available.');
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`DataStore: Failed to remove key "${key}" from localStorage.`, e);
      return false;
    }
  },

  /**
   * Retrieves the current data version string from localStorage.
   * @returns {string|null} The version string, or null if not set.
   */
  getVersion() {
    if (!storageAvailable) {
      console.error('DataStore: localStorage is not available.');
      return null;
    }

    try {
      return localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    } catch (e) {
      console.error('DataStore: Failed to read data version.', e);
      return null;
    }
  },

  /**
   * Sets the data version string in localStorage.
   * @param {string} version - The version string to persist.
   * @returns {boolean} True if the write succeeded, false otherwise.
   */
  setVersion(version) {
    if (!storageAvailable) {
      console.error('DataStore: localStorage is not available.');
      return false;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.DATA_VERSION, version);
      return true;
    } catch (e) {
      console.error('DataStore: Failed to write data version.', e);
      return false;
    }
  },

  /**
   * Returns whether localStorage is available.
   * @returns {boolean}
   */
  isAvailable() {
    return storageAvailable;
  },

  /**
   * Seeds initial data into localStorage if not already present.
   * Called on first load to populate members, providers, payments, and requests.
   */
  seedInitialData() {
    if (!storageAvailable) {
      console.error('DataStore: localStorage is not available. Cannot seed data.');
      return;
    }

    const currentVersion = this.getVersion();

    if (currentVersion === CURRENT_DATA_VERSION) {
      return;
    }

    const members = this.getEntity(STORAGE_KEYS.MEMBERS);
    if (members.length === 0) {
      this.setEntity(STORAGE_KEYS.MEMBERS, SEED_MEMBERS);
    }

    const providers = this.getEntity(STORAGE_KEYS.PROVIDERS);
    if (providers.length === 0) {
      this.setEntity(STORAGE_KEYS.PROVIDERS, SEED_PROVIDERS);
    }

    const payments = this.getEntity(STORAGE_KEYS.PAYMENTS);
    if (payments.length === 0) {
      this.setEntity(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    }

    const requests = this.getEntity(STORAGE_KEYS.REQUESTS);
    if (requests.length === 0) {
      this.setEntity(STORAGE_KEYS.REQUESTS, SEED_REQUESTS);
    }

    this.setVersion(CURRENT_DATA_VERSION);
  },
};

// Seed initial data on module load
DataStore.seedInitialData();

export default DataStore;