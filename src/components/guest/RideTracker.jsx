
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ride } from '@/api/appEntities';
import { Vehicle } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Clock, Navigation } from 'lucide-react';
import TomTomMap from '../maps/TomTomMap';
import TimeSince from '../common/TimeSince';
import { getLocationName } from '../common/LocationData';

export default function RideTracker({ ride, onRideComplete }) {
  const [currentRide, setCurrentRide] = useState(ride);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const intervalRef = useRef(null);
  const lastLoadTime = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadRideStatus = useCallback(async () => {
    if (!ride) return;

    const now = Date.now();
    if (now - lastLoadTime.current < 15000 && lastLoadTime.current !== 0) {
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    lastLoadTime.current = now;

    try {
      const updatedRide = await Ride.filter({ id: ride.id });
      if (updatedRide && updatedRide.length > 0) {
        const rideData = updatedRide[0];
        setCurrentRide(rideData);

        // If ride was just completed, trigger the callback
        if (rideData.status === 'completed' && ride.status !== 'completed') {
          if (onRideComplete) {
            onRideComplete();
          }
        }

        // Load driver vehicle location if assigned
        if (rideData.vehicle_number) {
          const vehicles = await Vehicle.filter({ shuttle_number: rideData.vehicle_number });
          if (vehicles.length > 0) {
            setDriverVehicle(vehicles[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading ride status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [ride, isLoading, onRideComplete]);

  useEffect(() => {
    if (currentRide.status !== 'completed') {
      loadRideStatus();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(loadRideStatus, 15000); // Check every 15 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadRideStatus, currentRide.status]);

  const getStatusMessage = (status) => {
    const statusStr = status ?? 'pending';
    switch (statusStr) {
      case 'pending':
        return { message: 'Finding you a driver...', color: 'text-yellow-700', icon: Clock };
      case 'assigned':
        return { message: 'Your driver is on the way!', color: 'text-blue-700', icon: Navigation };
      case 'in-progress':
        return { message: 'Your ride is in progress', color: 'text-indigo-700', icon: Navigation };
      case 'completed':
        return { message: 'Ride completed - Please rate your experience', color: 'text-green-700', icon: Clock };
      default:
        return { message: 'Processing your request...', color: 'text-gray-700', icon: Clock };
    }
  };

  const statusInfo = getStatusMessage(currentRide.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="shadow-2xl border-slate-200/80 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            Live Tracking
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm">
            {currentRide.ride_code || 'TRACKING'}
          </Badge>
        </div>
        <p className={`${statusInfo.color} font-medium mt-2`}>
          {statusInfo.message}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Driver Info - Only show when assigned */}
        {(currentRide.status === 'assigned' || currentRide.status === 'in-progress') && currentRide.assigned_driver && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-2">Your Driver:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900 text-lg">{currentRide.assigned_driver}</p>
                <p className="text-blue-700">Vehicle: {currentRide.vehicle_number}</p>
              </div>
              {currentRide.guest_phone && driverVehicle && (
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a href={`tel:${currentRide.guest_phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Map - Show driver location when assigned */}
        {driverVehicle && driverVehicle.location_lat && driverVehicle.location_lng && (
          <TomTomMap
            vehicles={[driverVehicle]}
            rides={[currentRide]}
            center={[driverVehicle.location_lng, driverVehicle.location_lat]}
            zoom={14}
            height="350px"
            title="Driver Location"
          />
        )}

        {/* Route Info */}
        <div className="grid gap-4">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Pickup Location</p>
              <p className="font-semibold text-emerald-900">{getLocationName(currentRide.pickup_location)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium text-blue-800">Destination</p>
              <p className="font-semibold text-blue-900">{getLocationName(currentRide.destination)}</p>
            </div>
          </div>
        </div>

        {/* Timing Info */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-600">Status Updated</p>
            <TimeSince date={currentRide.updated_date} />
          </div>
          {currentRide.eta && (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">ETA</p>
              <p className="font-semibold text-slate-900">{currentRide.eta}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
