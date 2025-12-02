import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { Ride, Vehicle, Driver, EmergencyAlert, Rating } from "@/api/appEntities";
import { toast } from 'sonner';
import { useAuth } from '@/components/contexts/AuthContext';

const SimulationContext = createContext();

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
};

// Pre-approved locations with GPS coordinates
const LOCATIONS = {
  "hotel-lobby": { lat: 29.7074, lng: -95.3981, name: "Hotel Lobby" },
  "starbucks-rice": { lat: 29.7176, lng: -95.4214, name: "Starbucks" },
  "damicos-rice": { lat: 29.7165, lng: -95.4231, name: "D'Amico's" },
  "black-walnut-rice": { lat: 29.7165, lng: -95.4231, name: "Black Walnut Cafe" },
  "banana-republic-rice": { lat: 29.7169, lng: -95.4219, name: "Banana Republic" },
  "museum-natural-science": { lat: 29.7223, lng: -95.3893, name: "Museum of Natural Science" },
  "museum-fine-arts": { lat: 29.7256, lng: -95.3904, name: "Museum of Fine Arts" },
  "health-museum": { lat: 29.7219, lng: -95.3889, name: "Health Museum" },
  "hermann-park": { lat: 29.7164, lng: -95.3903, name: "Hermann Park" },
  "houston-zoo": { lat: 29.7147, lng: -95.3919, name: "The Houston Zoo" },
  "holocaust-museum": { lat: 29.7229, lng: -95.3897, name: "Holocaust Museum" },
  "palmer-memorial": { lat: 29.7174, lng: -95.4019, name: "Palmer Memorial Episcopal Church" },
  "christ-the-king": { lat: 29.7067, lng: -95.4134, name: "Christ The King Lutheran Church" },
  "st-vincent": { lat: 29.7028, lng: -95.4389, name: "St. Vincent de Paul Catholic Church" },
  "md-main-building": { lat: 29.7074, lng: -95.3981, name: "Main Building / Clark Clinic" },
  "md-muslim-prayer-room": { lat: 29.7074, lng: -95.3981, name: "Muslim Prayer Room" },
  "md-duncan-building": { lat: 29.7089, lng: -95.3967, name: "Dan L Duncan Building" },
  "md-mays-clinic": { lat: 29.7067, lng: -95.3989, name: "Mays Clinic" },
  "md-pickens-tower": { lat: 29.7092, lng: -95.3978, name: "Pickens Tower" },
  "md-mitchell-research": { lat: 29.7098, lng: -95.3956, name: "Mitchell Research Building" },
  "md-life-science-plaza": { lat: 29.7102, lng: -95.3978, name: "Life Science Plaza" },
  "md-proton-therapy-1": { lat: 29.7034, lng: -95.3912, name: "Proton Therapy Center 1" },
  "md-proton-therapy-2": { lat: 29.7034, lng: -95.3912, name: "Proton Therapy Center 2" }
};

const LOCATION_IDS = Object.keys(LOCATIONS);

const GUEST_NAMES = [
  "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim", "Jessica Williams",
  "James Brown", "Maria Garcia", "Robert Taylor", "Jennifer Martinez", "William Anderson",
  "Lisa Thompson", "Daniel Moore", "Nancy White", "Christopher Lee", "Karen Harris"
];

const SPECIAL_REQUESTS = [
  "", "", "", "", // 70% no special requests
  "Wheelchair accessible",
  "Extra luggage space",
  "Child seat needed",
  "Running late - please wait"
];

function generateRideCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePhoneNumber() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${exchange}${subscriber}`;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function interpolatePosition(start, end, progress) {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress
  };
}

export function SimulationProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [stats, setStats] = useState({
    ridesCreated: 0,
    ridesCompleted: 0,
    ratingsGenerated: 0
  });
  const [vehicles, setVehicles] = useState([]);
  const [rides, setRides] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  // Move useAuth to top level
  const { user } = useAuth();
  
  const intervalRefs = useRef({
    main: null,
    timer: null,
    rideCreation: null,
    vehicleMovement: null,
    rideProgression: null,
    dataSync: null
  });
  
  const activeRidesRef = useRef([]);
  const vehicleRoutesRef = useRef({});
  const dbVehiclesRef = useRef([]);
  const isSyncingRef = useRef(false);

  // CRITICAL: Real-time data sync with immediate updates
  const syncDataFromDatabase = useCallback(async (retryCount = 0, forceUpdate = false) => {
    // Allow force updates to bypass sync lock for critical operations
    if (isSyncingRef.current && !forceUpdate) {
      console.log('⏭️ Sync already in progress, skipping...');
      return;
    }

    // CRITICAL: Ensure user is authenticated before syncing
    if (!user) {
      console.log('🛑 Sync skipped: User not authenticated');
      return;
    }

    isSyncingRef.current = true;

    try {
      console.log('🔄 Syncing data from database...');
      
      const [ridesData, vehiclesData, alertsData, driversData] = await Promise.all([
        Ride.list({ sort: '-updated_date', limit: 200 }).catch(() => []),
        Vehicle.list().catch(() => []),
        EmergencyAlert.filter({ status: 'active' }).catch(() => []),
        Driver.filter({ status: { '$in': ['signed-in', 'on-ride', 'on-break'] } }).catch(() => [])
      ]);

      setRides(ridesData);
      setVehicles(vehiclesData);
      setAlerts(alertsData);
      setDrivers(driversData);
      setLastUpdate(Date.now());
      setIsInitialized(true);
      setNetworkError(false);

      console.log('✅ Data synced:', {
        rides: ridesData.length,
        vehicles: vehiclesData.length,
        alerts: alertsData.length,
        drivers: driversData.length
      });
    } catch (error) {
      console.error('❌ Error syncing data:', error.message);
      
      setNetworkError(true);
      
      // Retry with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => syncDataFromDatabase(retryCount + 1), delay);
      } else {
        toast.error('Network connection issue. Refreshing...', {
          duration: 3000
        });
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [user]);

  const createNewRide = useCallback(async () => {
    try {
      const guestName = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
      const roomNumber = String(Math.floor(Math.random() * 900) + 100);
      const phoneNumber = generatePhoneNumber();
      
      const pickupId = LOCATION_IDS[Math.floor(Math.random() * LOCATION_IDS.length)];
      let destinationId = LOCATION_IDS[Math.floor(Math.random() * LOCATION_IDS.length)];
      while (destinationId === pickupId) {
        destinationId = LOCATION_IDS[Math.floor(Math.random() * LOCATION_IDS.length)];
      }
      
      const specialRequest = SPECIAL_REQUESTS[Math.floor(Math.random() * SPECIAL_REQUESTS.length)];
      
      const newRide = {
        guest_name: guestName,
        guest_room: roomNumber,
        guest_phone: phoneNumber,
        pickup_location: pickupId,
        destination: destinationId,
        special_requests: specialRequest,
        status: 'pending',
        priority: 'normal',
        ride_code: generateRideCode(),
        public_access_token: crypto.randomUUID(),
        pending_timestamp: new Date().toISOString(),
        sms_consent_status: 'none'
      };

      console.log('🆕 Creating ride in database:', newRide.ride_code);
      const createdRide = await Ride.create(newRide);
      activeRidesRef.current.push(createdRide);
      
      setStats(prev => ({ ...prev, ridesCreated: prev.ridesCreated + 1 }));
      console.log('✅ Ride created:', createdRide.ride_code, guestName);
      
      // CRITICAL: Force immediate sync after creating ride
      await syncDataFromDatabase(0, true);
      
      return createdRide;
    } catch (error) {
      console.error('Error creating ride:', error);
    }
  }, [syncDataFromDatabase]);

  const assignRideToDriver = useCallback(async (ride) => {
    try {
      const availableVehicles = dbVehiclesRef.current.filter(v => v.status === 'available');
      if (availableVehicles.length === 0) {
        console.log('⚠️ No available vehicles');
        return;
      }

      const vehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
      
      console.log('🚐 Assigning ride to vehicle:', vehicle.shuttle_number);
      
      await Ride.update(ride.id, {
        status: 'assigned',
        assigned_driver: vehicle.current_driver,
        vehicle_number: vehicle.shuttle_number,
        assigned_timestamp: new Date().toISOString()
      });

      await Vehicle.update(vehicle.id, { status: 'in-use' });

      dbVehiclesRef.current = dbVehiclesRef.current.map(v => 
        v.id === vehicle.id ? { ...v, status: 'in-use' } : v
      );

      const pickup = LOCATIONS[ride.pickup_location];
      const destination = LOCATIONS[ride.destination];
      
      vehicleRoutesRef.current[vehicle.id] = {
        rideId: ride.id,
        phase: 'to_pickup',
        start: { lat: vehicle.location_lat || 29.7074, lng: vehicle.location_lng || -95.3981 },
        pickup: pickup,
        destination: destination,
        progress: 0,
        startTime: Date.now()
      };

      console.log('✅ Assigned ride', ride.ride_code, 'to', vehicle.shuttle_number);
      
      const updatedRide = { 
        ...ride, 
        status: 'assigned', 
        assigned_driver: vehicle.current_driver, 
        vehicle_number: vehicle.shuttle_number 
      };
      activeRidesRef.current = activeRidesRef.current.map(r => r.id === ride.id ? updatedRide : r);
      
      // CRITICAL: Force immediate sync after assigning
      await syncDataFromDatabase(0, true);
      
      return updatedRide;
    } catch (error) {
      console.error('Error assigning ride:', error);
    }
  }, [syncDataFromDatabase]);

  const progressRide = useCallback(async (ride) => {
    try {
      if (ride.status === 'assigned') {
        await Ride.update(ride.id, {
          status: 'in-progress',
          in_progress_timestamp: new Date().toISOString()
        });

        const vehicle = dbVehiclesRef.current.find(v => v.shuttle_number === ride.vehicle_number);
        if (vehicle && vehicleRoutesRef.current[vehicle.id]) {
          vehicleRoutesRef.current[vehicle.id].phase = 'to_destination';
          vehicleRoutesRef.current[vehicle.id].progress = 0;
          vehicleRoutesRef.current[vehicle.id].startTime = Date.now();
        }

        console.log('🎬 Started ride', ride.ride_code);
        
        const updatedRide = { ...ride, status: 'in-progress' };
        activeRidesRef.current = activeRidesRef.current.map(r => r.id === ride.id ? updatedRide : r);
        
        await syncDataFromDatabase(0, true);
        
      } else if (ride.status === 'in-progress') {
        await Ride.update(ride.id, {
          status: 'completed',
          completed_timestamp: new Date().toISOString(),
          completed_time: new Date().toISOString(),
          access_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });

        const vehicle = dbVehiclesRef.current.find(v => v.shuttle_number === ride.vehicle_number);
        if (vehicle) {
          await Vehicle.update(vehicle.id, { status: 'available' });
          
          dbVehiclesRef.current = dbVehiclesRef.current.map(v => 
            v.id === vehicle.id ? { ...v, status: 'available' } : v
          );
          
          delete vehicleRoutesRef.current[vehicle.id];
        }

        const isPositive = Math.random() > 0.3;
        const rating = isPositive 
          ? Math.floor(Math.random() * 2) + 4
          : Math.floor(Math.random() * 3) + 1;

        await Rating.create({
          ride_id: ride.id,
          driver_id: ride.assigned_driver,
          vehicle_id: ride.vehicle_number,
          guest_phone: ride.guest_phone,
          rating: rating,
          service_quality: isPositive ? rating : rating + 1,
          punctuality: isPositive ? rating : rating - 1,
          vehicle_condition: isPositive ? rating : rating,
          would_recommend: isPositive,
          comments: isPositive 
            ? "Great service! Very professional driver."
            : "Not satisfied with the service.",
          flagged_for_review: !isPositive
        });

        setStats(prev => ({ 
          ...prev, 
          ridesCompleted: prev.ridesCompleted + 1,
          ratingsGenerated: prev.ratingsGenerated + 1
        }));

        console.log('✅ Completed ride', ride.ride_code, '- Rating:', rating);
        
        activeRidesRef.current = activeRidesRef.current.filter(r => r.id !== ride.id);
        
        await syncDataFromDatabase(0, true);
      }
    } catch (error) {
      console.error('Error progressing ride:', error);
    }
  }, [syncDataFromDatabase]);

  const moveVehicles = useCallback(() => {
    const updatedVehicles = dbVehiclesRef.current.map(vehicle => {
      const route = vehicleRoutesRef.current[vehicle.id];
      if (!route) return vehicle;

      const elapsed = Date.now() - route.startTime;
      const speed = 0.00015;
      
      let target, distance;
      if (route.phase === 'to_pickup') {
        target = route.pickup;
        distance = calculateDistance(route.start.lat, route.start.lng, target.lat, target.lng);
      } else {
        target = route.destination;
        distance = calculateDistance(route.pickup.lat, route.pickup.lng, target.lat, target.lng);
      }

      const estimatedTime = (distance / (speed * 111));
      route.progress = Math.min(elapsed / (estimatedTime * 1000), 1);

      const start = route.phase === 'to_pickup' ? route.start : route.pickup;
      const newPosition = interpolatePosition(start, target, route.progress);

      Vehicle.update(vehicle.id, {
        location_lat: newPosition.lat,
        location_lng: newPosition.lng,
        location_updated: new Date().toISOString()
      }).catch(() => {});

      if (route.progress >= 1) {
        const ride = activeRidesRef.current.find(r => r.id === route.rideId);
        if (ride) {
          setTimeout(() => progressRide(ride), 2000); 
        }
      }

      return {
        ...vehicle,
        location_lat: newPosition.lat,
        location_lng: newPosition.lng,
        location_updated: new Date().toISOString()
      };
    });

    dbVehiclesRef.current = updatedVehicles;
    setVehicles(updatedVehicles); 
  }, [progressRide]);

  const autoAssignPendingRides = useCallback(async () => {
    try {
      const pendingRides = await Ride.filter({ status: 'pending' });
      const availableVehicles = dbVehiclesRef.current.filter(v => v.status === 'available');
      
      if (pendingRides.length > 0 && availableVehicles.length > 0) {
        const rideToAssign = pendingRides[0];
        await assignRideToDriver(rideToAssign);
      }
    } catch (error) {
      console.error('Error auto-assigning rides:', error);
    }
  }, [assignRideToDriver]);

  const stopSimulation = useCallback(() => {
    console.log('🛑 Stopping demo');
    
    Object.values(intervalRefs.current).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    intervalRefs.current = {
      main: null,
      timer: null,
      rideCreation: null,
      vehicleMovement: null,
      rideProgression: null,
      dataSync: null
    };

    activeRidesRef.current = [];
    vehicleRoutesRef.current = {};
    dbVehiclesRef.current = [];
    
    setIsActive(false);
  }, []);

  const startSimulation = useCallback(async () => {
    console.log('🎬 Starting Demo...');
    setIsActive(true);
    setTimeRemaining(3600);
    setStats({ ridesCreated: 0, ridesCompleted: 0, ratingsGenerated: 0 });
    activeRidesRef.current = [];
    vehicleRoutesRef.current = {};

    try {
      const dbVehicles = await Vehicle.list();
      
      if (dbVehicles.length === 0) {
        console.error('No vehicles found. Please add vehicles first.');
        setIsActive(false);
        return;
      }

      dbVehiclesRef.current = dbVehicles;
      setVehicles(dbVehicles);

      for (const vehicle of dbVehicles) {
        try {
          await Vehicle.update(vehicle.id, { 
            status: 'available',
            location_lat: vehicle.location_lat || 29.7074,
            location_lng: vehicle.location_lng || -95.3981,
            location_updated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating vehicle:', vehicle.shuttle_number, error);
        }
      }

      const updatedVehicles = await Vehicle.list();
      dbVehiclesRef.current = updatedVehicles;
      setVehicles(updatedVehicles);

      await syncDataFromDatabase(0, true);

      console.log('✅ Demo started with', updatedVehicles.length, 'vehicles');

      intervalRefs.current.timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            stopSimulation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      intervalRefs.current.rideCreation = setInterval(() => {
        createNewRide();
      }, Math.floor(Math.random() * 15000) + 15000);

      intervalRefs.current.rideProgression = setInterval(() => {
        autoAssignPendingRides();
      }, 8000);

      intervalRefs.current.vehicleMovement = setInterval(() => {
        moveVehicles();
      }, 2000);

      // Sync every 10 seconds during simulation for real-time updates
      intervalRefs.current.dataSync = setInterval(() => {
        syncDataFromDatabase();
      }, 10000);

      setTimeout(() => createNewRide(), 2000);
      
    } catch (error) {
      console.error('❌ Error starting simulation:', error);
      setIsActive(false);
    }
  }, [createNewRide, autoAssignPendingRides, moveVehicles, syncDataFromDatabase, stopSimulation]);



  useEffect(() => {
    // Only sync if user is logged in
    if (user) {
      // Initial data load
      syncDataFromDatabase();
      
      // CRITICAL: Sync every 5 seconds for real-time updates when not in simulation
      const interval = setInterval(() => {
        if (!isActive) {
          syncDataFromDatabase();
        }
      }, 5000); // Changed from 30s to 5s for real-time updates
      
      return () => {
        clearInterval(interval);
        Object.values(intervalRefs.current).forEach(interval => {
          if (interval) clearInterval(interval);
        });
      };
    }
  }, [isActive, syncDataFromDatabase, user]);

  const value = {
    isActive,
    timeRemaining,
    stats,
    vehicles,
    rides,
    alerts,
    drivers,
    lastUpdate,
    isInitialized,
    networkError,
    startSimulation,
    stopSimulation,
    refreshData: () => syncDataFromDatabase(0, true) // Force immediate refresh
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}