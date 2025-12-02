import React, { useState, useEffect } from "react";
import { Ride } from '@/api/appEntities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getLocationName } from "../common/LocationData";

export default function DriverRideHistory({ driverName }) {
  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const completedRides = await Ride.filter({
          assigned_driver: driverName,
          status: 'completed'
        }, '-completed_timestamp', 50);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = completedRides.filter(r => 
          r.completed_timestamp && new Date(r.completed_timestamp) >= today
        ).length;

        setRides(completedRides);
        setStats({
          total: completedRides.length,
          avgRating: 4.7, // Simulated
          completedToday: todayCount
        });
      } catch (error) {
        console.error('Error loading ride history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (driverName) {
      loadHistory();
    }
  }, [driverName]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading ride history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-sm text-blue-700">Total Rides</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-900">{stats.completedToday}</p>
            <p className="text-sm text-green-700">Today</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              <p className="text-3xl font-bold text-yellow-900">{stats.avgRating}</p>
            </div>
            <p className="text-sm text-yellow-700">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Ride List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rides.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium">No completed rides yet</p>
            <p className="text-sm">Start accepting rides to build your history!</p>
          </div>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{ride.guest_name}</p>
                    <p className="text-sm text-gray-600">Room {ride.guest_room}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 mb-1">
                      Completed
                    </Badge>
                    {ride.completed_timestamp && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(ride.completed_timestamp), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <MapPin className="w-4 h-4" />
                    <span>{getLocationName(ride.pickup_location)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <MapPin className="w-4 h-4" />
                    <span>{getLocationName(ride.destination)}</span>
                  </div>
                </div>

                {ride.special_requests && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {ride.special_requests}
                  </div>
                )}

                {ride.completed_timestamp && ride.in_progress_timestamp && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration: {Math.round((new Date(ride.completed_timestamp) - new Date(ride.in_progress_timestamp)) / 60000)} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}