// Export all API modules for easier importing
export { default as authApi } from './authApi';
export { default as customerApi } from './customerApi';
export { default as roomApi } from './roomApi';
export { default as bookingApi } from './bookingApi';
export { default as serviceApi } from './serviceApi';
export { default as invoiceApi } from './invoiceApi';
export { default as itemApi } from './itemApi';

// Export utility functions
export {
  API_BASE_URL,
  getToken,
  getHeaders,
  handleApiError,
  apiCall,
  isLoggedIn,
  logout,
  getRole
} from './apiUtils';
