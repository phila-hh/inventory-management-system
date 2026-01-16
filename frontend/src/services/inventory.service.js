import api from './api';



export const inventoryService = {
  
  async getAll(category, search) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await api.get(`/inventory?${params}`);
    return response.data;
  },

  
  async getOne(id) {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  
  async create(data) {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  
  async update(id, data) {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  
  async delete(id) {
    await api.delete(`/inventory/${id}`);
  },

  
  async getLowStock() {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },
};
