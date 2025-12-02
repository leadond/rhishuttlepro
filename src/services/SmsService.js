import { toast } from "sonner";

// Mock SMS service - in a real implementation, this would integrate with
// Twilio, AWS SNS, or another SMS gateway
class SmsService {
  constructor() {
    this.isEnabled = true; // Would be controlled by feature flag
    this.logs = [];
  }

  async sendSms(phoneNumber, message) {
    if (!this.isEnabled) {
      console.warn('SMS service is disabled');
      return { success: false, error: 'SMS service is disabled' };
    }

    if (!phoneNumber || !message) {
      console.error('Phone number and message are required');
      return { success: false, error: 'Phone number and message are required' };
    }

    try {
      // In a real implementation, this would make an API call to your SMS gateway
      console.log(`Sending SMS to ${phoneNumber}: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/failure
      const isSuccess = Math.random() > 0.1; // 90% success rate for simulation
      
      if (isSuccess) {
        this.logs.push({
          timestamp: new Date().toISOString(),
          phoneNumber,
          message,
          status: 'sent'
        });
        
        return { success: true, message: 'SMS sent successfully' };
      } else {
        throw new Error('Failed to send SMS: Network error');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      this.logs.push({
        timestamp: new Date().toISOString(),
        phoneNumber,
        message,
        status: 'failed',
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  }

  // Send ride status update
  async sendRideUpdate(ride, status) {
    if (!ride.guest_phone) {
      console.warn('No phone number provided for ride update');
      return { success: false, error: 'No phone number provided' };
    }

    let message;
    switch (status) {
      case 'created':
        message = `Your ride request #${ride.ride_code} has been received. We're finding you a driver.`;
        break;
      case 'assigned':
        message = `Your driver is on the way! Ride #${ride.ride_code} has been assigned.`;
        break;
      case 'in-progress':
        message = `Your ride #${ride.ride_code} is in progress. Driver: ${ride.assigned_driver || 'N/A'}`;
        break;
      case 'completed':
        message = `Thank you for riding with us! Ride #${ride.ride_code} has been completed.`;
        break;
      case 'cancelled':
        message = `Your ride #${ride.ride_code} has been cancelled. Please contact support if this was unexpected.`;
        break;
      default:
        return { success: false, error: 'Invalid status' };
    }

    return this.sendSms(ride.guest_phone, message);
  }

  // Send emergency alert
  async sendEmergencyAlert(phoneNumbers, alert) {
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return { success: false, error: 'No phone numbers provided' };
    }

    const message = `🚨 EMERGENCY ALERT: ${alert.message || 'Emergency situation reported'}. Please check the dispatch console for details.`;
    
    const results = await Promise.all(
      phoneNumbers.map(phone => this.sendSms(phone, message))
    );

    return {
      success: results.every(r => r.success),
      results
    };
  }

  // Get SMS logs (for admin purposes)
  getLogs() {
    return [...this.logs];
  }

  // Clear logs (for admin purposes)
  clearLogs() {
    this.logs = [];
  }
}

// Export a singleton instance
export const smsService = new SmsService();

// Hook for React components
export const useSmsService = () => {
  return smsService;
};

// Example usage in a component:
// const smsService = useSmsService();
// smsService.sendRideUpdate(ride, 'assigned');