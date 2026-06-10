
const API_URL = 'https://portela.app/api/hub';

class ApiClient {
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 segundos

  private get token(): string | null {
    return localStorage.getItem('portela_hub_token');
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${API_URL}${path}`;
    
    // Check cache for GET requests
    if (options.method === 'GET') {
      const cached = this.cache.get(path);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`[ApiClient] Cache hit: ${path}`);
        return cached.data;
      }
    }

    // Clear cache on mutations
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      console.log(`[ApiClient] Mutation detected: ${options.method} ${path}. Clearing cache.`);
      this.cache.clear();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    } as any;

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        localStorage.removeItem('portela_hub_token');
        if (!window.location.pathname.toLowerCase().includes('/login')) {
          window.location.href = '/integracao/login';
        }
        throw new Error('Não autorizado');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro na requisição: ${response.status}`);
      }

      const data = await response.json();

      // Store in cache if it's a GET
      if (options.method === 'GET') {
        this.cache.set(path, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('A requisição excedeu o tempo limite (10s).');
      }
      throw error;
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request(path, { method: 'GET' });
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: any): Promise<T> {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request(path, { method: 'DELETE' });
  }

  setToken(token: string) {
    localStorage.setItem('portela_hub_token', token);
    this.cache.clear(); // Clear cache on new login
  }

  clearToken() {
    localStorage.removeItem('portela_hub_token');
    this.cache.clear();
  }
}

export const apiClient = new ApiClient();
