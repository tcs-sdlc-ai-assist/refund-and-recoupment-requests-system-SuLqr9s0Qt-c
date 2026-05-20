import DataStore from './dataStore.js';
import { STORAGE_KEYS, ID_PREFIXES } from '../constants.js';

/**
 * Repository for MEMBER entity data access.
 * Provides CRUD operations backed by localStorage via DataStore.
 */
const MemberRepository = {
  /**
   * Retrieves all members from localStorage.
   * @returns {Array<Object>} Array of member objects.
   */
  getMembers() {
    return DataStore.getEntity(STORAGE_KEYS.MEMBERS);
  },

  /**
   * Retrieves a single member by their member_id.
   * @param {string} memberId - The member ID to look up.
   * @returns {Object|null} The member object, or null if not found.
   */
  getMemberById(memberId) {
    if (!memberId || typeof memberId !== 'string') {
      return null;
    }

    const members = DataStore.getEntity(STORAGE_KEYS.MEMBERS);
    const member = members.find((m) => m.member_id === memberId);
    return member || null;
  },

  /**
   * Creates a new member and persists it to localStorage.
   * @param {Object} memberData - The member data to create.
   * @param {string} memberData.member_name - The name of the member.
   * @returns {{ success: boolean, data?: Object, error?: string }} Result of the create operation.
   */
  createMember(memberData) {
    if (!memberData || !memberData.member_name || typeof memberData.member_name !== 'string' || memberData.member_name.trim() === '') {
      return { success: false, error: 'Member name is required and must be a non-empty string.' };
    }

    const members = DataStore.getEntity(STORAGE_KEYS.MEMBERS);

    const nextId = this._generateNextId(members);

    const newMember = {
      member_id: nextId,
      member_name: memberData.member_name.trim(),
    };

    members.push(newMember);

    const written = DataStore.setEntity(STORAGE_KEYS.MEMBERS, members);
    if (!written) {
      return { success: false, error: 'Failed to save member to localStorage.' };
    }

    return { success: true, data: newMember };
  },

  /**
   * Updates an existing member by member_id and persists changes to localStorage.
   * @param {string} memberId - The ID of the member to update.
   * @param {Object} updateData - The fields to update.
   * @param {string} [updateData.member_name] - The updated name of the member.
   * @returns {{ success: boolean, data?: Object, error?: string }} Result of the update operation.
   */
  updateMember(memberId, updateData) {
    if (!memberId || typeof memberId !== 'string') {
      return { success: false, error: 'Member ID is required and must be a non-empty string.' };
    }

    if (!updateData || typeof updateData !== 'object') {
      return { success: false, error: 'Update data is required.' };
    }

    const members = DataStore.getEntity(STORAGE_KEYS.MEMBERS);
    const index = members.findIndex((m) => m.member_id === memberId);

    if (index === -1) {
      return { success: false, error: `Member with ID "${memberId}" not found.` };
    }

    if (updateData.member_name !== undefined) {
      if (typeof updateData.member_name !== 'string' || updateData.member_name.trim() === '') {
        return { success: false, error: 'Member name must be a non-empty string.' };
      }
      members[index].member_name = updateData.member_name.trim();
    }

    const written = DataStore.setEntity(STORAGE_KEYS.MEMBERS, members);
    if (!written) {
      return { success: false, error: 'Failed to save updated member to localStorage.' };
    }

    return { success: true, data: { ...members[index] } };
  },

  /**
   * Generates the next unique member ID based on existing members.
   * @param {Array<Object>} members - The current array of member objects.
   * @returns {string} The next member ID (e.g., "M006").
   * @private
   */
  _generateNextId(members) {
    const prefix = ID_PREFIXES.MEMBER;
    let maxNum = 0;

    for (const member of members) {
      if (member.member_id && member.member_id.startsWith(prefix)) {
        const numPart = parseInt(member.member_id.slice(prefix.length), 10);
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

export default MemberRepository;