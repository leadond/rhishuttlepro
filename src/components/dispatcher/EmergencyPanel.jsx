import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Clock, CheckCircle2, User, MessageSquare, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EmergencyPanel({ alerts, onResolveAlert, onSendAlert, negativeRatings, onAcknowledgeRating }) {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('general');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSendAlert = () => {
    if (!alertMessage.trim()) {
      toast.error("Please enter an alert message.");
      return;
    }
    onSendAlert(alertType, alertMessage);
    setAlertMessage('');
    setAlertType('general');
    setDialogOpen(false);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Emergency Alerts ({alerts.length})
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white text-red-600 hover:bg-red-50">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Broadcast Alert
                </Button>
              </DialogTrigger>
              <DialogContent style={{ zIndex: 10000 }}>
                <DialogHeader>
                  <DialogTitle>Broadcast Emergency Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="alert-message">Alert Message</Label>
                    <Textarea
                      id="alert-message"
                      placeholder="Enter emergency alert message..."
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      className="h-24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alert-type">Alert Type</Label>
                    <select
                      id="alert-type"
                      value={alertType}
                      onChange={(e) => setAlertType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="general">General Alert</option>
                      <option value="weather">Weather Alert</option>
                      <option value="security">Security Alert</option>
                      <option value="medical">Medical Emergency</option>
                      <option value="vehicle-breakdown">Vehicle Issue</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendAlert} className="bg-red-600 hover:bg-red-700">
                    Send Alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-red-200 rounded-lg p-4 bg-red-50 shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900 capitalize">{alert.alert_type.replace('-', ' ')}</p>
                      {alert.driver_id && (
                        <p className="text-sm text-red-700">Driver: {alert.driver_id}</p>
                      )}
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getPriorityColor(alert.priority)} border font-semibold`}>
                    {alert.priority.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-red-900 mb-3 font-medium">{alert.message}</p>

                {alert.location_lat && alert.location_lng && (
                  <div className="flex items-center gap-2 text-sm text-red-700 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>Location: {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-red-200">
                  <div className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    Alert ID: {alert.id.slice(-8)}
                  </div>
                  <Button
                    onClick={() => onResolveAlert(alert.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Acknowledge & Resolve
                  </Button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>No active emergency alerts</p>
                <p className="text-sm">System is operating normally</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="w-5 h-5" />
            Flagged Ratings ({negativeRatings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {negativeRatings.map((rating) => (
              <div key={rating.id} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-amber-900">Ride #{rating.ride_id ? rating.ride_id.slice(-8) : 'N/A'}</p>
                    <p className="text-sm text-amber-700">Driver: {rating.driver_id}</p>
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(rating.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                    ⭐ {rating.rating}/5
                  </Badge>
                </div>

                {rating.comments && (
                  <p className="text-amber-900 text-sm mb-3 italic">"{rating.comments}"</p>
                )}

                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-amber-600 font-medium">Service</p>
                    <p className="text-amber-900">⭐ {rating.service_quality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-amber-600 font-medium">Punctuality</p>
                    <p className="text-amber-900">⭐ {rating.punctuality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-amber-600 font-medium">Vehicle</p>
                    <p className="text-amber-900">⭐ {rating.vehicle_condition || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-amber-200">
                  <Button
                    onClick={() => onAcknowledgeRating(rating.id)}
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                </div>
              </div>
            ))}
            {negativeRatings.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>No flagged ratings - all reviews are positive!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}