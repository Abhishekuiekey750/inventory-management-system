import client from './client';

export const dashboardApi = {
  getStats: (params = {}) => {
    // params: { low_stock_threshold }
    return client.get('/dashboard/stats', { params });
  },
};
