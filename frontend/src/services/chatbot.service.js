import api from './api';



export const chatbotService = {
  
  async sendQuery(query) {
    const response = await api.post('/chatbot/query', { query });
    return response.data;
  },
};
