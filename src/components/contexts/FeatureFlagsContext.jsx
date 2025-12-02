import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureFlag } from "@/api/appEntities";
import { useAuth } from '@/components/contexts/AuthContext';

const FeatureFlagsContext = createContext({});

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFeatureFlags();
    } else {
      setLoading(false); // Stop loading if no user
    }
  }, [user]);

  const loadFeatureFlags = async () => {
    try {
      const features = await FeatureFlag.list();
      const flagMap = {};
      features.forEach(f => {
        flagMap[f.feature_key] = f.is_enabled;
      });
      setFlags(flagMap);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (featureKey) => {
    // If flag doesn't exist in database, check if it's a basic feature
    if (flags[featureKey] === undefined) {
      const BASIC_FEATURES = [
        'ride_management', 'driver_dashboard', 'dispatch_control', 
        'vehicle_tracking', 'vehicle_inspection', 'guest_portal',
        'emergency_alerts', 'tv_monitor', 'basic_reporting',
        'user_management', 'simulation_mode'
      ];
      return BASIC_FEATURES.includes(featureKey);
    }
    
    // If flag exists, use its value (false means disabled)
    return flags[featureKey] === true;
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isFeatureEnabled, loading, refresh: loadFeatureFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};