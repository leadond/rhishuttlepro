/**
 * Proxy Client
 * Handles communication with the Vercel Serverless Proxy.
 * This replaces direct calls to the legacy SDK in the frontend.
 */

// Get the current auth token (Placeholder function)
// You will replace this with your actual Auth Provider's getToken method
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const proxyClient = {
  /**
   * Generic method to call the proxy
   * @param {string} entity - The entity name (e.g., 'Ride', 'Vehicle')
   * @param {string} method - The method name (e.g., 'list', 'create')
   * @param {object} params - The parameters for the method
   */
  call: async (entity, method, params = {}) => {
    if (entity.includes('Shuttle')) {
      console.error(`[DEBUG] DETECTED SHUTTLE PREFIX: ${entity}.${method}`);
      console.trace('Stack trace for Shuttle prefix detection:');
    }
    try {
      const token = getAuthToken();
      
      const url = `/api/proxy?t=${Date.now()}`; // Cache busting
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          entity,
          method,
          params
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Proxy error: ${response.statusText}`);
      }

      if (result.success === false) {
        throw new Error(result.error || 'Unknown error from proxy');
      }

      return result.data;
    } catch (error) {
      console.error(`Proxy Call Failed [${entity}.${method}]:`, error);
      throw error;
    }
  },

  /**
   * Direct POST method for custom endpoints
   * @param {string} method - The method name (e.g., 'fixPermissions')
   * @param {object} params - The parameters
   */
  post: async (method, params = {}) => {
    try {
      const token = getAuthToken();
      const url = `/api/proxy?t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          entity: 'System', // Dummy entity
          method,
          params
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Request failed');
      return result;
    } catch (error) {
      console.error(`Proxy POST Failed [${method}]:`, error);
      throw error;
    }
  }
};

/**
 * Helper to create a proxy object for an entity
 * @param {string} entityName 
 */
export const createEntityProxy = (entityName) => {
  return new Proxy({}, {
    get: (target, prop) => {
      return async (params) => {
        return proxyClient.call(entityName, prop, params);
      };
    }
  });
};
