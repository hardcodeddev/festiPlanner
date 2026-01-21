
import { LocalState, Camp, User, PackingItem } from './types';

const STORAGE_KEY = 'festival_production_data';

const DEFAULT_STATE: LocalState = {
  currentUser: null,
  camps: [],
  personalLists: {},
  users: []
};

/**
 * Service to handle data persistence.
 * In production, these would be replaced with fetch() calls to your backend API.
 */
export const getStore = (): LocalState => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : DEFAULT_STATE;
};

export const saveStore = (state: LocalState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearStore = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
