import client from './client';

export const ordersApi = {
  getAll: (params = {}) => {
    // params: { customer_id, status, skip, limit }
    return client.get('/orders/', { params });
  },
  getOne: (id) => {
    return client.get(`/orders/${id}`);
  },
  create: (data) => {
    return client.post('/orders/', data);
  },
  updateStatus: (id, status) => {
    return client.put(`/orders/${id}/status`, { status });
  },
  cancel: (id) => {
    return client.delete(`/orders/${id}`);
  },
};
