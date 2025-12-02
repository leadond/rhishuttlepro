import React, { useState, useEffect, useCallback } from "react";
import { Ride, Rating } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Phone, Shield, CheckCircle2, ArrowRight, Bot, ClipboardEdit } from "lucide-react";
import { toast } from "sonner";

import GuestLogin from "../components/guest/GuestLogin";
import RideTracker from "../components/guest/RideTracker";
import RatingForm from "../components/guest/RatingForm";
import GuestChat from "../components/guest/GuestChat";
import { LOCATION_GROUPS, getLocationName } from "../components/common/LocationData";
import { useBranding } from "@/contexts/BrandingContext";

export default function GuestPortal() {
  const [currentStep, setCurrentStep] = useState('login');
  const [guestInfo, setGuestInfo] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [bookingMethod, setBookingMethod] = useState('choice');
  const [rideRequest, setRideRequest] = useState({
    pickup_location: '',
    destination: '',
    special_requests: ''
  });
  const { branding } = useBranding();
  
  // Get branded values with fallbacks
  const appName = branding?.enableCustomBranding && branding?.appName ? branding.appName : 'Shuttle Pro';
  const logoUrl = branding?.enableCustomBranding && branding?.logoUrl ? branding.logoUrl : '/src/assets/logo.png';
  const tagline = branding?.enableCustomBranding && branding?.tagline ? branding.tagline : 'Professional transportation services.';

  const loadGuestRide = useCallback(async () => {
    if (!guestInfo) return;
    
    try {
      const rides = await Ride.filter({
        guest_name: guestInfo.name,
        guest_room: guestInfo.room
      }, '-created_date', 1); // Get the most recent ride
      
      if (rides.length > 0) {
        const ride = rides[0];
        setCurrentRide(ride);
        
        if (ride.status === 'completed') {
          // Check if this completed ride has been rated
          const ratings = await Rating.filter({ ride_id: ride.id });
          if (ratings.length > 0) {
            // Already rated, go back to login/new booking
            setCurrentStep('login');
            setCurrentRide(null);
            setGuestInfo(null);
            toast.info("Thank you for your previous feedback!");
          } else {
            // Completed but not rated, ask for rating
            setCurrentStep('rating');
          }
        } else if (ride.status === 'pending' || ride.status === 'assigned' || ride.status === 'in-progress') {
          setCurrentStep('tracking');
        } else if (ride.status === 'cancelled') {
          // If cancelled and not rated (shouldn't be, but as a fallback)
          const ratings = await Rating.filter({ ride_id: ride.id });
          setCurrentStep(ratings.length > 0 ? 'booking' : 'rating'); // If rated, allow new booking, else prompt rating (if policy allows cancelled rides to be rated)
          if (ratings.length > 0) setBookingMethod('choice'); // If already rated for a cancelled ride, then enable new booking choice
        } else {
          // Default to booking if status is unknown or requires new booking
          setCurrentStep('booking');
          setBookingMethod('choice');
        }
      } else {
        // No active rides found, allow new booking
        setCurrentStep('booking');
        setBookingMethod('choice');
      }
    } catch (error) {
      console.error('Error loading guest ride:', error);
      toast.error('Could not load ride information. Please try booking a new ride.');
      setCurrentStep('booking');
      setBookingMethod('choice');
    }
  }, [guestInfo]);

  useEffect(() => {
    if (guestInfo) {
      loadGuestRide();
    }
  }, [guestInfo, loadGuestRide]);

  const handleLogin = (info) => {
    setGuestInfo(info);
    setBookingMethod('choice');
  };

  const handleRideRequest = async () => {
    if (!rideRequest.pickup_location || !rideRequest.destination) {
      toast.warning('Please select both pickup location and destination.');
      return;
    }

    // VALIDATION: Cannot go to same location
    if (rideRequest.pickup_location === rideRequest.destination) {
      toast.error('Pickup and destination cannot be the same location.');
      return;
    }

    // VALIDATION: Enforce destination restriction
    if (rideRequest.pickup_location !== 'hotel-lobby' && rideRequest.destination !== 'hotel-lobby') {
      toast.error('Rides from non-hotel locations must return to the hotel.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const ride = await Ride.create({
        guest_name: guestInfo.name,
        guest_room: guestInfo.room,
        guest_phone: guestInfo.phone || '',
        pickup_location: rideRequest.pickup_location,
        destination: rideRequest.destination,
        special_requests: rideRequest.special_requests,
        status: 'pending',
        pickup_time: now, // Initial pickup time, might be updated by driver
        pending_timestamp: now, // Timestamp when ride entered 'pending' status
        ride_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        public_access_token: crypto.randomUUID(),
        sms_consent_status: 'none',
        is_archived: false // New field for archiving old rides
      });

      console.log('✅ Ride created in database:', ride.id);
      setCurrentRide(ride);
      setCurrentStep('tracking');
      toast.success('Your shuttle has been requested! You will be notified when a driver is assigned.');
      setRideRequest({ pickup_location: '', destination: '', special_requests: '' });
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error('Error requesting ride. Please try again.');
    }
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      await Rating.create({
        ride_id: currentRide.id,
        driver_id: currentRide.assigned_driver,
        vehicle_id: currentRide.vehicle_number,
        ...ratingData,
        flagged_for_review: ratingData.rating <= 2
      });

      toast.success('Thank you for your feedback!');
      setCurrentStep('login');
      setCurrentRide(null);
      setGuestInfo(null);
      setBookingMethod('choice');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Error submitting rating. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const statusStr = status ?? '';
    switch(statusStr) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'login':
        return <GuestLogin onLogin={handleLogin} />;
      case 'booking':
        if (bookingMethod === 'ai') {
            return <GuestChat guestInfo={guestInfo} onBack={() => setBookingMethod('choice')} onRideCreated={(ride) => {
              setCurrentRide(ride);
              setCurrentStep('tracking');
              toast.success('Your shuttle has been requested via AI! You will be notified when a driver is assigned.');
            }} />;
        }
        if (bookingMethod === 'form') {
            // Get available destinations based on pickup
            const availableDestinations = rideRequest.pickup_location === 'hotel-lobby' 
              ? LOCATION_GROUPS // All locations available
              : LOCATION_GROUPS.map(group => ({
                  ...group,
                  locations: group.locations.filter(loc => loc.id === 'hotel-lobby')
                })).filter(group => group.locations.length > 0); // Only hotel-lobby
            return (
              <Card className="shadow-2xl border-slate-200/80 animate-fade-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-slate-900">Request a Shuttle</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setBookingMethod('choice')}>Change Method</Button>
                  </div>
                  <p className="text-slate-500 font-medium mt-1">
                    Welcome, {guestInfo?.name} • Room {guestInfo?.room}
                  </p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {rideRequest.pickup_location && rideRequest.pickup_location !== 'hotel-lobby' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        ℹ️ <strong>Note:</strong> Rides from non-hotel locations must return to the hotel. This shuttle service is for hotel guests traveling to/from the hotel.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-800">Pickup Location</Label>
                      <Select value={rideRequest.pickup_location} onValueChange={(value) => {
                        setRideRequest(prev => ({
                          ...prev, 
                          pickup_location: value,
                          // Auto-set destination to hotel if picking up from non-hotel location
                          destination: value !== 'hotel-lobby' ? 'hotel-lobby' : prev.destination
                        }));
                      }}>
                        <SelectTrigger className="h-12 text-base border-slate-300 focus:ring-primary">
                          <SelectValue placeholder="Select pickup..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATION_GROUPS.map((group) => (
                            <SelectGroup key={group.label}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {group.locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id} className="text-base py-2">
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-800">Destination</Label>
                      <Select 
                        value={rideRequest.destination} 
                        onValueChange={(value) => setRideRequest(prev => ({...prev, destination: value}))}
                        disabled={rideRequest.pickup_location && rideRequest.pickup_location !== 'hotel-lobby'}
                      >
                        <SelectTrigger className="h-12 text-base border-slate-300 focus:ring-primary">
                          <SelectValue placeholder={
                            rideRequest.pickup_location && rideRequest.pickup_location !== 'hotel-lobby'
                              ? "Hotel Lobby (Required)"
                              : "Select destination..."
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDestinations.map((group) => (
                            <SelectGroup key={group.label}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {group.locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id} className="text-base py-2">
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-800">Special Requirements (Optional)</Label>
                    <Textarea
                      placeholder="e.g., wheelchair accessibility, extra luggage..."
                      value={rideRequest.special_requests}
                      onChange={(e) => setRideRequest(prev => ({...prev, special_requests: e.target.value}))}
                      className="h-24 text-base border-slate-300 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleRideRequest}
                      className="w-full h-12 text-base font-semibold bg-primary hover:opacity-90 text-primary-foreground shadow-md"
                    >
                      Request Shuttle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
        }
        return (
            <Card className="shadow-2xl border-slate-200/80 animate-fade-in">
                 <CardHeader>
                    <div className="text-center">
                        <CardTitle className="text-2xl font-bold text-slate-900">How would you like to book?</CardTitle>
                        <p className="text-slate-500 font-medium mt-1">
                          Welcome, {guestInfo?.name}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 grid md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setBookingMethod('ai')}
                      className="text-left p-6 border rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Bot className="w-6 h-6 text-primary"/>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">AI Assistant</h3>
                        </div>
                        <p className="text-sm text-slate-600">Chat with our AI bot to quickly book your ride.</p>
                    </button>
                     <button
                       onClick={() => setBookingMethod('form')}
                       className="text-left p-6 border rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                     >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                <ClipboardEdit className="w-6 h-6 text-slate-600"/>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Classic Form</h3>
                        </div>
                        <p className="text-sm text-slate-600">Fill out a simple form to schedule your shuttle.</p>
                    </button>
                </CardContent>
            </Card>
        );
      case 'tracking':
        return currentRide && (
          <div className="space-y-6 animate-fade-in">
            <Card className="shadow-2xl border-slate-200/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-slate-900">Your Shuttle Request</CardTitle>
                  <Badge className={`${getStatusColor(currentRide.status)} px-3 py-1 text-sm font-semibold border`}>
                    {(currentRide.status ?? 'unknown').replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-slate-500">
                  {currentRide.status === 'pending' && "We are finding you a driver. Please wait..."}
                  {currentRide.status === 'assigned' && "Your driver is on the way!"}
                  {currentRide.status === 'in-progress' && "Your ride is in progress."}
                  {currentRide.status === 'cancelled' && "Your ride has been cancelled."}
                  {currentRide.status === 'completed' && "Your ride has been completed."}
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">FROM</p>
                      <p className="font-semibold text-slate-800">{getLocationName(currentRide.pickup_location)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">TO</p>
                      <p className="font-semibold text-slate-800">{getLocationName(currentRide.destination)}</p>
                    </div>
                  </div>
                </div>
                {currentRide.special_requests && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-1">Special Requirements Noted:</p>
                    <p className="font-medium text-amber-900">{currentRide.special_requests}</p>
                  </div>
                )}
                {(currentRide.status === 'assigned' || currentRide.status === 'in-progress') && currentRide.assigned_driver && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">Driver Assigned:</p>
                    <p className="font-semibold text-primary">{currentRide.assigned_driver}</p>
                    <p className="text-primary/80">Vehicle: {currentRide.vehicle_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {currentRide.status !== 'pending' && currentRide.status !== 'cancelled' && (
              <RideTracker ride={currentRide} onRideComplete={() => {
                loadGuestRide();
              }} />
            )}
          </div>
        );
      case 'rating':
        return currentRide && (
          <RatingForm 
            ride={currentRide} 
            onSubmit={handleRatingSubmit}
            onSkip={() => {
              setCurrentStep('login');
              setCurrentRide(null);
              setGuestInfo(null);
              setBookingMethod('choice');
              toast.info("Thank you for using our service!");
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg p-1 border border-primary/20">
               <img src={logoUrl} alt={`${appName} Logo`} className="w-full h-full object-contain" />
            </div>
             <h1 className="text-4xl font-extrabold text-primary tracking-tight">{appName}</h1>
          </div>
          <p className="text-lg text-slate-600">{tagline}</p>
        </header>

        <div className="transition-all duration-300">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
