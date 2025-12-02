import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import TimeSince from "../common/TimeSince";

const locationNames = {
  "main-entrance": "Main Entrance",
  "hotel-lobby": "Hotel Lobby", 
  "parking-garage": "Parking Garage",
  "conference-hall-a": "Conference Hall A",
  "conference-hall-b": "Conference Hall B",
  "exhibition-center": "Exhibition Center",
  "airport": "Airport",
  "downtown": "Downtown District",
  "shopping-center": "Shopping Center",
  "train-station": "Train Station",
  "restaurant-district": "Restaurant District",
  "tourist-attractions": "Tourist Attractions"
};

export default function RideRequests({ requests, onAcceptRide, hasCurrentRide }) {
  return (
    <Card className="shadow-lg border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Available Ride Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {requests.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No ride requests available</p>
              <p className="text-sm">New requests will appear here</p>
            </div>
          )}
          
          {requests.map((ride) => (
            <div key={ride.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{ride.guest_name}</p>
                    <p className="text-sm text-slate-600">Room {ride.guest_room}</p>
                    {ride.guest_phone && (
                      <p className="text-sm text-slate-600">{ride.guest_phone}</p>
                    )}
                  </div>
                </div>
                <TimeSince date={ride.created_date} prefix="Requested " className="text-xs" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">
                    {locationNames[ride.pickup_location] || ride.pickup_location}
                    <span className="mx-2 text-slate-400">→</span>
                    {locationNames[ride.destination] || ride.destination}
                  </span>
                </div>

                {ride.special_requests && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Special Requirements:</p>
                    <p className="text-sm text-amber-900">{ride.special_requests}</p>
                  </div>
                )}

                {ride.priority && ride.priority !== 'normal' && (
                  <Badge className="bg-red-100 text-red-800 border border-red-300">
                    {ride.priority.toUpperCase()} PRIORITY
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => onAcceptRide(ride)}
                disabled={hasCurrentRide}
                className={`w-full ${hasCurrentRide ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold h-11`}
              >
                {hasCurrentRide ? 'Complete Current Ride First' : 'Accept Ride Request'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}