import api from './api';




function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

export const authService = {
  /**
   * Login user
   * @param {LoginDto} credentials
   * @returns {Promise<AuthResponse>}
   */
  async login(credentials) {
    const response = await api.post('/auth/sign-in', credentials);
    const data = response.data;
    
    
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      
      
      const decoded = decodeJwt(data.accessToken);
      
      if (decoded) {
        
        try {
          const userResponse = await api.get('/auth/check-token');
          const userData = userResponse.data;
          
          const user = {
            _id: userData._id,
            username: userData.username,
            name: userData.name,
            role: userData.role,
          };
          
          localStorage.setItem('user', JSON.stringify(user));
          console.log('✅ User logged in:', user);
          return { ...data, user };
        } catch (e) {
          
          const user = {
            _id: decoded.id,
            username: decoded.username,
            name: decoded.username,
            role: decoded.role || 'staff',
          };
          
          localStorage.setItem('user', JSON.stringify(user));
          console.log('✅ User logged in (from JWT):', user);
          return { ...data, user };
        }
      }
    }
    
    return data;
  },

  
  async signUp(data) {
    const response = await api.post('/auth/sign-up', data);
    return response.data;
  },

  
  async checkToken() {
    try {
      await api.get('/auth/check-token');
      return true;
    } catch {
      return false;
    }
  },

  
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
