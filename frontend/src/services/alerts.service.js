import api from './api';



export const alertsService = {
  
  async getAll(status, startDate, endDate) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/alerts?${params}`);
    return response.data;
  },

  
  async getOne(id) {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  
  async markAsRead(id) {
    const response = await api.patch(`/alerts/${id}/read`);
    return response.data;
  },

  
  async dismiss(id) {
    const response = await api.patch(`/alerts/${id}/dismiss`);
    return response.data;
  },

  
  async getUnreadCount() {
    const response = await api.get('/alerts/unread-count');
    return response.data.count;
  },

  
  async triggerForecasting() {
    const response = await api.post('/alerts/trigger/forecasting');
    return response.data;
  },

  
  async triggerReorderAlerts() {
    const response = await api.post('/alerts/trigger/reorder-alerts');
    return response.data;
  },
};
