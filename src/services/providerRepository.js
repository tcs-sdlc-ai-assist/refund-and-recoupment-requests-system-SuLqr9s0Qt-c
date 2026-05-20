import DataStore from './dataStore.js';
import { STORAGE_KEYS, ID_PREFIXES } from '../constants.js';

/**
 * Repository for PROVIDER entity data access.
 * Provides CRUD operations backed by localStorage via DataStore.
 */
const ProviderRepository = {
  /**
   * Retrieves all providers from localStorage.
   * @returns {Array<Object>} Array of provider objects.
   */
  getProviders() {
    return DataStore.getEntity(STORAGE_KEYS.PROVIDERS);
  },

  /**
   * Retrieves a single provider by their provider_id.
   * @param {string} providerId - The provider ID to look up.
   * @returns {Object|null} The provider object, or null if not found.
   */
  getProviderById(providerId) {
    if (!providerId || typeof providerId !== 'string') {
      return null;
    }

    const providers = DataStore.getEntity(STORAGE_KEYS.PROVIDERS);
    const provider = providers.find((p) => p.provider_id === providerId);
    return provider || null;
  },

  /**
   * Creates a new provider and persists it to localStorage.
   * @param {Object} providerData - The provider data to create.
   * @param {string} providerData.provider_name - The name of the provider.
   * @returns {{ success: boolean, data?: Object, error?: string }} Result of the create operation.
   */
  createProvider(providerData) {
    if (!providerData || !providerData.provider_name || typeof providerData.provider_name !== 'string' || providerData.provider_name.trim() === '') {
      return { success: false, error: 'Provider name is required and must be a non-empty string.' };
    }

    const providers = DataStore.getEntity(STORAGE_KEYS.PROVIDERS);

    const nextId = this._generateNextId(providers);

    const newProvider = {
      provider_id: nextId,
      provider_name: providerData.provider_name.trim(),
    };

    providers.push(newProvider);

    const written = DataStore.setEntity(STORAGE_KEYS.PROVIDERS, providers);
    if (!written) {
      return { success: false, error: 'Failed to save provider to localStorage.' };
    }

    return { success: true, data: newProvider };
  },

  /**
   * Updates an existing provider by provider_id and persists changes to localStorage.
   * @param {string} providerId - The ID of the provider to update.
   * @param {Object} updateData - The fields to update.
   * @param {string} [updateData.provider_name] - The updated name of the provider.
   * @returns {{ success: boolean, data?: Object, error?: string }} Result of the update operation.
   */
  updateProvider(providerId, updateData) {
    if (!providerId || typeof providerId !== 'string') {
      return { success: false, error: 'Provider ID is required and must be a non-empty string.' };
    }

    if (!updateData || typeof updateData !== 'object') {
      return { success: false, error: 'Update data is required.' };
    }

    const providers = DataStore.getEntity(STORAGE_KEYS.PROVIDERS);
    const index = providers.findIndex((p) => p.provider_id === providerId);

    if (index === -1) {
      return { success: false, error: `Provider with ID "${providerId}" not found.` };
    }

    if (updateData.provider_name !== undefined) {
      if (typeof updateData.provider_name !== 'string' || updateData.provider_name.trim() === '') {
        return { success: false, error: 'Provider name must be a non-empty string.' };
      }
      providers[index].provider_name = updateData.provider_name.trim();
    }

    const written = DataStore.setEntity(STORAGE_KEYS.PROVIDERS, providers);
    if (!written) {
      return { success: false, error: 'Failed to save updated provider to localStorage.' };
    }

    return { success: true, data: { ...providers[index] } };
  },

  /**
   * Generates the next unique provider ID based on existing providers.
   * @param {Array<Object>} providers - The current array of provider objects.
   * @returns {string} The next provider ID (e.g., "P006").
   * @private
   */
  _generateNextId(providers) {
    const prefix = ID_PREFIXES.PROVIDER;
    let maxNum = 0;

    for (const provider of providers) {
      if (provider.provider_id && provider.provider_id.startsWith(prefix)) {
        const numPart = parseInt(provider.provider_id.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}${padded}`;
  },
};

export default ProviderRepository;