import api from './api';


export const categoriesService = {
  
  async getAll(isActive) {
    const params = isActive !== undefined ? `?isActive=${isActive}` : '';
    const response = await api.get(`/categories${params}`);
    return response.data;
  },

  /**
   * Get a single category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Category object
   */
  async getOne(id) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Create a new category
   * @param {Object} data - Category data
   * @param {string} data.name - Category name
   * @param {string} [data.description] - Category description
   * @param {string} [data.icon] - Category icon (emoji)
   * @param {boolean} [data.isActive] - Active status (default: true)
   * @returns {Promise<Object>} Created category
   */
  async create(data) {
    const response = await api.post('/categories', data);
    return response.data;
  },

  
  async update(id, data) {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  
  async delete(id) {
    await api.delete(`/categories/${id}`);
  },
};
