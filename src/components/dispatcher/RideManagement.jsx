import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Clock, Truck, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimeSince from "../common/TimeSince";
import { toast } from "sonner";
import { getLocationName } from "../common/LocationData";

export default function RideManagement({ rides, vehicles, onAssignDriver, onRefresh }) {
  const getStatusColor = (status) => {
    const statusStr = status ?? '';
    switch(statusStr) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConsentBadge = (consentStatus) => {
    const status = consentStatus ?? 'none';
    if (status === 'none') return null;
    
    const styles = {
      pending: { color: 'bg-amber-100 text-amber-800 border-amber-300', text: '📱 Awaiting SMS Consent' },
      granted: { color: 'bg-green-100 text-green-800 border-green-300', text: '✓ SMS Consent Granted' },
      denied: { color: 'bg-red-100 text-red-800 border-red-300', text: '✗ SMS Declined' }
    };
    
    const style = styles[status] || styles.pending;
    return <Badge className={`${style.color} border text-xs`}>{style.text}</Badge>;
  };

  // Allow assigning to available OR in-use vehicles (multi-ride support)
  const availableVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'in-use');
  const pendingRides = rides.filter(r => r.status === 'pending');
  const activeRides = rides.filter(r => r.status === 'assigned' || r.status === 'in-progress');

  const handleReassign = (ride, newVehicleId) => {
    const newVehicle = vehicles.find(v => v.id === newVehicleId);
    if (!newVehicle) {
      toast.error('Selected vehicle not found');
      return;
    }

    // Call parent handler to update state
    onAssignDriver(ride.id, newVehicle.current_driver || newVehicle.shuttle_number, newVehicleId);
    toast.success(`Ride reassigned to ${newVehicle.shuttle_number} (${newVehicle.current_driver || 'Driver'})`);
    
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleUnassign = (ride) => {
    // For demo mode, just show toast - parent will handle state
    toast.success("Ride unassigned and returned to pending queue.");
    
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Assignments ({pendingRides.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {pendingRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4 bg-white relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">{ride.guest_name}</p>
                      <p className="text-sm text-slate-600">Room {ride.guest_room}</p>
                      {ride.guest_phone && (
                        <p className="text-sm text-slate-600">{ride.guest_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <TimeSince date={ride.updated_date} prefix="Pending " />
                    {getConsentBadge(ride.sms_consent_status)}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{getLocationName(ride.pickup_location)} → {getLocationName(ride.destination)}</span>
                  </div>
                  {ride.special_requests && (
                    <div className="p-2 bg-blue-50 rounded text-sm text-slate-700">
                      <strong>Special Requests:</strong> {ride.special_requests}
                    </div>
                  )}
                  {ride.priority && ride.priority !== 'normal' && (
                    <Badge className="bg-red-100 text-red-800">
                      {ride.priority.toUpperCase()} Priority
                    </Badge>
                  )}
                </div>

                {ride.sms_consent_status === 'pending' && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      ⏳ Waiting for guest to reply YES to SMS consent request
                    </p>
                  </div>
                )}

                {ride.sms_consent_status === 'denied' && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">
                      ℹ️ Guest declined SMS notifications. Use phone call for updates.
                    </p>
                  </div>
                )}

                {availableVehicles.length > 0 ? (
                  <div className="space-y-2 relative z-50">
                    <p className="text-sm font-medium text-slate-700">Assign Vehicle:</p>
                    <Select onValueChange={(vehicleId) => onAssignDriver(ride.id, vehicles.find(v => v.id === vehicleId)?.current_driver, vehicleId)}>
                      <SelectTrigger className="w-full relative z-50">
                        <SelectValue placeholder="Select vehicle..." />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                        {availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.shuttle_number} - {vehicle.current_driver || 'Unassigned'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">No vehicles available</p>
                )}
              </div>
            ))}
            {pendingRides.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending ride requests</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Active Rides ({activeRides.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {activeRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4 bg-white relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold">{ride.guest_name}</p>
                      <p className="text-sm text-slate-600">
                        Driver: {ride.assigned_driver} • {ride.vehicle_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge className={getStatusColor(ride.status)}>
                      {(ride.status ?? '').replace('-', ' ').toUpperCase()}
                    </Badge>
                    <TimeSince date={ride.updated_date} className="mt-1" />
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{getLocationName(ride.pickup_location)} → {getLocationName(ride.destination)}</span>
                  </div>
                  {ride.special_requests && (
                    <div className="p-2 bg-blue-50 rounded text-sm text-slate-700">
                      <strong>Special Requests:</strong> {ride.special_requests}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 relative z-50">
                  {availableVehicles.length > 0 && (
                    <Select onValueChange={(vehicleId) => handleReassign(ride, vehicleId)}>
                      <SelectTrigger className="w-full relative z-50">
                        <SelectValue placeholder="Reassign to different vehicle..." />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                        {availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.shuttle_number} - {vehicle.current_driver || 'Unassigned'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button
                    onClick={() => handleUnassign(ride)}
                    size="sm"
                    variant="outline"
                    className="w-full text-orange-600 hover:bg-orange-50 border-orange-300"
                  >
                    Unassign & Return to Queue
                  </Button>
                </div>
              </div>
            ))}
            {activeRides.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active rides</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}