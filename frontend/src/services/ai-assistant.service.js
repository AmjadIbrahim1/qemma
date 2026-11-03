// frontend/src/services/ai-assistant.service.js

import API from './api';

export const aiAssistantService = {
  sendMessage: async (message, history = []) => {
    const response = await API.post('/ai/chatbot/message', { message, history });
    return response;
  },
  checkUsage: async () => {
    const response = await API.get('/ai/chatbot/usage');
    return response;
  },
};

export default aiAssistantService;
