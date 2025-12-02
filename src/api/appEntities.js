import { proxyClient } from './proxyClient';
import { UserAuthStatic } from '@/components/contexts/AuthContext';

// Helper to create explicit entity object
const createEntity = (name) => {
  console.log(`[Entities] Creating proxy for: ${name}`);
  return {
    list: (arg1, arg2) => {
      let params = {};
      if (typeof arg1 === 'string') {
          // Legacy style: list(sort, limit)
          params.orderBy = arg1;
          if (typeof arg2 === 'number') params.limit = arg2;
      } else {
          // New style: list({ orderBy: '...', limit: 10 })
          params = arg1 || {};
      }
      return proxyClient.call(name, 'list', params);
    },
    get: (id) => proxyClient.call(name, 'get', { id }),
    create: (params) => proxyClient.call(name, 'create', params),
    update: (id, params) => proxyClient.call(name, 'update', { id, ...params }),
    delete: (id) => proxyClient.call(name, 'delete', { id }),
    filter: (arg1, arg2, arg3) => {
      let params = {};
      if (arg2 || arg3) {
          // Legacy style: filter(filterObj, sort, limit)
          params = { ...arg1 };
          if (typeof arg2 === 'string') params.orderBy = arg2;
          if (typeof arg3 === 'number') params.limit = arg3;
      } else {
          // New style: filter({ ...filterObj, orderBy: '...', limit: 10 })
          params = arg1 || {};
      }
      return proxyClient.call(name, 'filter', params);
    },
  };
};

// Replace direct SDK binding with Explicit Proxies
export const Ride = createEntity('Ride');

export const Vehicle = createEntity('Vehicle'); // Keep original for other files, but we will use VehicleTest in one file
export const MaintenanceLog = createEntity('MaintenanceLog');
export const Rating = createEntity('Rating');
export const EmergencyAlert = createEntity('EmergencyAlert');
export const AuditLog = createEntity('AuditLog');
export const SimulationState = createEntity('SimulationState');
export const Driver = createEntity('Driver');
export const Webhook = createEntity('Webhook');
export const FeatureFlag = createEntity('FeatureFlag');
export const Branding = createEntity('Branding');

// For Auth, we use the Firebase Auth Context static helper
export const User = UserAuthStatic;

// For Admin management of users (database entity)
export const UserEntity = createEntity('User');
