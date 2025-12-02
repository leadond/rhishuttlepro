import React, { useState, useEffect, useCallback } from "react";
import { Ride } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, Star, CheckCircle, Car } from "lucide-react";

export default function DriverStats({ driverId, driverName, currentRide }) {
  const [stats, setStats] = useState({
    todayRides: 0,
    totalRides: 0,
    averageRating: 0,
    hoursOnline: 0
  });

  const loadDriverStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use driverName for filtering since that's what's stored in assigned_driver
      const allRides = await Ride.filter({ 
        assigned_driver: driverName,
        status: { $in: ['assigned', 'in-progress', 'completed'] }
      });
      
      const todayRides = allRides.filter(ride => 
        new Date(ride.created_date) >= today
      );

      const completedRides = allRides.filter(r => r.status === 'completed');

      let hoursOnline = 0;
      const storedShiftStart = localStorage.getItem('shift_start_time');
      if (storedShiftStart) {
        const startTime = new Date(storedShiftStart);
        const now = new Date();
        hoursOnline = Math.floor((now - startTime) / (1000 * 60 * 60));
      }

      const simulatedAverageRating = completedRides.length > 0 ? 4.8 : 0;

      setStats({
        todayRides: todayRides.filter(r => r.status === 'completed').length,
        totalRides: completedRides.length,
        averageRating: simulatedAverageRating,
        hoursOnline: hoursOnline
      });
    } catch (error) {
      console.error('Error loading driver stats:', error);
      setStats({
        todayRides: 0,
        totalRides: 0,
        averageRating: 0,
        hoursOnline: 0
      });
    }
  }, [driverName]);

  useEffect(() => {
    if (driverName) {
      loadDriverStats();
      const interval = setInterval(loadDriverStats, 60000);
      return () => clearInterval(interval);
    }
  }, [driverName, loadDriverStats]);

  const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className={`w-12 h-12 ${color} rounded-md flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-sm text-gray-600 truncate">{label}</p>
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <StatItem
            icon={CheckCircle}
            label="Rides Completed Today"
            value={stats.todayRides}
            color="bg-emerald-500"
          />
          
          <StatItem
            icon={Star}
            label="Average Rating"
            value={stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A'}
            color="bg-yellow-500"
          />
          
          <StatItem
            icon={Clock}
            label="Hours Online Today"
            value={`${stats.hoursOnline}h`}
            color="bg-blue-500"
          />
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Status & Career</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <span className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                <Car className="w-4 h-4 text-gray-500" />
                Current Status
              </span>
              <span className={`font-bold py-1 px-3 rounded-full text-xs ${currentRide ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                {currentRide ? 'On Ride' : 'Available'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-gray-700 font-medium text-sm">Total Career Rides</span>
              <span className="font-bold text-gray-900">{stats.totalRides}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}