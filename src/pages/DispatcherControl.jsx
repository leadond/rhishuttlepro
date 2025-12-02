
import React, { useState, useEffect, useCallback, useRef } from "react";

import { Ride, Vehicle, EmergencyAlert, Driver, Rating } from '@/api/appEntities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Truck, Users, Clock, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import FleetMap from "../components/dispatcher/FleetMap";
import RideManagement from "../components/dispatcher/RideManagement";
import DriverStatus from "../components/dispatcher/DriverStatus";
import EmergencyPanel from "../components/dispatcher/EmergencyPanel";
import AnalyticsDashboard from "../components/dispatcher/AnalyticsDashboard";
import CreateRideRequest from "../components/dispatcher/CreateRideRequest";
import SimulationControl from "../components/dispatcher/SimulationControl";
import { webhookDispatcher } from "@/api/functions";
import { useAuth } from "@/components/contexts/AuthContext";

export default function DispatcherControl() {
  const { user: currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeDrivers: 0,
    pendingRides: 0,
    activeRides: 0,
    emergencyAlerts: 0
  });
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [newRideNotification, setNewRideNotification] = useState(false);

  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastFetchTimeRef = useRef(0);

  // CRITICAL: Fetch live data with rate limit protection
  const fetchAllData = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('⏭️ Fetch already in progress, skipping...');
      return;
    }

    // Rate limit protection: minimum 2 seconds between fetches
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      console.log('⏭️ Too soon since last fetch, skipping...');
      return;
    }

    fetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      console.log('🔄 DISPATCHER: Fetching live data from database...');
      
      // Check authentication first
      if (!currentUser) {
        console.log('⏳ DISPATCHER: Waiting for user authentication...');
        fetchingRef.current = false;
        return;
      }
      // const currentUser = await base44.auth.me(); // Already handled by useAuth
      // const { user: currentUser } = useAuth(); // REMOVED: Invalid hook call
      console.log('👤 Current User:', {
        email: currentUser?.email,
        name: currentUser?.full_name,
        roles: currentUser?.roles
      });
      
      // Fetch data sequentially to avoid rate limits
      const ridesData = await Ride.list('-updated_date', 200);
      console.log('📋 Raw Rides Data:', ridesData.length, 'rides');
      
      const vehiclesData = await Vehicle.list();
      console.log('🚗 Raw Vehicles Data:', vehiclesData.length, 'vehicles');
      
      const alertsData = await EmergencyAlert.list('-created_date', 100);
      console.log('🚨 Raw Emergency Alerts Data:', alertsData);
      console.log('🚨 Total Alerts:', alertsData.length);
      console.log('🚨 Active Alerts:', alertsData.filter(a => a.status === 'active').length);
      
      const driversData = await Driver.filter({ status: { '$in': ['signed-in', 'on-ride', 'on-break'] } });
      const ratingsData = await Rating.filter({ flagged_for_review: true });

      // Filter active alerts
      const activeAlerts = alertsData.filter(a => a.status === 'active');

      console.log('✅ DISPATCHER Data fetched:', {
        totalRides: ridesData.length,
        pending: ridesData.filter(r => r.status === 'pending').length,
        assigned: ridesData.filter(r => r.status === 'assigned').length,
        inProgress: ridesData.filter(r => r.status === 'in-progress').length,
        vehicles: vehiclesData.length,
        totalAlerts: alertsData.length,
        activeAlerts: activeAlerts.length,
        drivers: driversData.length
      });

      // Log each alert for debugging
      if (activeAlerts.length > 0) {
        activeAlerts.forEach(alert => {
          console.log(`🚨 Active Alert ${alert.id}: ${alert.alert_type} - ${alert.priority} - ${alert.message}`);
        });
      } else {
        console.warn('⚠️ NO ACTIVE ALERTS FOUND!');
      }

      setRides(ridesData);
      setVehicles(vehiclesData);
      setAlerts(activeAlerts);
      setDrivers(driversData);
      setRatings(ratingsData);

      // Calculate stats
      const pendingCount = ridesData.filter(r => r.status === 'pending').length;
      const activeCount = ridesData.filter(r => r.status === 'assigned' || r.status === 'in-progress').length;
      const activeDriversCount = driversData.length > 0 ? driversData.length : vehiclesData.filter(v => v.status === 'available' || v.status === 'in-use').length;
      
      // 🆕 NEW RIDE NOTIFICATION: Check if pending count increased
      if (prevPendingCount > 0 && pendingCount > prevPendingCount) {
        setNewRideNotification(true);
        toast.info(`🔔 ${pendingCount - prevPendingCount} New Ride Request${pendingCount - prevPendingCount > 1 ? 's' : ''}!`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => setSelectedTab('rides')
          }
        });
        
        // Play notification sound (optional)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCl+zPDTiTkIHGK36+aaUBELTKXh8bllHgU2ltzy1oU2Bxt21PDaiT0IGGm78eaeUBAMUKvm8bxnIAQ7k9rx0YU4BhttufHjmU0RDUyn4/G0YiAFOZDV8s+AOQcZbLvv6ZhQEgxPquXxvGYfBTmT2vHRhDgGHG23+OOYTRANSafi8LdjHwU5k9n0y4I3Bxpuu+3ol1ITCk6p5fG8Zh8FOZPZ8dGEOAYcbbf445dOEQ1Ip+Pwt2MfBTmT2fPLgjcHGm673+eXUhILTqvm8r1mHwU5k9rx0YQ4BhxttvjimE4SDEmo4/C3Yh8FOZPY8suCNgcZbrvt6JdRUgsOp+MBqPCVCWz');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignore if audio fails
        } catch {}
        
        setTimeout(() => setNewRideNotification(false), 5000);
      }
      
      setPrevPendingCount(pendingCount);
      
      setStats({
        activeDrivers: activeDriversCount,
        pendingRides: pendingCount,
        activeRides: activeCount,
        emergencyAlerts: activeAlerts.length
      });

      setLoading(false);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('❌ DISPATCHER Error fetching data:', error);
      console.error('❌ Full Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('Rate limit exceeded')) {
        retryCountRef.current++;
        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        console.log(`⏳ Rate limited. Waiting ${backoffTime}ms before retry...`);
        toast.warning(`Rate limit reached. Retrying in ${Math.round(backoffTime/1000)}s...`, {
          duration: 3000
        });
      } else {
        toast.error('Failed to load data: ' + error.message);
      }
      
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [prevPendingCount, setSelectedTab, currentUser]);

  // Initial load
  useEffect(() => {
    console.log('🚀 DISPATCHER: Initial data load');
    fetchAllData();
  }, [fetchAllData]);

  // Real-time polling - INCREASED to every 10 seconds to avoid rate limits
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 DISPATCHER: Auto-refresh cycle');
      fetchAllData();
    }, 10000); // Changed from 3000 to 10000 (10 seconds)

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRideCreated = useCallback(async (newRideData) => {
    try {
      console.log('🆕 DISPATCHER: Creating new ride:', newRideData);
      const createdRide = await Ride.create(newRideData);
      console.log('✅ DISPATCHER: Ride created:', createdRide);
      toast.success(`Ride ${createdRide.ride_code} created successfully!`);
      
      // Wait 1 second before refresh to avoid rate limit
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('❌ DISPATCHER: Error creating ride:', error);
      toast.error('Failed to create ride: ' + error.message);
    }
  }, [fetchAllData]);

  const handleAssignDriver = useCallback(async (rideId, driverName, vehicleId) => {
    const newVehicle = vehicles.find(v => v.id === vehicleId);
    if (!newVehicle) {
      toast.error('Selected vehicle not found.');
      return;
    }

    try {
      const ride = rides.find(r => r.id === rideId);
      
      await Ride.update(rideId, {
        status: 'assigned',
        assigned_driver: driverName,
        vehicle_number: newVehicle.shuttle_number,
        assigned_timestamp: new Date().toISOString(),
        updated_date: new Date().toISOString()
      });

      await Vehicle.update(vehicleId, { 
        status: 'in-use', 
        current_driver: driverName,
        location_updated: new Date().toISOString()
      });

      // 🔔 TRIGGER WEBHOOK: ride.assigned
      try {
        await webhookDispatcher({
          event: 'ride.assigned',
          data: {
            ride_id: rideId,
            ride_code: ride?.ride_code,
            guest_name: ride?.guest_name,
            assigned_driver: driverName,
            vehicle_number: newVehicle.shuttle_number,
            pickup_location: ride?.pickup_location,
            destination: ride?.destination,
            assigned_at: new Date().toISOString()
          }
        });
        console.log('✅ Webhook triggered for ride.assigned');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }

      toast.success(`Ride ${ride?.ride_code || rideId} assigned to ${driverName}!`);
      
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  }, [vehicles, rides, fetchAllData]);

  const handleEmergencyAlert = useCallback(async (type, message) => {
    try {
      const newAlert = await EmergencyAlert.create({
        alert_type: type,
        message: message,
        priority: 'high',
        status: 'active',
        created_date: new Date().toISOString()
      });
      
      // 🔔 TRIGGER WEBHOOK: alert.created
      try {
        await webhookDispatcher({
          event: 'alert.created',
          data: {
            alert_id: newAlert.id,
            alert_type: newAlert.alert_type,
            message: newAlert.message,
            priority: newAlert.priority,
            status: newAlert.status,
            created_at: newAlert.created_date
          }
        });
        console.log('✅ Webhook triggered for alert.created');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }
      
      toast.error('Emergency alert broadcasted!', {
        duration: 5000
      });
      
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    }
  }, [fetchAllData]);

  const handleResolveAlert = useCallback(async (alertId) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      
      await EmergencyAlert.update(alertId, { 
        status: 'resolved', 
        resolved_time: new Date().toISOString() 
      });
      
      // 🔔 TRIGGER WEBHOOK: alert.resolved
      try {
        await webhookDispatcher({
          event: 'alert.resolved',
          data: {
            alert_id: alertId,
            alert_type: alert?.alert_type,
            resolved_at: new Date().toISOString()
          }
        });
        console.log('✅ Webhook triggered for alert.resolved');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }
      
      toast.success('Alert resolved.');
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  }, [alerts, fetchAllData]);

  const handleAcknowledgeRating = useCallback(async (ratingId) => {
    try {
      // const user = await base44.auth.me(); // Use currentUser from hook
      await Rating.update(ratingId, { 
        flagged_for_review: false,
        reviewed_by: 'dispatcher', // Fallback or use currentUser.email if available in scope
        reviewed_at: new Date().toISOString()
      });
      toast.success('Rating acknowledged.');
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error acknowledging rating:', error);
      toast.error('Failed to acknowledge rating');
    }
  }, [fetchAllData]);

  const handleTakeOffline = useCallback(async (vehicleId) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      
      await Vehicle.update(vehicleId, { 
        status: 'offline', 
        current_driver: null,
        location_updated: new Date().toISOString()
      });
      
      // 🔔 TRIGGER WEBHOOK: vehicle.status_changed
      try {
        await webhookDispatcher({
          event: 'vehicle.status_changed',
          data: {
            vehicle_id: vehicleId,
            shuttle_number: vehicle?.shuttle_number,
            old_status: vehicle?.status,
            new_status: 'offline',
            changed_at: new Date().toISOString()
          }
        });
        console.log('✅ Webhook triggered for vehicle.status_changed');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }
      
      toast.success('Vehicle taken offline.');
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error taking vehicle offline:', error);
      toast.error('Failed to update vehicle');
    }
  }, [vehicles, fetchAllData]);

  const handleBringOnline = useCallback(async (vehicleId) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      
      await Vehicle.update(vehicleId, { 
        status: 'available',
        location_updated: new Date().toISOString()
      });
      
      // 🔔 TRIGGER WEBHOOK: vehicle.status_changed
      try {
        await webhookDispatcher({
          event: 'vehicle.status_changed',
          data: {
            vehicle_id: vehicleId,
            shuttle_number: vehicle?.shuttle_number,
            old_status: vehicle?.status,
            new_status: 'available',
            changed_at: new Date().toISOString()
          }
        });
        console.log('✅ Webhook triggered for vehicle.status_changed');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }
      
      toast.success('Vehicle brought online.');
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error bringing vehicle online:', error);
      toast.error('Failed to update vehicle');
    }
  }, [vehicles, fetchAllData]);

  const handleUnassignDriver = useCallback(async (vehicleId) => {
    try {
      await Vehicle.update(vehicleId, { 
        current_driver: null, 
        status: 'available',
        location_updated: new Date().toISOString()
      });
      toast.success('Driver unassigned.');
      setTimeout(() => fetchAllData(), 1000);
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast.error('Failed to unassign driver');
    }
  }, [fetchAllData]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, highlight, onClick }) => (
    <Card 
      onClick={onClick}
      className={`shadow-sm hover:shadow-md transition-all border-slate-200/80 cursor-pointer ${highlight ? 'ring-2 ring-blue-500 animate-pulse' : ''} hover:scale-[1.02]`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text', 'bg')}/10 relative`}>
            <Icon className={`w-6 h-6 ${color}`} />
            {highlight && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dispatcher control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600"/>
              Dispatch Command Center
              {newRideNotification && (
                <Badge className="bg-blue-500 text-white animate-bounce">
                  NEW RIDES
                </Badge>
              )}
            </h1>
            <p className="text-slate-500 mt-1">
              Real-time fleet management • {rides.length} total rides • Auto-refreshing every 10s
            </p>
          </div>
          <div className="flex gap-2">
            <CreateRideRequest onRideCreated={handleRideCreated} />
            <Button
              onClick={() => handleEmergencyAlert('general', 'Emergency broadcast to all drivers')}
              variant="destructive"
              className="font-semibold px-4 shadow-md h-10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Broadcast Alert
            </Button>
            <Button
              onClick={fetchAllData}
              variant="outline"
              className="font-semibold h-10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>

            <SimulationControl />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard 
            title="Active Drivers" 
            value={stats.activeDrivers} 
            icon={Users} 
            color="text-green-600" 
            onClick={() => setSelectedTab('overview')}
          />
          <StatCard 
            title="Pending Rides" 
            value={stats.pendingRides} 
            icon={Clock} 
            color="text-amber-600"
            highlight={newRideNotification}
            onClick={() => setSelectedTab('rides')}
          />
          <StatCard 
            title="Rides In-Service" 
            value={stats.activeRides} 
            icon={Truck} 
            color="text-blue-600" 
            onClick={() => setSelectedTab('rides')}
          />
          <StatCard 
            title="Active Alerts" 
            value={stats.emergencyAlerts} 
            icon={AlertTriangle} 
            color="text-red-600"
            highlight={stats.emergencyAlerts > 0}
            onClick={() => setSelectedTab('emergency')}
          />
        </div>

        <div className="bg-white p-1.5 rounded-lg shadow-md border border-slate-200 mb-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Fleet Overview', icon: Truck },
              { id: 'rides', label: 'Ride Management', icon: Users },
              { id: 'emergency', label: 'Alert Center', icon: AlertTriangle },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                variant="ghost"
                className={`flex-1 h-11 font-semibold transition-all duration-200 rounded-md
                  ${selectedTab === tab.id
                    ? 'bg-slate-800 text-white shadow hover:bg-slate-900'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in">
          {selectedTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FleetMap
                  vehicles={vehicles.filter(v => v.location_lat && v.location_lng)}
                  rides={rides.filter(r => r.status === 'assigned' || r.status === 'in-progress')}
                  center={[-95.3980, 29.7144]}
                  title="Live Fleet & Traffic Map"
                />
              </div>
              <div>
                <DriverStatus 
                  vehicles={vehicles} 
                  onRefresh={fetchAllData}
                  onTakeOffline={handleTakeOffline}
                  onBringOnline={handleBringOnline}
                  onUnassignDriver={handleUnassignDriver}
                />
              </div>
            </div>
          )}
          {selectedTab === 'rides' && (
            <RideManagement 
              rides={rides} 
              vehicles={vehicles} 
              onAssignDriver={handleAssignDriver} 
              onRefresh={fetchAllData}
            />
          )}
          {selectedTab === 'emergency' && (
            <EmergencyPanel 
              alerts={alerts} 
              onResolveAlert={handleResolveAlert} 
              onSendAlert={handleEmergencyAlert} 
              negativeRatings={ratings}
              onAcknowledgeRating={handleAcknowledgeRating}
            />
          )}
          {selectedTab === 'analytics' && (
            <AnalyticsDashboard rides={rides} vehicles={vehicles} ratings={ratings} />
          )}
        </div>
      </div>
    </div>
  );
}
