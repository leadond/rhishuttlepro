import React, { useState, useEffect } from "react";
import { Ride } from '@/api/appEntities';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import PassengerCounter from "../common/PassengerCounter";
import { toast } from "sonner";
import { LOCATION_GROUPS } from "../common/LocationData";
import { webhookDispatcher } from "@/api/functions"; // Added import

export default function CreateRideRequest({ onRideCreated }) {
  const { sendRideRequest } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Changed from 'loading' to 'isSubmitting'
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_room: '',
    guest_phone: '',
    pickup_location: '',
    destination: '',
    special_requests: '',
    priority: 'normal' // Added priority to formData
  });

  // Helper function to generate a unique ride code
  const generateRideCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Helper function to get location name from ID
  const getLocationName = (locationId) => {
    for (const group of LOCATION_GROUPS) {
      for (const loc of group.locations) {
        if (loc.id === locationId) {
          return loc.name;
        }
      }
    }
    return locationId; // Fallback if not found
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.guest_name || !formData.pickup_location || !formData.destination) {
      toast.error('Please fill in all required fields');
      return;
    }

    // VALIDATION: Cannot go to same location
    if (formData.pickup_location === formData.destination) {
      toast.error('Pickup and destination cannot be the same location.');
      return;
    }

    // VALIDATION: Enforce destination restriction
    if (formData.pickup_location !== 'hotel-lobby' && formData.destination !== 'hotel-lobby') {
      toast.error('Rides from non-hotel locations must return to the hotel. This prevents misuse of the shuttle service.');
      return;
    }

    setIsSubmitting(true); // Start submitting process

    try {
      const newRide = {
        guest_name: formData.guest_name,
        guest_room: formData.guest_room,
        guest_phone: formData.guest_phone,
        pickup_location: formData.pickup_location,
        destination: formData.destination,
        special_requests: formData.special_requests,
        status: 'pending',
        priority: formData.priority, // Use priority from formData
        ride_code: generateRideCode(), // Use helper function
        public_access_token: crypto.randomUUID(),
        pending_timestamp: new Date().toISOString(),
        sms_consent_status: 'none'
      };

      console.log('Creating ride:', newRide);
      const createdRide = await Ride.create(newRide); // Pass constructed newRide object
      
      // 🔔 TRIGGER WEBHOOK: ride.created
      try {
        await webhookDispatcher({
          event: 'ride.created',
          data: {
            ride_id: createdRide.id,
            ride_code: createdRide.ride_code,
            guest_name: createdRide.guest_name,
            guest_room: createdRide.guest_room,
            guest_phone: createdRide.guest_phone,
            pickup_location: createdRide.pickup_location,
            destination: createdRide.destination,
            status: createdRide.status,
            priority: createdRide.priority,
            created_at: createdRide.created_date // Assuming created_date is added by backend
          }
        });
        console.log('✅ Webhook triggered for ride.created');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }

      toast.success(`Ride ${createdRide.ride_code} created successfully!`, {
        description: `${createdRide.guest_name} - ${getLocationName(createdRide.pickup_location)} → ${getLocationName(createdRide.destination)}`
      });

      setOpen(false); // Close the dialog
      setFormData({ // Reset form data
        guest_name: '',
        guest_room: '',
        guest_phone: '',
        pickup_location: '',
        destination: '',
        special_requests: '',
        priority: 'normal' // Reset priority
      });
      
      // Broadcast new ride via WebSocket
      if (sendRideRequest) {
        sendRideRequest(createdRide);
      }

      if (onRideCreated) {
        onRideCreated(createdRide);
      }
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error('Failed to create ride: ' + error.message); // More specific error message
    } finally {
      setIsSubmitting(false); // End submitting process
    }
  };

  // Get available destinations based on pickup
  const availableDestinations = formData.pickup_location === 'hotel-lobby' 
    ? LOCATION_GROUPS // All locations available
    : LOCATION_GROUPS.map(group => ({
        ...group,
        locations: group.locations.filter(loc => loc.id === 'hotel-lobby')
      })).filter(group => group.locations.length > 0); // Only hotel-lobby

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 font-semibold h-10">
          <Plus className="w-4 h-4 mr-2" />
          Create Ride
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Ride Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formData.pickup_location && formData.pickup_location !== 'hotel-lobby' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Policy:</strong> Non-hotel pickups must return to hotel. This prevents shuttle misuse.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guest_name">Guest Name *</Label>
              <Input
                id="guest_name"
                value={formData.guest_name}
                onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="guest_room">Room Number</Label>
              <Input
                id="guest_room"
                value={formData.guest_room}
                onChange={(e) => setFormData({...formData, guest_room: e.target.value})}
                placeholder="101"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="guest_phone">Contact Phone</Label>
            <Input
              id="guest_phone"
              type="tel"
              value={formData.guest_phone}
              onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({...formData, priority: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickup">Pickup Location *</Label>
              <Select 
                value={formData.pickup_location} 
                onValueChange={(value) => setFormData({
                  ...formData, 
                  pickup_location: value,
                  // Auto-set destination to hotel if picking up from non-hotel location
                  destination: value !== 'hotel-lobby' ? 'hotel-lobby' : formData.destination
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup..." />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="destination">Destination *</Label>
              <Select 
                value={formData.destination} 
                onValueChange={(value) => setFormData({...formData, destination: value})}
                disabled={formData.pickup_location && formData.pickup_location !== 'hotel-lobby'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    formData.pickup_location && formData.pickup_location !== 'hotel-lobby'
                      ? "Hotel Lobby (Required)"
                      : "Select destination..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="special_requests">Special Requests</Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
              placeholder="Wheelchair accessible, extra luggage, etc."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}> {/* Changed from 'loading' */}
              {isSubmitting ? 'Creating...' : 'Create Ride Request'} {/* Changed from 'loading' */}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
