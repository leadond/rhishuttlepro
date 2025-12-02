/**
 * Utility to trigger webhooks for events
 * Import and use this throughout the app when events occur
 */

import { triggerWebhooks } from "@/api/functions";

const WEBHOOK_INTERNAL_KEY = typeof window !== 'undefined' 
  ? null // Don't expose in browser
  : process.env.WEBHOOK_INTERNAL_KEY;

export const WebhookEvents = {
  RIDE_CREATED: 'ride.created',
  RIDE_ASSIGNED: 'ride.assigned',
  RIDE_IN_PROGRESS: 'ride.in_progress',
  RIDE_COMPLETED: 'ride.completed',
  RIDE_CANCELLED: 'ride.cancelled',
  VEHICLE_STATUS_CHANGED: 'vehicle.status_changed',
  VEHICLE_LOCATION_UPDATED: 'vehicle.location_updated',
  ALERT_CREATED: 'alert.created',
  ALERT_RESOLVED: 'alert.resolved',
  DRIVER_SIGNED_IN: 'driver.signed_in',
  DRIVER_SIGNED_OUT: 'driver.signed_out',
  RATING_SUBMITTED: 'rating.submitted'
};

/**
 * Trigger webhooks for an event
 * This is a fire-and-forget operation - doesn't block the main flow
 */
export async function triggerWebhook(event, data) {
  // Only trigger in production/backend context
  if (typeof window !== 'undefined') {
    console.log('🔔 Webhook trigger (browser - skipped):', event);
    return;
  }

  try {
    console.log('🔔 Triggering webhook:', event, data);
    
    // Call the webhook trigger function
    // This is async but we don't await it to avoid blocking
    triggerWebhooks({
      action: 'trigger',
      event,
      data,
      internal_key: WEBHOOK_INTERNAL_KEY
    }).catch(error => {
      console.error('Webhook trigger failed:', error);
      // Don't throw - webhooks failing shouldn't break the main flow
    });
  } catch (error) {
    console.error('Webhook trigger error:', error);
    // Swallow errors - webhooks are non-critical
  }
}

export default {
  trigger: triggerWebhook,
  events: WebhookEvents
};