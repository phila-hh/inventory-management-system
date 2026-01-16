import api from './api';



export const ordersService = {
  
  async getAll(type, status, startDate, endDate) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/orders?${params}`);
    return response.data;
  },

  
  async getOne(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  
  async create(data) {
    const response = await api.post('/orders', data);
    return response.data;
  },

  
  async update(id, data) {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  
  async cancel(id) {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  
  async getHistory() {
    const response = await api.get('/orders/history');
    return response.data;
  },
};
