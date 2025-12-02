import React, { createContext, useContext, useEffect, useState } from 'react';
import webSocketClient from '@/api/websocket';
import { useAuth } from '@/components/contexts/AuthContext';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleMessage = (data) => {
      if (data.type === 'vehicles_update') {
        setVehicles(data.payload);
      }
    };

    const handleConnected = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Initialize WebSocket connection
    webSocketClient.connect();
    webSocketClient.on('message', handleMessage);
    webSocketClient.on('connected', handleConnected);
    webSocketClient.on('disconnected', handleDisconnected);

    return () => {
      webSocketClient.off('message', handleMessage);
      webSocketClient.off('connected', handleConnected);
      webSocketClient.off('disconnected', handleDisconnected);
      webSocketClient.disconnect();
    };
  }, [user]);

  const sendLocationUpdate = (vehicleId, lat, lng, accuracy) => {
    if (webSocketClient.isConnected) {
      webSocketClient.send({
        type: 'location_update',
        payload: {
          vehicleId,
          location: { lat, lng },
          accuracy,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const sendRideRequest = (ride) => {
    if (webSocketClient.isConnected) {
      webSocketClient.send({
        type: 'new_ride_request',
        payload: ride
      });
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        vehicles,
        isConnected,
        sendLocationUpdate,
        sendRideRequest
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};