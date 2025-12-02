import React, { useState, useEffect } from "react";
import { Vehicle } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, User } from "lucide-react";
import { toast } from "sonner";

export default function DriverLogin({ onLogin, onVehicleSelect, initialDriverName }) {
  const [driverName, setDriverName] = useState(initialDriverName || '');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      // Show vehicles that are available for driver assignment:
      // - 'offline' vehicles (not yet started for the day)
      // - 'available' vehicles (online but not on a ride)
      // Exclude 'in-use' and 'maintenance' vehicles
      const allVehicles = await Vehicle.list();
      const availableVehicles = allVehicles.filter(v => 
        (v.status === 'offline' || v.status === 'available') && !v.current_driver
      );
      setVehicles(availableVehicles);
      
      console.log('Available vehicles for driver login:', {
        total: allVehicles.length,
        available: availableVehicles.length,
        breakdown: {
          offline: allVehicles.filter(v => v.status === 'offline').length,
          available: allVehicles.filter(v => v.status === 'available').length,
          inUse: allVehicles.filter(v => v.status === 'in-use').length,
          maintenance: allVehicles.filter(v => v.status === 'maintenance').length
        }
      });
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles.');
    }
  };

  const handleLogin = () => {
    if (!driverName || !driverName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!selectedVehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    
    if (!vehicle) {
      toast.error('Selected vehicle not found');
      return;
    }

    onLogin({ name: driverName.trim(), id: driverName.trim() });
    onVehicleSelect(vehicle);
  };

  return (
    <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-slate-200 max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">Driver Login</CardTitle>
        <p className="text-blue-100 text-center text-sm">Sign in to start your shift</p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="driverName" className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Driver Name
          </Label>
          <Input
            id="driverName"
            type="text"
            placeholder="Enter your full name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Select Available Vehicle
          </Label>
          {vehicles.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
              <p className="text-slate-600 mb-2">No available vehicles found.</p>
              <p className="text-sm text-slate-500 mb-3">
                All vehicles may be in use or require maintenance. Please contact dispatch.
              </p>
              <Button onClick={loadVehicles} variant="outline" className="mt-3">
                Refresh Vehicle List
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedVehicleId === vehicle.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg text-slate-900">{vehicle.shuttle_number}</p>
                      <p className="text-sm text-slate-600">
                        Capacity: {vehicle.capacity} • Mileage: {vehicle.current_mileage?.toLocaleString() || 0} mi
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Fuel: {vehicle.fuel_level || 'Unknown'} • Status: <span className="capitalize">{vehicle.status}</span>
                      </p>
                    </div>
                    {selectedVehicleId === vehicle.id && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleLogin}
          disabled={!driverName.trim() || !selectedVehicleId || vehicles.length === 0}
          className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        >
          Continue to Vehicle Inspection
        </Button>
      </CardContent>
    </Card>
  );
}