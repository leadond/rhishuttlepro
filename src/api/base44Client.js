export const base44 = new Proxy({}, {
  get: (target, prop) => {
    console.error(`Attempted to access legacy base44.${String(prop)}. This client has been removed.`);
    throw new Error(`Legacy Base44 client is removed. Use appEntities or proxyClient instead.`);
  }
});
