import React, { useState } from 'react';
import { Vehicle } from "@/api/appEntities";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, CheckCircle2, AlertCircle, Users, Truck, Building } from 'lucide-react';
import { toast } from 'sonner';
import { createUser } from '@/api/functions';

export default function CustomerOnboarding() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = () => {
    const template = `CUSTOMER ONBOARDING TEMPLATE - Shuttle Pro
Fill out all sections below and upload to complete setup

=== HOTEL INFORMATION ===
Hotel Name,
Primary Contact Name,
Contact Email,
Contact Phone,

=== STAFF & USERS ===
# Format: Full Name, Email, Role (hotel_admin/dispatcher/driver), Phone Number
# Example: John Smith, john@hotel.com, hotel_admin, 555-0100

Full Name,Email,Role,Phone Number
Jane Admin,jane@hotel.com,hotel_admin,555-0100
Mike Dispatcher,mike@hotel.com,dispatcher,555-0101
Tom Driver,tom@hotel.com,driver,555-0102

=== VEHICLES ===
# Format: Shuttle Number, Capacity, Current Mileage, Fuel Level (full/3/4/1/2/1/4/low)
# Example: S-101, 8, 25000, full

Shuttle Number,Capacity,Current Mileage,Fuel Level
S-101,8,25000,full
S-102,8,28500,3/4
S-103,12,15000,full

=== LOCATIONS ===
# Format: Location Name, Address, Latitude, Longitude
# Example: Main Lobby, 123 Hotel Dr, 29.7144, -95.3980

Location Name,Address,Latitude,Longitude
Main Lobby,123 Hotel Dr,29.7144,-95.3980
Airport Terminal,456 Airport Blvd,29.9844,-95.3414

=== NOTES ===
Add any special instructions or requirements here:
`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shuttle-pro-onboarding-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('Template downloaded! Fill it out and upload to begin setup.');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.info('File selected. Click "Preview Data" to review before importing.');
    }
  };

  const parseCSVData = (text) => {
    const lines = text.split('\n');
    let currentSection = null;
    const data = {
      hotel: {},
      users: [],
      vehicles: [],
      locations: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('=== HOTEL INFORMATION ===')) {
        currentSection = 'hotel';
        // Next 4 lines are hotel info
        const hotelName = lines[i + 1]?.split(',')[1]?.trim();
        const contactName = lines[i + 2]?.split(',')[1]?.trim();
        const contactEmail = lines[i + 3]?.split(',')[1]?.trim();
        const contactPhone = lines[i + 4]?.split(',')[1]?.trim();
        
        data.hotel = {
          name: hotelName || '',
          contact_name: contactName || '',
          contact_email: contactEmail || '',
          contact_phone: contactPhone || ''
        };
        i += 5;
        continue;
      }
      
      if (line.includes('=== STAFF & USERS ===')) {
        currentSection = 'users';
        continue;
      }
      
      if (line.includes('=== VEHICLES ===')) {
        currentSection = 'vehicles';
        continue;
      }
      
      if (line.includes('=== LOCATIONS ===')) {
        currentSection = 'locations';
        continue;
      }
      
      if (line.includes('=== NOTES ===')) {
        currentSection = 'notes';
        continue;
      }
      
      // Skip empty lines, comments, and headers
      if (!line || line.startsWith('#') || line.startsWith('Full Name') || 
          line.startsWith('Shuttle Number') || line.startsWith('Location Name')) {
        continue;
      }
      
      // Parse data based on current section
      if (currentSection === 'users' && line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3 && parts[0] && parts[1]) {
          data.users.push({
            full_name: parts[0],
            email: parts[1],
            role: parts[2] || 'driver',
            phone: parts[3] || ''
          });
        }
      }
      
      if (currentSection === 'vehicles' && line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && parts[0]) {
          data.vehicles.push({
            shuttle_number: parts[0],
            capacity: parseInt(parts[1]) || 8,
            current_mileage: parseInt(parts[2]) || 0,
            fuel_level: parts[3] || 'full'
          });
        }
      }
      
      if (currentSection === 'locations' && line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && parts[0]) {
          data.locations.push({
            name: parts[0],
            address: parts[1],
            latitude: parseFloat(parts[2]) || null,
            longitude: parseFloat(parts[3]) || null
          });
        }
      }
    }

    return data;
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);

    try {
      // Read file as text
      const text = await file.text();
      const parsedData = parseCSVData(text);

      console.log('Parsed data:', parsedData);

      if (parsedData.users.length === 0 && parsedData.vehicles.length === 0) {
        toast.error('No valid data found in file. Please check the format.');
        setUploading(false);
        return;
      }

      setPreview(parsedData);
      toast.success('Data preview loaded! Review and click "Import All Data" to proceed.');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) {
      toast.error('Preview data first');
      return;
    }

    setImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Import users
      for (const user of preview.users) {
        try {
          console.log('Creating user:', user.email);
          const response = await createUser({
            full_name: user.full_name,
            email: user.email,
            password: 'ChangeMe123!', // Default password
            roles: [user.role]
          });

          console.log('Create user response:', response);

          if (response?.data?.success) {
            successCount++;
          } else {
            errorCount++;
            const errorMsg = response?.data?.error || response?.data?.details || 'Unknown error';
            errors.push(`User ${user.email}: ${errorMsg}`);
            console.error('User creation failed:', errorMsg);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error?.response?.data?.error || error?.response?.data?.details || error.message || 'Unknown error';
          errors.push(`User ${user.email}: ${errorMsg}`);
          console.error('User creation error:', error);
        }
      }

      // Import vehicles
      for (const vehicle of preview.vehicles) {
        try {
          await Vehicle.create({
            ...vehicle,
            status: 'offline'
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Vehicle ${vehicle.shuttle_number}: ${error.message}`);
        }
      }

      // Show results
      if (errorCount === 0) {
        toast.success(`Successfully imported ${successCount} items!`, {
          description: `${preview.users.length} users and ${preview.vehicles.length} vehicles`
        });
      } else {
        toast.warning(`Imported ${successCount} items with ${errorCount} errors`, {
          description: 'Check console for details',
          duration: 5000
        });
        console.error('Import errors:', errors);
      }

      // Reset
      setPreview(null);
      setFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Building className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Customer Onboarding</h3>
              <p className="text-sm text-slate-700 mb-3">
                Set up a new customer by downloading the template, filling in their information, and uploading it back to automatically create users, vehicles, and locations.
              </p>
              <div className="flex gap-2 text-xs text-slate-600">
                <Badge variant="outline" className="bg-white">Step 1: Download Template</Badge>
                <Badge variant="outline" className="bg-white">Step 2: Fill Out Info</Badge>
                <Badge variant="outline" className="bg-white">Step 3: Upload & Import</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Step 1: Download Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Download the CSV template with all required fields for customer setup.
          </p>
          <Button onClick={downloadTemplate} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download Onboarding Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload & Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            Step 2: Upload Completed Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="onboarding_file">Select File</Label>
            <Input
              id="onboarding_file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="mt-1"
            />
            {file && (
              <p className="text-sm text-slate-600 mt-2">
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={!file || uploading}
              variant="outline"
            >
              {uploading ? 'Processing...' : 'Preview Data'}
            </Button>

            {preview && (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-green-600 hover:bg-green-700"
              >
                {importing ? 'Importing...' : 'Import All Data'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hotel Info */}
            {preview.hotel.name && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Hotel Information
                </h4>
                <div className="bg-white rounded-lg border p-4 space-y-2 text-sm">
                  <p><strong>Name:</strong> {preview.hotel.name}</p>
                  <p><strong>Contact:</strong> {preview.hotel.contact_name}</p>
                  <p><strong>Email:</strong> {preview.hotel.contact_email}</p>
                  <p><strong>Phone:</strong> {preview.hotel.contact_phone}</p>
                </div>
              </div>
            )}

            {/* Users */}
            {preview.users.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users ({preview.users.length})
                </h4>
                <div className="space-y-2">
                  {preview.users.map((user, idx) => (
                    <div key={idx} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Default password: <code className="bg-slate-100 px-1 rounded">ChangeMe123!</code> (users should change on first login)
                </p>
              </div>
            )}

            {/* Vehicles */}
            {preview.vehicles.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Vehicles ({preview.vehicles.length})
                </h4>
                <div className="space-y-2">
                  {preview.vehicles.map((vehicle, idx) => (
                    <div key={idx} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{vehicle.shuttle_number}</p>
                        <p className="text-sm text-slate-600">
                          Capacity: {vehicle.capacity} | Mileage: {vehicle.current_mileage} | Fuel: {vehicle.fuel_level}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            {preview.locations.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Locations ({preview.locations.length})</h4>
                <div className="space-y-2">
                  {preview.locations.map((location, idx) => (
                    <div key={idx} className="bg-white rounded-lg border p-3">
                      <p className="font-semibold text-slate-900">{location.name}</p>
                      <p className="text-sm text-slate-600">{location.address}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Note: Locations are for reference only. Update your location data in the app as needed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}