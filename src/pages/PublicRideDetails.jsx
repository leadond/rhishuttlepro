import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Ride } from "@/api/appEntities";
import { Rating } from "@/api/appEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldX, Clock, User, Truck } from "lucide-react";

import RideTracker from "../components/guest/RideTracker";
import RatingForm from "../components/guest/RatingForm";

export default function PublicRideDetails() {
  const location = useLocation();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRide = useCallback(async (token) => {
    try {
      setLoading(true);
      const rides = await Ride.filter({ public_access_token: token }, null, 1);

      if (rides.length === 0) {
        setError("Ride not found. The link may be invalid.");
        return;
      }
      
      const currentRide = rides[0];

      if (currentRide.access_expires_at && new Date() > new Date(currentRide.access_expires_at)) {
        setError("This ride tracking link has expired.");
      } else {
        setRide(currentRide);
      }
    } catch (err) {
      setError("An error occurred while fetching ride details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      loadRide(token);
    } else {
      setError("No ride token provided.");
      setLoading(false);
    }
  }, [location.search, loadRide]);

  const handleRatingSubmit = async (ratingData) => {
    try {
      await Rating.create({
        ride_id: ride.id,
        driver_id: ride.assigned_driver,
        vehicle_id: ride.vehicle_number,
        ...ratingData,
        flagged_for_review: ratingData.rating <= 2
      });
      // Expire the link immediately after rating
      await Ride.update(ride.id, { access_expires_at: new Date().toISOString() });
      setError("Thank you for your feedback! This link has now expired.");
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Error submitting rating. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="max-w-md w-full text-center p-8">
          <ShieldX className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-600 mt-2">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg p-1">
            <img src="/src/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Shuttle Status</h1>
            <p className="text-slate-600">Ride Code: <span className="font-mono bg-slate-200 px-2 py-1 rounded">{ride.ride_code}</span></p>
          </div>
        </div>

        {ride.status === 'completed' && <RatingForm ride={ride} onSubmit={handleRatingSubmit} onSkip={() => setError("This link has expired.")} />}
        {(ride.status === 'assigned' || ride.status === 'in-progress') && <RideTracker ride={ride} onRideComplete={() => window.location.reload()} />}
        {ride.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Awaiting Driver</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-700 font-medium">We are currently assigning a driver for your ride.</p>
              <p className="text-slate-500">You will receive an SMS update shortly.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}