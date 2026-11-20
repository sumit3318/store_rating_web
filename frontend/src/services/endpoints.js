import api from './api';

const data = (promise) => promise.then((res) => res.data);

export const authApi = {
  login: (body) => data(api.post('/auth/login', body)),
  signup: (body) => data(api.post('/auth/signup', body)),
  logout: () => data(api.post('/auth/logout')),
  me: () => data(api.get('/auth/me')),
  changePassword: (body) => data(api.put('/auth/password', body)),
};

export const adminApi = {
  stats: () => data(api.get('/admin/stats')),
  listUsers: (params) => data(api.get('/admin/users', { params })),
  getUser: (id) => data(api.get(`/admin/users/${id}`)),
  createUser: (body) => data(api.post('/admin/users', body)),
  listStores: (params) => data(api.get('/admin/stores', { params })),
  createStore: (body) => data(api.post('/admin/stores', body)),
  availableOwners: () => data(api.get('/admin/owners/available')),
};

export const storeApi = {
  list: (params) => data(api.get('/stores', { params })),
  submitRating: (storeId, rating) => data(api.post(`/stores/${storeId}/rating`, { rating })),
  updateRating: (storeId, rating) => data(api.put(`/stores/${storeId}/rating`, { rating })),
  myRatings: (params) => data(api.get('/ratings/me', { params })),
};

export const ownerApi = {
  dashboard: (params) => data(api.get('/owner/dashboard', { params })),
};
