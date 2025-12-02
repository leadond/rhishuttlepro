import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Hotel, CreditCard, Phone } from "lucide-react";

export default function GuestLogin({ onLogin }) {
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomLastName: '',
    bookingNumber: '',
    bookingLastName: '',
    phone: ''
  });

  const handleSubmit = (type) => {
    if (!formData.phone) {
      alert('Phone number is required for ride notifications and driver communication');
      return;
    }

    if (type === 'room') {
      if (!formData.roomNumber || !formData.roomLastName) {
        alert('Please enter both room number and last name');
        return;
      }
      onLogin({
        name: formData.roomLastName,
        room: formData.roomNumber,
        phone: formData.phone,
        type: 'room'
      });
    } else {
      if (!formData.bookingNumber || !formData.bookingLastName) {
        alert('Please enter both booking number and last name');
        return;
      }
      onLogin({
        name: formData.bookingLastName,
        room: formData.bookingNumber,
        phone: formData.phone,
        type: 'booking'
      });
    }
  };

  return (
    <Card className="shadow-lg bg-white border border-gray-200 max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">Request Your Shuttle</CardTitle>
        <p className="text-blue-100 text-center">Please verify your information to continue</p>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Required Phone Number */}
        <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <Label htmlFor="phone" className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact Phone Number (Required)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g., (555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
            className="h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <p className="text-sm text-blue-700">Required for SMS updates and driver communication</p>
        </div>

        {/* Room Number Login */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Hotel className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Hotel Room Access</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber" className="text-sm font-semibold text-slate-700">
                Room Number
              </Label>
              <Input
                id="roomNumber"
                type="text"
                placeholder="e.g. 1205"
                value={formData.roomNumber}
                onChange={(e) => setFormData(prev => ({...prev, roomNumber: e.target.value}))}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomLastName" className="text-sm font-semibold text-slate-700">
                Last Name
              </Label>
              <Input
                id="roomLastName"
                type="text"
                placeholder="Last name on reservation"
                value={formData.roomLastName}
                onChange={(e) => setFormData(prev => ({...prev, roomLastName: e.target.value}))}
                className="h-12"
              />
            </div>
          </div>

          <Button 
            onClick={() => handleSubmit('room')}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Request Shuttle with Room Number
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-slate-500 font-medium">OR</span>
          <Separator className="flex-1" />
        </div>

        {/* Booking Number Login */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Booking Reference</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bookingNumber" className="text-sm font-semibold text-slate-700">
                Booking Number
              </Label>
              <Input
                id="bookingNumber"
                type="text"
                placeholder="e.g. BK123456"
                value={formData.bookingNumber}
                onChange={(e) => setFormData(prev => ({...prev, bookingNumber: e.target.value}))}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookingLastName" className="text-sm font-semibold text-slate-700">
                Last Name
              </Label>
              <Input
                id="bookingLastName"
                type="text"
                placeholder="Last name on booking"
                value={formData.bookingLastName}
                onChange={(e) => setFormData(prev => ({...prev, bookingLastName: e.target.value}))}
                className="h-12"
              />
            </div>
          </div>

          <Button 
            onClick={() => handleSubmit('booking')}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Request Shuttle with Booking Number
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}