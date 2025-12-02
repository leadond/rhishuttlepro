import { proxyClient } from './proxyClient';

// Helper to create a proxy function
const createFunctionProxy = (functionName) => {
  return async (params) => {
    return proxyClient.call(functionName, functionName, params); // For functions, we might map entity=functionName or use a special entity 'functions'
  };
};

// In our proxy.js, we handle `default` case as `url = ${BASE_URL}/functions/${method}`.
// So we should pass entity='functions' (or any dummy) and method=functionName.
// Let's look at proxy.js again.
// default: url = `${BASE_URL}/functions/${method}`;
// So we can pass entity='functions' (it's ignored in default case) and method=functionName.

const createProxy = (name) => async (params) => {
  return proxyClient.call('functions', name, params);
};

export const sendRideSMS = createProxy('sendRideSMS');
export const voiceHandler = createProxy('voiceHandler');
export const twilioWebhook = createProxy('twilioWebhook');
export const createUser = createProxy('createUser');
export const updateUserPassword = createProxy('updateUserPassword');
export const runSimulation = createProxy('runSimulation');
export const externalRideRequest = createProxy('externalRideRequest');
export const getRideStatus = createProxy('getRideStatus');
export const submitRating = createProxy('submitRating');
export const registerWebhook = createProxy('registerWebhook');
export const triggerWebhooks = createProxy('triggerWebhooks');
export const webhookDispatcher = createProxy('triggerWebhooks'); // Alias for client compatibility
