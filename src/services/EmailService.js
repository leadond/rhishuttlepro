import { toast } from "sonner";

// Mock Email service - in a real implementation, this would integrate with
// SendGrid, AWS SES, or another email service
class EmailService {
  constructor() {
    this.isEnabled = true; // Would be controlled by feature flag
    this.logs = [];
  }

  async sendEmail(to, subject, body, options = {}) {
    if (!this.isEnabled) {
      console.warn('Email service is disabled');
      return { success: false, error: 'Email service is disabled' };
    }

    if (!to || !subject || !body) {
      console.error('Recipient, subject, and body are required');
      return { success: false, error: 'Recipient, subject, and body are required' };
    }

    try {
      // In a real implementation, this would make an API call to your email service
      console.log(`Sending email to ${to}: ${subject}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/failure
      const isSuccess = Math.random() > 0.1; // 90% success rate for simulation
      
      if (isSuccess) {
        this.logs.push({
          timestamp: new Date().toISOString(),
          to,
          subject,
          status: 'sent'
        });
        
        return { success: true, message: 'Email sent successfully' };
      } else {
        throw new Error('Failed to send email: Server error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      this.logs.push({
        timestamp: new Date().toISOString(),
        to,
        subject,
        status: 'failed',
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  }

  // Send daily recap email
  async sendDailyRecap(email, data) {
    const subject = `Daily Shuttle Service Recap - ${new Date().toLocaleDateString()}`;
    const body = this.generateDailyRecapBody(data);
    
    return this.sendEmail(email, subject, body, { isHtml: true });
  }

  // Generate HTML body for daily recap
  generateDailyRecapBody(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .stats { margin: 20px 0; }
          .stat { margin-bottom: 10px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Shuttle Service Recap</h1>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stats">
            <h2>Summary</h2>
            <div class="stat"><strong>Total Rides:</strong> ${data.totalRides || 0}</div>
            <div class="stat"><strong>Completed Rides:</strong> ${data.completedRides || 0}</div>
            <div class="stat"><strong>Active Alerts:</strong> ${data.activeAlerts || 0}</div>
            <div class="stat"><strong>Average Rating:</strong> ${data.averageRating || 'N/A'}</div>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get email logs (for admin purposes)
  getLogs() {
    return [...this.logs];
  }

  // Clear logs (for admin purposes)
  clearLogs() {
    this.logs = [];
  }
}

// Export a singleton instance
export const emailService = new EmailService();

// Hook for React components
export const useEmailService = () => {
  return emailService;
};