
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Ride, Vehicle, EmergencyAlert, Driver, MaintenanceLog } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, AlertTriangle, Phone, User, MapPin, Users, AlertCircle, Clock, CheckCircle2, Loader2, Navigation, XCircle, History } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import DriverLogin from "../components/driver/DriverLogin";
import VehicleInspection from "../components/driver/VehicleInspection";
import DriverStats from "../components/driver/DriverStats";
import LocationTracker from "../components/driver/LocationTracker";
import TomTomMap from "../components/maps/TomTomMap";
import DriverAlerts from "../components/driver/DriverAlerts";
import DriverRideHistory from "../components/driver/DriverRideHistory";
import { getLocationName } from "../components/common/LocationData";
import { webhookDispatcher } from "@/api/functions";
import { useAuth } from "@/components/contexts/AuthContext";

const TimeSince = ({ date }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      if (!date) return '';
      const now = new Date();
      const past = new Date(date);
      const seconds = Math.floor((now - past) / 1000);

      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    setTime(calculateTime());
    const interval = setInterval(() => setTime(calculateTime()), 30000);
    return () => clearInterval(interval);
  }, [date]);

  return <span>{time}</span>;
};



export default function DriverDashboard() {
  const { user: currentUser } = useAuth();
  const { vehicles: realTimeVehicles, isConnected: isWebSocketConnected, sendLocationUpdate } = useWebSocket();
  const [currentStep, setCurrentStep] = useState('login');
  const [driverInfo, setDriverInfo] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rideToReject, setRideToReject] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);


  // ... (keep loadRideRequests)

  // Load active rides on login/refresh
  const loadActiveRides = async () => {
      if (!driverInfo) return;
      try {
          const rides = await Ride.filter({
              assigned_driver: driverInfo.name,
              status: { '$in': ['assigned', 'in-progress'] }
          }, '-updated_date', 10);
          setActiveRides(rides);
      } catch (error) {
          console.error('Error loading active rides:', error);
      }
  };

  // Handle WebSocket messages for real-time ride requests
  // TODO: Implement WebSocket event handlers when backend WebSocket server is ready
  useEffect(() => {
    if (!isWebSocketConnected) return;
    // WebSocket event handlers will be implemented here
  }, [isWebSocketConnected, driverInfo]);

  // Load active rides and set up polling
  useEffect(() => {
    if (isOnline) {
      loadActiveRides();
      const interval = setInterval(loadActiveRides, 10000); // Refresh active rides too
      return () => clearInterval(interval);
    }
  }, [isOnline, driverInfo]);



  const handleDriverLogin = (driverData) => {
    setDriverInfo(driverData);
    setCurrentStep('inspection');
  };

  const handleInspectionComplete = () => {
    setCurrentStep('dashboard');
    setIsOnline(true);
    toast.success('Vehicle inspection complete. You are now online!');
  };


  const handleAcceptRide = async (rideId) => {
    setIsAccepting(true);
    try {
      const rideToAccept = rideRequests.find(req => req.id === rideId);
      if (!rideToAccept) {
        toast.error('Ride request not found or already taken.');
        return;
      }

      const now = new Date().toISOString();
      
      await Ride.update(rideId, {
        status: 'assigned',
        assigned_driver: driverInfo.name,
        vehicle_number: selectedVehicle.shuttle_number,
        assigned_timestamp: now,
        updated_date: now
      });
      
      // Update local state immediately
      const newRide = {
        ...rideToAccept,
        status: 'assigned',
        assigned_driver: driverInfo.name,
        vehicle_number: selectedVehicle.shuttle_number,
        assigned_timestamp: now
      };

      setActiveRides(prev => [newRide, ...prev]);
      setRideRequests(prev => prev.filter(r => r.id !== rideId));
      
      toast.success(`✅ Ride accepted for ${rideToAccept.guest_name}`, {
        description: "Navigate to pickup location",
        duration: 5000
      });
      
      setTimeout(() => loadRideRequests(), 1000);
    } catch (error) {
      console.error('❌ Error accepting ride:', error);
      toast.error('Error accepting ride: ' + error.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectRide = async () => {
    if (!rideToReject) return;

    try {
      // You can update the ride status to 'rejected' or just remove from local state
      // For now, just remove from local state
      setRideRequests(prev => prev.filter(r => r.id !== rideToReject.id));
      toast.info(`Ride request for ${rideToReject.guest_name} declined`);
      setRejectDialogOpen(false);
      setRideToReject(null);
    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast.error('Failed to decline ride');
    }
  };

  // ... (keep handleRideStatusChange)

  const handleRideStatusChange = async (rideId, newStatus) => {
    const ride = activeRides.find(r => r.id === rideId);
    if (!ride) return;

    try {
      const now = new Date().toISOString();
      const updateData = { 
        status: newStatus,
        updated_date: now
      };

      if (newStatus === 'in-progress') {
        updateData.in_progress_timestamp = now;
        toast.info(`✓ Ride status: Guest picked up - En route`);
        
        // 🔔 TRIGGER WEBHOOK: ride.in_progress
        try {
          await webhookDispatcher({
            event: 'ride.in_progress',
            data: {
              ride_id: ride.id,
              ride_code: ride.ride_code,
              guest_name: ride.guest_name,
              assigned_driver: ride.assigned_driver,
              vehicle_number: ride.vehicle_number,
              pickup_location: ride.pickup_location,
              destination: ride.destination,
              started_at: now
            }
          });
        } catch (webhookError) { console.warn(webhookError); }

      } else if (newStatus === 'completed') {
        updateData.completed_time = now;
        updateData.completed_timestamp = now;
        updateData.access_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        toast.success(`✅ Ride completed for ${ride.guest_name}`, {
          description: "Great job! Ready for next ride.",
          duration: 5000
        });
        
        // 🔔 TRIGGER WEBHOOK: ride.completed
        try {
          await webhookDispatcher({
            event: 'ride.completed',
            data: {
              ride_id: ride.id,
              ride_code: ride.ride_code,
              guest_name: ride.guest_name,
              assigned_driver: ride.assigned_driver,
              vehicle_number: ride.vehicle_number,
              pickup_location: ride.pickup_location,
              destination: ride.destination,
              completed_at: now
            }
          });
        } catch (webhookError) { console.warn(webhookError); }
      }
      
      await Ride.update(ride.id, updateData);
      
      // Only set vehicle to available if NO other active rides exist
      if (selectedVehicle && newStatus === 'completed') {
        const remainingRides = activeRides.filter(r => r.id !== rideId && r.status !== 'completed');
        if (remainingRides.length === 0) {
            await Vehicle.update(selectedVehicle.id, { 
            status: 'available',
            location_updated: now
            });
        }
      }
      
      if (newStatus === 'completed') {
        setActiveRides(prev => prev.filter(r => r.id !== rideId));
      } else {
        setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, ...updateData } : r));
      }
      
      setTimeout(() => loadRideRequests(), 1000);
    } catch (error) {
      console.error(`❌ Error updating ride to ${newStatus}:`, error);
      toast.error('Failed to update ride status: ' + error.message);
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast.info(isOnline ? 'You are now offline' : 'You are now online');
  };

  // ... (keep handleNavigate, handleEmergencyAlert, handleLocationUpdate, useEffect)

  const renderContent = () => {
    switch (currentStep) {
      case 'login':
        return <DriverLogin initialDriverName={currentUser?.full_name} onLogin={handleDriverLogin} onVehicleSelect={setSelectedVehicle} />;
      case 'inspection':
        return <VehicleInspection vehicle={selectedVehicle} driver={driverInfo} onComplete={handleInspectionComplete} onBack={() => setCurrentStep('login')} />;
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Driver Dashboard</CardTitle>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-slate-500 mt-2 text-sm">
                    <span className="font-medium flex items-center gap-2"><User className="w-4 h-4"/>{driverInfo?.name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-medium flex items-center gap-2"><Truck className="w-4 h-4"/>{selectedVehicle?.shuttle_number}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-green-600">Auto-refreshing every 8s</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <Badge variant="outline" className={`h-10 text-base ${isOnline ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
                    <span className="relative flex h-2 w-2 mr-2">
                      {isOnline && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </>
                      )}
                      {!isOnline && <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>}
                    </span>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  <Button onClick={() => setShowHistory(true)} variant="outline" className="h-10">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                  <Button onClick={handleEmergencyAlert} variant="destructive" className="font-semibold shadow-lg h-10">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency
                  </Button>
                  <Button onClick={toggleOnlineStatus} variant="outline" className="font-semibold text-slate-700 bg-white h-10">
                    {isOnline ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {alerts.length > 0 && <DriverAlerts alerts={alerts} />}

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-lg bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Available Ride Requests
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-base px-3 py-1">
                        {rideRequests.length} Pending
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                    {rideRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">No pending ride requests</p>
                        <p className="text-sm">New requests will appear here</p>
                      </div>
                    ) : (
                      rideRequests.map((ride) => (
                        <div key={ride.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">{ride.guest_name}</p>
                              <p className="text-sm text-gray-600">Room: {ride.guest_room || 'N/A'}</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <Clock className="w-3 h-3 mr-1" />
                              <TimeSince date={ride.created_date} />
                            </Badge>
                          </div>
                          <div className="space-y-2 mb-3 text-sm">
                            <div className="flex items-center gap-2 text-emerald-700">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">From:</span>
                              <span>{getLocationName(ride.pickup_location)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-700">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">To:</span>
                              <span>{getLocationName(ride.destination)}</span>
                            </div>
                            {ride.special_requests && (
                              <div className="flex items-start gap-2 text-gray-600 bg-white p-2 rounded border border-gray-200">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="text-xs">{ride.special_requests}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleAcceptRide(ride.id)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              disabled={isAccepting}
                            >
                              {isAccepting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button 
                              onClick={() => {
                                setRideToReject(ride);
                                setRejectDialogOpen(true);
                              }}
                              variant="outline"
                              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                              disabled={isAccepting}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <DriverStats driverId={driverInfo?.id} driverName={driverInfo?.name} currentRide={activeRides[0]} />
                
                <LocationTracker
                  vehicleId={selectedVehicle?.id}
                  isOnline={isOnline}
                  onLocationUpdate={handleLocationUpdate}
                />
              </div>

              <div className="lg:col-span-2 space-y-6">
                {/* Active Rides List */}
                {activeRides.length > 0 && (
                  <div className="grid gap-4">
                    {activeRides.map(ride => (
                      <Card key={ride.id} className="shadow-lg border-blue-300 bg-blue-50/50">
                        <CardHeader>
                          <CardTitle className="text-xl font-semibold text-blue-900 flex items-center justify-between">
                            <span>Current Assignment</span>
                            <Badge className={`${(ride.status ?? '') === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'} border`}>
                              {(ride.status ?? 'unknown').replace('-', ' ').toUpperCase()}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4 border-y py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-500">GUEST</p>
                              <p className="font-semibold text-slate-800">{ride.guest_name} (Room {ride.guest_room})</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-500">CONTACT</p>
                              <p className="font-semibold text-slate-800">{ride.guest_phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500 mb-2">ROUTE</p>
                            <div className="flex items-center gap-2 text-slate-800 flex-wrap">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold">{getLocationName(ride.pickup_location)}</span>
                              <span className="text-slate-400">→</span>
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold">{getLocationName(ride.destination)}</span>
                            </div>
                          </div>

                          {ride.special_requests && (
                            <div className="p-3 bg-amber-100/60 rounded-lg border border-amber-200">
                              <p className="text-sm font-medium text-amber-800 mb-1">Special Requirements:</p>
                              <p className="text-amber-900">{ride.special_requests}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                            {ride.status === 'assigned' && (
                              <>
                                <Button 
                                  onClick={() => handleNavigate(ride.pickup_location, 'pickup')}
                                  className="bg-blue-600 hover:bg-blue-700 font-semibold h-12"
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Navigate to Pickup
                                </Button>
                                {ride.guest_phone && (
                                  <Button asChild variant="outline" className="font-semibold h-12">
                                    <a href={`tel:${ride.guest_phone}`}>
                                      <Phone className="w-4 h-4 mr-2" />
                                      Call Guest
                                    </a>
                                  </Button>
                                )}
                                <Button 
                                  onClick={() => handleRideStatusChange(ride.id, 'in-progress')} 
                                  className="bg-indigo-600 hover:bg-indigo-700 font-semibold h-12 md:col-span-2"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Picked Up Guest - Start Journey
                                </Button>
                              </>
                            )}
                            {ride.status === 'in-progress' && (
                              <>
                                <Button 
                                  onClick={() => handleNavigate(ride.destination, 'destination')}
                                  className="bg-blue-600 hover:bg-blue-700 font-semibold h-12"
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Navigate to Destination
                                </Button>
                                {ride.guest_phone && (
                                  <Button asChild variant="outline" className="font-semibold h-12">
                                    <a href={`tel:${ride.guest_phone}`}>
                                      <Phone className="w-4 h-4 mr-2" />
                                      Call Guest
                                    </a>
                                  </Button>
                                )}
                                <Button 
                                  onClick={() => handleRideStatusChange(ride.id, 'completed')} 
                                  className="bg-green-600 hover:bg-green-700 font-semibold h-12 md:col-span-2"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Complete Ride - Drop Off Successful
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Card className="shadow-lg bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Your Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TomTomMap
                      vehicles={realTimeVehicles.filter(v => v.id === selectedVehicle?.id)}
                      rides={activeRides}
                      center={selectedVehicle?.location_lng && selectedVehicle?.location_lat ? [selectedVehicle.location_lng, selectedVehicle.location_lat] : undefined}
                      zoom={14}
                      height="800px"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-8 bg-slate-100 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Ride Request?</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline the ride request for {rideToReject?.guest_name}?
              This ride will remain available for other drivers to accept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectRide}>
              Decline Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>My Ride History</DialogTitle>
            <DialogDescription>
              Your completed rides and performance
            </DialogDescription>
          </DialogHeader>
          <DriverRideHistory driverName={driverInfo?.name} />
        </DialogContent>
      </Dialog>
    </>
  );
}
