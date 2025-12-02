import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Truck, Fuel, Clock, AlertTriangle, PowerOff, UserX, Power } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DriverStatus({ vehicles, onRefresh, onTakeOffline, onBringOnline, onUnassignDriver }) {
  const getStatusColor = (status) => {
    const statusStr = (status || 'offline').toLowerCase();
    switch(statusStr) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-use': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFuelColor = (level) => {
    const fuelLevel = (level || 'unknown').toLowerCase();
    switch(fuelLevel) {
      case 'full':
      case '3/4': return 'text-green-600';
      case '1/2': return 'text-yellow-600';
      case '1/4':
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="shadow-xl bg-white/80 backdrop-blur-sm border border-gray-100 rounded-lg" style={{ zIndex: 1 }}>
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          Fleet Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {vehicles.map((vehicle) => {
            const status = vehicle.status || 'offline';
            const fuelLevel = vehicle.fuel_level || 'unknown';
            const shuttleNumber = vehicle.shuttle_number || 'Unknown';
            const currentDriver = vehicle.current_driver || null;
            const capacity = vehicle.capacity || 'N/A';
            const mileage = vehicle.current_mileage || null;

            return (
              <div
                key={vehicle.id}
                className="group border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-all duration-200 ease-in-out hover:shadow-md"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <div>
                      <p className="font-bold text-lg text-slate-900">{shuttleNumber}</p>
                      <p className="text-sm text-gray-600">
                        {currentDriver || <span className="text-gray-400 italic">No driver assigned</span>}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(status)} text-xs font-medium px-3 py-1 rounded-full border`}>
                    {status.toUpperCase().replace('-', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Fuel className={`w-4 h-4 ${getFuelColor(fuelLevel)} group-hover:scale-105 transition-transform`} />
                    <span className={`${getFuelColor(fuelLevel)} font-medium`}>
                      {fuelLevel.charAt(0).toUpperCase() + fuelLevel.slice(1)} fuel
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 group-hover:text-slate-600 transition-colors" />
                    <span className="text-slate-600 font-medium">
                      {capacity} seats
                    </span>
                  </div>
                  {mileage && (
                    <div className="flex items-center gap-2 md:col-span-2 mt-2 pt-2 border-t border-gray-100">
                      <span className="text-slate-600">Mileage:</span>
                      <span className="font-medium text-slate-700">{mileage.toLocaleString()} miles</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2" style={{ position: 'relative', zIndex: 100 }}>
                  {currentDriver && (status === 'available' || status === 'in-use') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-300"
                          style={{ position: 'relative', zIndex: 101 }}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Unassign Driver
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent style={{ zIndex: 10000 }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unassign Driver?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {currentDriver} from {shuttleNumber}. 
                            The vehicle will remain available for reassignment with a new driver.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onUnassignDriver(vehicle.id);
                            }} 
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Unassign Driver
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  {(status === 'available' || status === 'in-use') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300"
                          style={{ position: 'relative', zIndex: 101 }}
                        >
                          <PowerOff className="w-4 h-4 mr-2" />
                          Take Offline
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent style={{ zIndex: 10000 }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Take Vehicle Offline?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will take {shuttleNumber} offline and unassign {currentDriver || 'the driver'}. 
                            The vehicle will not be available for new rides until brought back online.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onTakeOffline(vehicle.id);
                            }} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Take Offline
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {status === 'offline' && (
                    <Button
                      onClick={() => onBringOnline(vehicle.id)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      style={{ position: 'relative', zIndex: 101 }}
                    >
                      <Power className="w-4 h-4 mr-2" />
                      Bring Online
                    </Button>
                  )}
                </div>

                {fuelLevel === 'low' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-center gap-2 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="font-medium">Low fuel - needs refueling!</span>
                  </div>
                )}
              </div>
            );
          })}

          {vehicles.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No vehicles currently in the system.</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* TODO: Add DriverAssignment functionality
      <DriverAssignment
        vehicle={selectedVehicle}
        drivers={drivers}
        isOpen={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        onAssign={async (vehicleId, driverId) => {
          try {
            await onAssignDriver(vehicleId, driverId);
            setAssignmentDialogOpen(false);
          } catch (error) {
            console.error('Error assigning driver:', error);
          }
        }}
        onUnassign={async (vehicleId) => {
          try {
            await onUnassignDriver(vehicleId);
            setAssignmentDialogOpen(false);
          } catch (error) {
            console.error('Error unassigning driver:', error);
          }
        }}
      />
      */}
    </Card>
  );
}