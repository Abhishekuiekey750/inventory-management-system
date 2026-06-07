import client from './client';

export const customersApi = {
  getAll: (params = {}) => {
    // params: { query, skip, limit }
    return client.get('/customers/', { params });
  },
  getOne: (id) => {
    return client.get(`/customers/${id}`);
  },
  create: (data) => {
    return client.post('/customers/', data);
  },
  delete: (id) => {
    return client.delete(`/customers/${id}`);
  },
};
