import { smsService } from './SmsService';
import { emailService } from './EmailService';
import { useBranding } from '../contexts/BrandingContext';

class NotificationService {
  constructor() {
    this.isEnabled = true;
    this.logs = [];
  }

  // Send notification via multiple channels
  async sendNotification(recipient, message, options = {}) {
    const results = {
      sms: { success: false, error: null },
      email: { success: false, error: null }
    };

    // Send SMS if phone number is provided
    if (recipient.phone) {
      try {
        const smsResult = await smsService.sendSms(recipient.phone, message);
        results.sms = smsResult;
      } catch (error) {
        results.sms.error = error.message;
        console.error('SMS notification failed:', error);
      }
    }

    // Send email if email address is provided
    if (recipient.email) {
      try {
        const subject = options.subject || 'Shuttle Service Notification';
        const emailResult = await emailService.sendEmail(
          recipient.email, 
          subject, 
          message,
          { isHtml: options.isHtml }
        );
        results.email = emailResult;
      } catch (error) {
        results.email.error = error.message;
        console.error('Email notification failed:', error);
      }
    }

    // Log the notification attempt
    this.logs.push({
      timestamp: new Date().toISOString(),
      recipient,
      message,
      results,
      context: options.context || {}
    });

    return results;
  }

  // Send ride status update
  async sendRideUpdate(ride, status) {
    if (!ride.guest_phone && !ride.guest_email) {
      console.warn('No contact information available for ride update');
      return { success: false, error: 'No contact information available' };
    }

    const { appName } = useBranding();
    const recipient = {
      phone: ride.guest_phone,
      email: ride.guest_email
    };

    let message, subject;
    switch (status) {
      case 'created':
        subject = `Your ${appName} Ride Request #${ride.ride_code}`;
        message = `Your ride request #${ride.ride_code} has been received. We're finding you a driver.`;
        break;
      case 'assigned':
        subject = `Your ${appName} Driver is on the Way!`;
        message = `Your driver is on the way! Ride #${ride.ride_code} has been assigned. Driver: ${ride.assigned_driver || 'N/A'}`;
        break;
      case 'in-progress':
        subject = `Your ${appName} Ride is in Progress`;
        message = `Your ride #${ride.ride_code} is in progress. Driver: ${ride.assigned_driver || 'N/A'}`;
        break;
      case 'completed':
        subject = `Thank You for Riding with ${appName}`;
        message = `Thank you for riding with us! Ride #${ride.ride_code} has been completed.`;
        break;
      case 'cancelled':
        subject = `Your ${appName} Ride Has Been Cancelled`;
        message = `Your ride #${ride.ride_code} has been cancelled. Please contact support if this was unexpected.`;
        break;
      default:
        return { success: false, error: 'Invalid status' };
    }

    return this.sendNotification(recipient, message, { 
      subject,
      context: { rideId: ride.id, status }
    });
  }

  // Send daily recap
  async sendDailyRecap(email, data) {
    const subject = `${this.branding.appName} Daily Recap - ${new Date().toLocaleDateString()}`;
    
    return emailService.sendDailyRecap(email, {
      ...data,
      appName: this.branding.appName
    });
  }

  // Get notification logs
  getLogs() {
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    smsService.clearLogs();
    emailService.clearLogs();
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();

// Hook for React components
export const useNotificationService = () => {
  return notificationService;
};