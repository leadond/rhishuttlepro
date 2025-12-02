import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getApiKeys } from '@/api/functions';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function RouteMap({ pickup, destination, driverLocation }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await getApiKeys();
        setApiKey(response.data.tomtomApiKey);
      } catch (error) {
        console.error('Failed to fetch API key:', error);
      }
    };
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!pickup || !destination || !apiKey) return;

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const start = `${pickup.lng},${pickup.lat}`;
        const end = `${destination.lng},${destination.lat}`;
        
        const response = await fetch(
          `https://api.tomtom.com/routing/1/calculateRoute/${start}:${end}/json?key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const points = data.routes[0].legs[0].points.map(point => [point.latitude, point.longitude]);
          setRoute(points);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [pickup, destination, apiKey]);

  if (!pickup || !destination) return null;

  const center = [
    (pickup.lat + destination.lat) / 2,
    (pickup.lng + destination.lng) / 2
  ];

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>Pickup Location</Popup>
        </Marker>
        
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Destination</Popup>
        </Marker>
        
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]}>
            <Popup>Driver Current Location</Popup>
          </Marker>
        )}
        
        {route && <Polyline positions={route} color="blue" weight={4} opacity={0.7} />}
      </MapContainer>
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          Calculating route...
        </div>
      )}
    </div>
  );
}