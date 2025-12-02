
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Ride, Vehicle } from '@/api/appEntities';
import TomTomMap from "../components/maps/TomTomMap";
import { ArrowRight, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import TimeSince from "../components/common/TimeSince";
import { getLocationName } from "../components/common/LocationData";

export default function TVMonitor() {
  const [rides, setRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    // Request fullscreen on mount
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.log('Fullscreen request denied or failed', e);
      }
    };
    enterFullscreen();

    // Handle Esc key to exit and navigate back
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.log(err));
        }
        navigate('/Dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  const fetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  // CRITICAL: Fetch live data with rate limit protection
  const fetchLiveData = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }

    // Rate limit protection: minimum 3 seconds between fetches
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 3000) {
      return;
    }

    fetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      console.log('📺 TV MONITOR: Fetching live data...');
      
      // Check authentication
      // try {
      //   const currentUser = await base44.auth.me(); // TV Monitor is public/read-only usually, or use useAuth
      //   console.log('👤 TV MONITOR User:', currentUser?.email, currentUser?.roles);
      // } catch (authError) {
      //   console.log('⚠️ TV MONITOR: Not authenticated (public view)');
      // }
      
      // Fetch sequentially to avoid rate limits
      const ridesData = await Ride.list('-updated_date', 200);
      console.log('📋 TV MONITOR Raw Rides:', ridesData.length, 'rides');
      
      const vehiclesData = await Vehicle.list();
      console.log('🚗 TV MONITOR Raw Vehicles:', vehiclesData.length, 'vehicles');

      console.log('✅ TV MONITOR Data fetched:', {
        totalRides: ridesData.length,
        pending: ridesData.filter(r => r.status === 'pending').length,
        active: ridesData.filter(r => r.status === 'assigned' || r.status === 'in-progress').length,
        vehicles: vehiclesData.length
      });

      // Log incomplete rides
      const incompleteRides = ridesData.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
      if (incompleteRides.length > 0) {
        incompleteRides.slice(0, 5).forEach(ride => {
          console.log(`📋 TV MONITOR Incomplete Ride: ${ride.ride_code || ride.id} - ${ride.status} - ${ride.guest_name}`);
        });
      } else {
        console.warn('⚠️ TV MONITOR: NO INCOMPLETE RIDES FOUND!');
      }

      setRides(ridesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('❌ TV MONITOR error:', error);
      console.error('❌ TV MONITOR Full Error:', {
        message: error.message,
        stack: error.stack
      });
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    console.log('🚀 TV MONITOR: Initial data load');
    fetchLiveData();
  }, [fetchLiveData]);

  // Real-time polling - INCREASED to every 15 seconds to avoid rate limits
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveData();
    }, 15000); // Changed from 3000 to 15000 (15 seconds)

    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Update clock every second
  useEffect(() => {
    const timeInterval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const getStatusPill = (status) => {
    const styles = {
      pending: "bg-amber-500",
      assigned: "bg-blue-500",
      'in-progress': "bg-indigo-500",
    };
    return (
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={`w-2.5 h-2.5 rounded-full ${styles[status]} animate-pulse`}></span>
        <span className="capitalize text-slate-100">{(status || '').replace('-', ' ')}</span>
      </div>
    );
  };
  
  const pendingRides = rides.filter(r => r.status === 'pending');
  const activeRides = rides.filter(r => r.status === 'assigned' || r.status === 'in-progress');
  const vehiclesWithLocation = vehicles.filter(v => v.location_lat && v.location_lng);

  const CompactRideRow = ({ ride }) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 text-base">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate flex items-center gap-2.5">
          <User className="w-4 h-4 text-slate-300" />
          {ride.guest_name}
        </p>
        <p className="text-sm text-slate-400 truncate flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4 text-emerald-400" />
            {getLocationName(ride.pickup_location)}
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <MapPin className="w-4 h-4 text-blue-400" />
            {getLocationName(ride.destination)}
        </p>
      </div>
      <div className="w-44 text-right space-y-1">
        {getStatusPill(ride.status)}
        <TimeSince date={ride.updated_date} className="justify-end text-slate-400" />
      </div>
    </div>
  );

  const RideList = ({ rides, title }) => (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-800/70 backdrop-blur-sm rounded-lg border border-slate-700/60 shadow-2xl">
        <div className="p-4 border-b border-slate-700/60">
            <h2 className="text-xl font-bold text-white tracking-wide">{title} ({rides.length})</h2>
        </div>
        <div className="overflow-y-auto flex-1">
            {rides.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No {title.toLowerCase()}.</p>
                </div>
            )}
            {rides.map(ride => <CompactRideRow key={ride.id} ride={ride} />)}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white font-sans overflow-hidden">
      <header className="flex items-center p-4 flex-shrink-0 bg-slate-900/50 z-10">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-4 w-1/4 flex-shrink-0">
           <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10h14M5 18h14"></path></svg>
            </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Shuttle Command Center
          </h1>
        </div>
        
        {/* Center: Clock and Date - properly centered with flex-1 */}
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <p className="text-6xl font-mono font-bold text-white tracking-wider">{format(time, "HH:mm:ss")}</p>
            <p className="text-3xl text-slate-300 mt-1">{format(time, "eeee, MMMM do")}</p>
          </div>
        </div>
        
        {/* Right: Spacer to balance layout (or for future sign out button) */}
        <div className="w-1/4 flex-shrink-0"></div>
      </header>

      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        <div className="flex-1 relative rounded-lg overflow-hidden shadow-2xl">
          <TomTomMap
            vehicles={vehiclesWithLocation}
            rides={activeRides}
            center={[-95.3980, 29.7144]}
            zoom={14}
            height="100%"
            theme="dark"
          />
          <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg z-[1000] text-sm">
            🚗 {vehiclesWithLocation.length} vehicles • {pendingRides.length} pending • {activeRides.length} active • Refresh: 15s
          </div>
        </div>

        <aside className="w-[480px] flex flex-col flex-shrink-0 gap-4">
          <RideList rides={pendingRides} title="Pending Requests" />
          <RideList rides={activeRides} title="Active Shuttles" />
        </aside>
      </main>
    </div>
  );
}
