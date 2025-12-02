import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Professional vehicle icon
const vehicleIcon = new L.DivIcon({
  html: '<div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; border-radius: 8px; width: 36px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 10px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui;">VAN</div>',
  className: 'custom-vehicle-icon',
  iconSize: [36, 24],
  iconAnchor: [18, 24]
});

// Component to handle map updates and marker positions
function MapUpdater({ vehicles }) {
  const map = useMap();
  const markersRef = useRef({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((marker) => {
        try {
          if (map && marker && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        } catch (error) {
          console.warn('Error cleaning up marker:', error);
        }
      });
      markersRef.current = {};
    };
  }, [map]);

  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;
    if (!map) return;

    // Update existing markers or create new ones
    vehicles.forEach((vehicle) => {
      if (!vehicle.location_lat || !vehicle.location_lng) return;

      const position = [vehicle.location_lat, vehicle.location_lng];
      const markerId = vehicle.id;

      // If marker exists and still on map, update its position
      if (markersRef.current[markerId]) {
        try {
          if (map.hasLayer(markersRef.current[markerId])) {
            markersRef.current[markerId].setLatLng(position);
          } else {
            // Re-add marker if it was removed
            markersRef.current[markerId].addTo(map);
            markersRef.current[markerId].setLatLng(position);
          }
        } catch (error) {
          console.warn('Error updating marker:', error);
          // Recreate marker if update fails
          delete markersRef.current[markerId];
        }
      }
      
      // Create new marker if it doesn't exist or failed to update
      if (!markersRef.current[markerId]) {
        try {
          const marker = L.marker(position, { icon: vehicleIcon })
            .addTo(map)
            .bindPopup(`
              <div class="text-center font-medium">
                <h4 class="font-semibold text-slate-800">${vehicle.shuttle_number}</h4>
                <p class="text-sm text-slate-600">Driver: ${vehicle.current_driver || 'Unassigned'}</p>
                <p class="text-sm text-slate-600 capitalize">Status: ${vehicle.status || 'offline'}</p>
              </div>
            `);
          markersRef.current[markerId] = marker;
        } catch (error) {
          console.warn('Error creating marker:', error);
        }
      }
    });

    // Remove markers for vehicles no longer in the list
    Object.keys(markersRef.current).forEach((markerId) => {
      const vehicleExists = vehicles.some((v) => v.id === markerId);
      if (!vehicleExists && markersRef.current[markerId]) {
        try {
          if (map.hasLayer(markersRef.current[markerId])) {
            map.removeLayer(markersRef.current[markerId]);
          }
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
        delete markersRef.current[markerId];
      }
    });

    // Auto-fit bounds to show all vehicles
    try {
      const positions = vehicles
        .filter((v) => v.location_lat && v.location_lng)
        .map((v) => [v.location_lat, v.location_lng]);

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } catch (error) {
      console.warn('Error fitting bounds:', error);
    }
  }, [vehicles, map]);

  return null;
}

// Tile Layers
const tileLayers = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

export default function TomTomMap({ vehicles = [], rides = [], center, zoom, height, title, theme = 'light' }) {
  const leafletCenter = center ? [center[1], center[0]] : [29.7144, -95.3980]; // Houston default
  const selectedTileLayer = tileLayers[theme] || tileLayers.light;

  // Filter to only vehicles with valid GPS coordinates
  const vehiclesWithLocation = vehicles.filter((v) =>
    v.location_lat &&
    v.location_lng &&
    !isNaN(v.location_lat) &&
    !isNaN(v.location_lng)
  );

  return (
    <div className="bg-slate-300 opacity-100 rounded-xl relative overflow-hidden h-full w-full border border-slate-200 shadow-lg" style={{ zIndex: 1 }}>
      {title && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-lg z-[100] font-semibold text-sm shadow-lg">
          {title}
        </div>
      )}
      <div style={{ height: height || '600px', width: '100%' }}>
        <MapContainer
          center={leafletCenter}
          zoom={zoom || 13}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="rounded-xl"
          zoomControl={true}
        >
          <TileLayer
            attribution={selectedTileLayer.attribution}
            url={selectedTileLayer.url}
          />

          <MapUpdater vehicles={vehiclesWithLocation} />
        </MapContainer>
      </div>
      
      {vehiclesWithLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 z-[999]">
          <div className="text-center text-slate-600">
            <p className="font-medium">No GPS tracking data available</p>
            <p className="text-sm">Vehicles will appear when drivers go online</p>
          </div>
        </div>
      )}
    </div>
  );
}