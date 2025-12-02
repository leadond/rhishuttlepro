import { Ride, Vehicle, EmergencyAlert } from '@/api/appEntities';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

class AnalyticsService {
  constructor() {
    this.cache = {
      dailyStats: null,
      lastUpdated: null
    };
  }

  // Get daily statistics
  async getDailyStats(date = new Date()) {
    try {
      const start = startOfDay(date);
      const end = endOfDay(date);

      // Get all rides for the day
      const rides = await Ride.filter({
        created_date: {
          $gte: start.toISOString(),
          $lte: end.toISOString()
        }
      }, '-created_date', 1000);

      // Get all alerts for the day
      const alerts = await EmergencyAlert.filter({
        created_date: {
          $gte: start.toISOString(),
          $lte: end.toISOString()
        }
      }, '-created_date', 1000);

      // Calculate statistics
      const stats = {
        date: format(date, 'yyyy-MM-dd'),
        totalRides: rides.length,
        completedRides: rides.filter(r => r.status === 'completed').length,
        cancelledRides: rides.filter(r => r.status === 'cancelled').length,
        averagePassengers: this.calculateAveragePassengers(rides),
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => a.status === 'active').length,
        resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
        rideStatusBreakdown: this.getRideStatusBreakdown(rides),
        alertTypeBreakdown: this.getAlertTypeBreakdown(alerts),
        peakHours: this.calculatePeakHours(rides)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw error;
    }
  }

  // Get historical data for a date range
  async getHistoricalData(days = 30) {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      const rides = await Ride.filter({
        created_date: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      }, 'created_date', 5000);

      const alerts = await EmergencyAlert.filter({
        created_date: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      }, 'created_date', 1000);

      // Group by date
      const dataByDate = {};
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        dataByDate[dateStr] = {
          date: dateStr,
          totalRides: 0,
          completedRides: 0,
          cancelledRides: 0,
          totalAlerts: 0
        };
      }

      // Process rides
      rides.forEach(ride => {
        const dateStr = format(new Date(ride.created_date), 'yyyy-MM-dd');
        if (dataByDate[dateStr]) {
          dataByDate[dateStr].totalRides++;
          if (ride.status === 'completed') dataByDate[dateStr].completedRides++;
          if (ride.status === 'cancelled') dataByDate[dateStr].cancelledRides++;
        }
      });

      // Process alerts
      alerts.forEach(alert => {
        const dateStr = format(new Date(alert.created_date), 'yyyy-MM-dd');
        if (dataByDate[dateStr]) {
          dataByDate[dateStr].totalAlerts++;
        }
      });

      return Object.values(dataByDate);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Calculate average passengers per ride
  calculateAveragePassengers(rides) {
    const validRides = rides.filter(r => r.passenger_count > 0);
    if (validRides.length === 0) return 0;
    
    const total = validRides.reduce((sum, ride) => sum + (ride.passenger_count || 1), 0);
    return (total / validRides.length).toFixed(1);
  }

  // Get ride status breakdown
  getRideStatusBreakdown(rides) {
    const breakdown = {
      pending: 0,
      assigned: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0
    };

    rides.forEach(ride => {
      if (ride.status in breakdown) {
        breakdown[ride.status]++;
      }
    });

    return breakdown;
  }

  // Get alert type breakdown
  getAlertTypeBreakdown(alerts) {
    const breakdown = {};
    
    alerts.forEach(alert => {
      const type = alert.alert_type || 'unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    return breakdown;
  }

  // Calculate peak hours
  calculatePeakHours(rides) {
    const hours = Array(24).fill(0);
    
    rides.forEach(ride => {
      if (ride.created_date) {
        const hour = new Date(ride.created_date).getHours();
        hours[hour]++;
      }
    });

    return hours;
  }

  // Get vehicle utilization
  async getVehicleUtilization() {
    try {
      const vehicles = await Vehicle.list();
      const rides = await Ride.list('-created_date', 1000); // Last 1000 rides

      return vehicles.map(vehicle => {
        const vehicleRides = rides.filter(r => r.vehicle_number === vehicle.shuttle_number);
        return {
          id: vehicle.id,
          shuttleNumber: vehicle.shuttle_number,
          totalRides: vehicleRides.length,
          lastActive: vehicleRides[0]?.created_date || 'Never'
        };
      });
    } catch (error) {
      console.error('Error calculating vehicle utilization:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();

// Hook for React components
export const useAnalyticsService = () => {
  return analyticsService;
};