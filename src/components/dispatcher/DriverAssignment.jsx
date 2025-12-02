import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Truck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function DriverAssignment({ 
  vehicle, 
  drivers, 
  onAssign, 
  onUnassign,
  isOpen,
  onOpenChange
}) {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vehicle?.current_driver) {
      setSelectedDriver(vehicle.current_driver);
    } else {
      setSelectedDriver('');
    }
  }, [vehicle]);

  const handleAssign = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }

    setIsLoading(true);
    try {
      await onAssign(vehicle.id, selectedDriver);
      toast.success(`Driver assigned to ${vehicle.shuttle_number}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsLoading(true);
    try {
      await onUnassign(vehicle.id);
      toast.success(`Driver unassigned from ${vehicle.shuttle_number}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast.error('Failed to unassign driver');
    } finally {
      setIsLoading(false);
    }
  };

  const availableDrivers = drivers.filter(driver => 
    !driver.assigned_vehicle || driver.assigned_vehicle === vehicle.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {vehicle?.shuttle_number} - Driver Assignment
          </DialogTitle>
          <DialogDescription>
            {vehicle?.current_driver 
              ? `Currently assigned to ${vehicle.current_driver}`
              : 'No driver currently assigned'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Driver</label>
            <Select 
              value={selectedDriver} 
              onValueChange={setSelectedDriver}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No driver</SelectItem>
                {availableDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{driver.name}</span>
                      {driver.assigned_vehicle && (
                        <span className="text-xs text-gray-500">(Currently assigned)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {vehicle?.current_driver && (
            <Button 
              variant="destructive"
              onClick={handleUnassign}
              disabled={isLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Unassign Current Driver
            </Button>
          )}

          <Button 
            onClick={handleAssign}
            disabled={isLoading || !selectedDriver}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {vehicle?.current_driver ? 'Reassign Driver' : 'Assign Driver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}