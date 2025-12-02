import React, { useState, useEffect } from 'react';
import { Vehicle, MaintenanceLog } from "@/api/appEntities";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Edit, Trash2, RefreshCw, Wrench, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    shuttle_number: '',
    capacity: 8,
    current_mileage: 0,
    fuel_level: 'full',
    status: 'offline'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesData, logsData] = await Promise.all([
        Vehicle.list(),
        MaintenanceLog.list('-created_date', 100)
      ]);
      
      setVehicles(vehiclesData);
      setMaintenanceLogs(logsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load vehicle data');
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.shuttle_number) {
      toast.error('Shuttle number is required');
      return;
    }

    try {
      await Vehicle.create(formData);
      toast.success(`Vehicle ${formData.shuttle_number} added successfully!`);
      setShowAddDialog(false);
      setFormData({
        shuttle_number: '',
        capacity: 8,
        current_mileage: 0,
        fuel_level: 'full',
        status: 'offline'
      });
      await loadData();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (vehicleId, shuttleNumber) => {
    if (!confirm(`Are you sure you want to delete vehicle ${shuttleNumber}?`)) return;

    try {
      await Vehicle.delete(vehicleId);
      toast.success('Vehicle deleted');
      await loadData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const viewMaintenanceLogs = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowLogsDialog(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-use': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'offline': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const vehicleLogs = selectedVehicle 
    ? maintenanceLogs.filter(log => log.vehicle_id === selectedVehicle.shuttle_number)
    : [];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Fleet Management</h3>
          <p className="text-sm text-slate-600">Manage vehicles and maintenance records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Shuttle Number *</Label>
                  <Input
                    value={formData.shuttle_number}
                    onChange={(e) => setFormData({...formData, shuttle_number: e.target.value})}
                    placeholder="e.g., S-101"
                  />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Current Mileage</Label>
                  <Input
                    type="number"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({...formData, current_mileage: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Fuel Level</Label>
                  <Select 
                    value={formData.fuel_level} 
                    onValueChange={(value) => setFormData({...formData, fuel_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="1/2">1/2</SelectItem>
                      <SelectItem value="1/4">1/4</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVehicle}>
                  Add Vehicle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  {vehicle.shuttle_number}
                </CardTitle>
                <Badge className={getStatusColor(vehicle.status)}>
                  {vehicle.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Capacity</p>
                  <p className="font-semibold">{vehicle.capacity} passengers</p>
                </div>
                <div>
                  <p className="text-slate-500">Fuel</p>
                  <p className="font-semibold">{vehicle.fuel_level || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mileage</p>
                  <p className="font-semibold">{vehicle.current_mileage || 0} mi</p>
                </div>
                <div>
                  <p className="text-slate-500">Driver</p>
                  <p className="font-semibold text-xs">{vehicle.current_driver || 'None'}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewMaintenanceLogs(vehicle)}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Logs
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteVehicle(vehicle.id, vehicle.shuttle_number)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Maintenance Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Maintenance Logs - {selectedVehicle?.shuttle_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {vehicleLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No maintenance logs found</p>
              </div>
            ) : (
              vehicleLogs.map((log) => (
                <Card key={log.id} className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge className="mb-2">
                          {log.inspection_type}
                        </Badge>
                        <p className="text-sm text-slate-600">
                          {new Date(log.created_date).toLocaleString()}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          Driver: {log.driver_id}
                        </p>
                      </div>
                      <Badge className={log.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {log.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-slate-500">Mileage:</span>
                        <span className="font-semibold ml-2">{log.mileage}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fuel:</span>
                        <span className="font-semibold ml-2">{log.fuel_level}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={log.lights_ok ? 'text-green-700' : 'text-red-700'}>
                        {log.lights_ok ? '✓' : '✗'} Lights
                      </div>
                      <div className={log.brakes_ok ? 'text-green-700' : 'text-red-700'}>
                        {log.brakes_ok ? '✓' : '✗'} Brakes
                      </div>
                      <div className={log.tires_ok ? 'text-green-700' : 'text-red-700'}>
                        {log.tires_ok ? '✓' : '✗'} Tires
                      </div>
                      <div className={log.interior_clean ? 'text-green-700' : 'text-red-700'}>
                        {log.interior_clean ? '✓' : '✗'} Interior
                      </div>
                      <div className={log.emergency_equipment ? 'text-green-700' : 'text-red-700'}>
                        {log.emergency_equipment ? '✓' : '✗'} Emergency Kit
                      </div>
                      <div className={log.communication_ok ? 'text-green-700' : 'text-red-700'}>
                        {log.communication_ok ? '✓' : '✗'} Communication
                      </div>
                    </div>

                    {log.notes && (
                      <div className="mt-3 p-2 bg-white rounded border text-sm">
                        <p className="font-semibold text-slate-700">Notes:</p>
                        <p className="text-slate-600">{log.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLogsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}