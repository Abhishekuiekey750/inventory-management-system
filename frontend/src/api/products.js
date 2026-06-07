import client from './client';

export const productsApi = {
  getAll: (params = {}) => {
    // params: { query, lowStock, lowStockThreshold, skip, limit }
    return client.get('/products/', { params });
  },
  getOne: (id) => {
    return client.get(`/products/${id}`);
  },
  create: (data) => {
    return client.post('/products/', data);
  },
  update: (id, data) => {
    return client.put(`/products/${id}`, data);
  },
  delete: (id) => {
    return client.delete(`/products/${id}`);
  },
};
