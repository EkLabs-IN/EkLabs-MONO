const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: 'An error occurred' 
        }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(email: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resendOTP(email: string) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async logout() {
    return this.request('/auth/signout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // User endpoints
  async selectDataSource() {
    return this.request('/users/data-source', {
      method: 'PUT',
    });
  }

  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async listUsers(skip = 0, limit = 100) {
    return this.request(`/users?skip=${skip}&limit=${limit}`);
  }

  // Query endpoints
  async executeQuery(query: string, context?: any) {
    return this.request('/query/', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  }

  async getQueryHistory(limit = 50) {
    return this.request(`/query/history?limit=${limit}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
