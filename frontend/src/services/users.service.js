import api from './api';

export const usersService = {
  
  async getAll() {
    const response = await api.get('/users');
    
    
    return response.data.results ?? response.data;
  },

  
  async getOne(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  
  async create(data) {
    const response = await api.post('/users', data);
    return response.data;
  },

  
  async update(id, data) {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  
  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  
  async updateProfile(data) {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  
  async changePassword(data) {
    const response = await api.patch('/users/profile/password', data);
    return response.data;
  },
};
