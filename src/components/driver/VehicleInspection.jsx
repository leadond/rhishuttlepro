
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, Truck } from "lucide-react";

const inspectionItems = [
  { id: 'lights_ok', label: 'All lights functioning properly' },
  { id: 'brakes_ok', label: 'Brakes responsive and working' },
  { id: 'tires_ok', label: 'Tires in good condition' },
  { id: 'interior_clean', label: 'Interior clean and presentable' },
  { id: 'emergency_equipment', label: 'Emergency equipment present' },
  { id: 'communication_ok', label: 'Communication system working' }
];

export default function VehicleInspection({ vehicle, driver, onComplete, onBack }) {
  const [inspectionData, setInspectionData] = useState({
    mileage: '',
    fuel_level: '',
    lights_ok: false,
    brakes_ok: false,
    tires_ok: false,
    interior_clean: false,
    emergency_equipment: false,
    communication_ok: false,
    notes: ''
  });

  const handleCheckboxChange = (itemId, checked) => {
    setInspectionData(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleSubmit = () => {
    if (!inspectionData.mileage || !inspectionData.fuel_level) {
      alert('Please fill in mileage and fuel level');
      return;
    }

    const checkedItems = inspectionItems.filter(item => inspectionData[item.id]).length;
    if (checkedItems < inspectionItems.length) {
      const proceed = window.confirm(
        `Warning: Only ${checkedItems} out of ${inspectionItems.length} safety checks completed. ` +
        'Vehicle may not be safe to operate. Proceed anyway?'
      );
      if (!proceed) return;
    }

    onComplete(inspectionData);
  };

  const allChecksComplete = inspectionItems.every(item => inspectionData[item.id]);

  return (
    <Card className="bg-white border border-gray-200 shadow-lg max-w-4xl mx-auto">
      <CardHeader className="bg-indigo-800 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-3">
          <Truck className="w-8 h-8" />
          Pre-Trip Vehicle Inspection
        </CardTitle>
        <div className="text-indigo-100 text-center">
          Driver: {driver?.name} • Vehicle: {vehicle?.shuttle_number}
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Safety Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Safety First</h3>
              <p className="text-yellow-800">
                Complete all safety checks before beginning your shift. 
                Do not operate vehicle if any safety issues are found.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="mileage" className="text-sm font-semibold text-slate-700">
              Current Odometer Reading
            </Label>
            <Input
              id="mileage"
              type="number"
              placeholder="Enter current mileage"
              value={inspectionData.mileage}
              onChange={(e) => setInspectionData(prev => ({...prev, mileage: e.target.value}))}
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fuel" className="text-sm font-semibold text-slate-700">
              Fuel Level
            </Label>
            <Select value={inspectionData.fuel_level} onValueChange={(value) => 
              setInspectionData(prev => ({...prev, fuel_level: value}))
            }>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select fuel level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Tank</SelectItem>
                <SelectItem value="3/4">3/4 Tank</SelectItem>
                <SelectItem value="1/2">1/2 Tank</SelectItem>
                <SelectItem value="1/4">1/4 Tank</SelectItem>
                <SelectItem value="low">Low - Needs Fuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Safety Checklist */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Safety Inspection Checklist</h3>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              allChecksComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <CheckCircle className="w-5 h-5" />
              {inspectionItems.filter(item => inspectionData[item.id]).length} / {inspectionItems.length} Complete
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {inspectionItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox
                  id={item.id}
                  checked={inspectionData[item.id]}
                  onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                  className="w-5 h-5"
                />
                <Label
                  htmlFor={item.id}
                  className="text-slate-700 font-medium cursor-pointer flex-1"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Report any issues, maintenance needs, or other observations..."
            value={inspectionData.notes}
            onChange={(e) => setInspectionData(prev => ({...prev, notes: e.target.value}))}
            className="h-24"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
          >
            Back to Login
          </Button>
          <Button 
            onClick={handleSubmit}
            className={`flex-1 font-semibold ${
              allChecksComplete 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {allChecksComplete ? 'Complete Inspection & Go Online' : 'Complete with Warnings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
