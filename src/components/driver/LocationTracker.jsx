import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Satellite, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '@/contexts/WebSocketContext';

export default function LocationTracker({ vehicleId, isOnline }) {
  const { sendLocationUpdate, isConnected: isWebSocketConnected } = useWebSocket();
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('requesting');
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const timeoutCountRef = useRef(0);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('GPS not supported by this browser');
      setPermissionStatus('unsupported');
      toast.error('GPS is not supported by your device/browser');
      return;
    }

    console.log('🛰️ Starting GPS tracking...');
    setPermissionStatus('requesting');

    const handlePosition = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log('📍 GPS location acquired:', { latitude, longitude, accuracy: accuracy.toFixed(0) + 'm' });
      
      // Reset timeout counter on successful location
      timeoutCountRef.current = 0;
      
      setLocation({ latitude, longitude });
      setAccuracy(accuracy);
      setError(null);
      setPermissionStatus('granted');

      // Update via WebSocket if connected
      const now = Date.now();
      if (now - lastUpdateRef.current >= 30000) {
        lastUpdateRef.current = now;
        
        if (isWebSocketConnected) {
          sendLocationUpdate(vehicleId, latitude, longitude, accuracy);
        }
      }
    };

    const handleError = (err) => {
      console.error('❌ GPS Error:', err);
      
      if (err.code === err.PERMISSION_DENIED) {
        setError('GPS tracking disabled - Enable location in browser settings');
        setPermissionStatus('denied');
        toast.error('Location permission denied. Please enable location access in your browser settings.', {
          duration: 10000
        });
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError('GPS signal unavailable - Move to area with better signal');
        setPermissionStatus('unavailable');
        // Don't show toast for unavailable - it's too noisy
        console.log('⚠️ GPS signal unavailable, will keep trying...');
      } else if (err.code === err.TIMEOUT) {
        // Handle timeout gracefully - increment counter and retry
        timeoutCountRef.current++;
        console.log(`⏱️ GPS request timed out (attempt ${timeoutCountRef.current}), will retry...`);
        
        // Only show error message after multiple timeouts
        if (timeoutCountRef.current === 1) {
          setError('Acquiring GPS signal - Please wait...');
        } else if (timeoutCountRef.current >= 3) {
          setError('GPS signal weak - Searching for satellites...');
          setPermissionStatus('searching');
        }
        
        // Don't show toast for timeout - handle silently
        // Retry after a delay
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Retrying GPS acquisition after timeout...');
          startTracking();
        }, 5000); // Retry after 5 seconds
      } else {
        setError('GPS error: ' + err.message);
        setPermissionStatus('error');
      }
    };

    // Start watching position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // Accept cached position up to 10 seconds old
        timeout: 30000 // Increased timeout to 30 seconds
      }
    );

    // Also get immediate position for faster initial load
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (err) => {
        // Handle getCurrentPosition errors silently - watchPosition will keep trying
        console.log('Initial GPS attempt:', err.code === 3 ? 'timeout (will retry)' : err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout to 20 seconds
        maximumAge: 10000
      }
    );
  };

  useEffect(() => {
    if (!isOnline || !vehicleId) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.log('🛑 GPS tracking stopped - driver offline');
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      timeoutCountRef.current = 0;
      return;
    }

    console.log('✅ Driver online - initializing GPS tracking');
    
    // Request permission and start tracking immediately
    startTracking();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('🛑 GPS tracking stopped - component unmounted');
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [vehicleId, isOnline]);

  const getAccuracyColor = () => {
    if (!accuracy) return 'bg-gray-100 text-gray-800';
    if (accuracy < 20) return 'bg-green-100 text-green-800';
    if (accuracy < 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPermissionBadge = () => {
    switch(permissionStatus) {
      case 'requesting':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔄 Requesting Permission</Badge>;
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Permission Granted</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Permission Denied</Badge>;
      case 'unavailable':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">⚠️ Signal Unavailable</Badge>;
      case 'searching':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🔍 Searching for Signal</Badge>;
      case 'unsupported':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">❌ Not Supported</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg bg-white border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Satellite className="w-5 h-5 text-blue-600" />
            GPS Location Tracking
          </CardTitle>
          {getPermissionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && permissionStatus === 'denied' ? (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">GPS Issue</p>
              <p className="text-xs text-amber-800 mt-1">{error}</p>
              <p className="text-xs text-amber-700 mt-2">
                <strong>How to fix:</strong> Check your browser's location settings and refresh the page.
              </p>
            </div>
          </div>
        ) : error && permissionStatus === 'unavailable' ? (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Satellite className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Searching for GPS Signal</p>
              <p className="text-xs text-blue-800 mt-1">Move to an area with clearer sky view for better signal</p>
              <p className="text-xs text-blue-700 mt-1">System will continue trying automatically...</p>
            </div>
          </div>
        ) : location ? (
          <>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">✅ GPS Active & Tracking</span>
              </div>
              <Badge className={getAccuracyColor()}>
                ±{accuracy?.toFixed(0)}m
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-gray-600 text-xs font-medium">Latitude</p>
                <p className="font-mono font-semibold text-gray-900">{location.latitude.toFixed(6)}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-gray-600 text-xs font-medium">Longitude</p>
                <p className="font-mono font-semibold text-gray-900">{location.longitude.toFixed(6)}</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 text-center">
                📡 Location updates every 30 seconds • Keep app open for continuous tracking
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <Satellite className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-medium text-gray-700">🛰️ Acquiring GPS signal...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
              {permissionStatus === 'requesting' && (
                <p className="text-xs text-gray-400 mt-2">Please allow location access when prompted</p>
              )}
              {permissionStatus === 'searching' && (
                <p className="text-xs text-gray-400 mt-2">Searching for satellites... please wait</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}