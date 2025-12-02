import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DriverAlerts({ alerts }) {
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <Card className="shadow-lg bg-red-50 border-red-300">
      <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-t-lg pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          Active Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {alerts.map((alert) => (
          <div key={alert.id} className="border border-red-300 rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-red-900 capitalize text-sm">
                  {alert.alert_type ? alert.alert_type.replace('-', ' ') : 'Alert'}
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {alert.created_date ? formatDistanceToNow(new Date(alert.created_date), { addSuffix: true }) : 'Just now'}
                </p>
              </div>
              <Badge className={`${getPriorityColor(alert.priority)} border text-xs`}>
                {alert.priority ? alert.priority.toUpperCase() : 'HIGH'}
              </Badge>
            </div>
            <p className="text-red-900 text-sm font-medium">{alert.message || 'Emergency alert'}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}