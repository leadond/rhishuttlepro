
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Truck, Clock, CheckCircle, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useSimulation } from "../components/contexts/SimulationContext";
import { toast } from "sonner";

export default function Dashboard() {
  const simulation = useSimulation();
  
  // Use data from simulation context
  const rides = simulation.rides;
  const vehicles = simulation.vehicles;
  const alerts = simulation.alerts;
  
  const [stats, setStats] = useState({
    totalRides: 0,
    pendingRides: 0,
    activeRides: 0,
    completedToday: 0,
    activeDrivers: 0,
    activeAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  const [dailyData, setDailyData] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);

  // Calculate stats from simulation data
  useEffect(() => {
    const pendingCount = rides.filter(r => r.status === 'pending').length;
    const activeCount = rides.filter(r => r.status === 'assigned' || r.status === 'in-progress').length;
    const today = new Date().toISOString().split('T')[0];
    const completedCount = rides.filter(r => 
      r.status === 'completed' && 
      r.completed_timestamp && 
      String(r.completed_timestamp).startsWith(today)
    ).length;
    
    // Active drivers = signed-in drivers from Driver table (simulation.drivers)
    // If simulation.drivers is empty, fallback to vehicles status
    const activeDrivers = simulation.drivers.length > 0 
      ? simulation.drivers.length 
      : vehicles.filter(v => v.status === 'available' || v.status === 'in-use').length;

    setStats({
      totalRides: pendingCount + activeCount, 
      pendingRides: pendingCount,
      activeRides: activeCount,
      completedToday: completedCount,
      activeDrivers: activeDrivers,
      activeAlerts: alerts.length
    });

    // --- Calculate Daily Data (Last 7 Days) ---
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const dailyStats = last7Days.map(dateStr => {
      const dayRides = rides.filter(r => r.created_date && r.created_date.startsWith(dateStr));
      const dayCompleted = rides.filter(r => r.status === 'completed' && r.completed_timestamp && r.completed_timestamp.startsWith(dateStr));
      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rides: dayRides.length,
        completed: dayCompleted.length
      };
    });
    setDailyData(dailyStats);

    // --- Calculate Popular Routes ---
    const routeCounts = {};
    rides.forEach(r => {
      if (r.pickup_location && r.destination) {
        const route = `${r.pickup_location} → ${r.destination}`;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      }
    });

    const sortedRoutes = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    setPopularRoutes(sortedRoutes);

    setLoading(false);
  }, [rides, vehicles, alerts, simulation.drivers]);

  // Get recent rides for display
  const recentRides = rides
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      guest: r.guest_name,
      status: r.status,
      time: new Date(r.updated_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      route: `${r.pickup_location} → ${r.destination}`
    }));

  const StatCard = ({ title, value, subtitle, icon: Icon, color, linkTo }) => (
    <Card className="shadow-lg hover:shadow-xl transition-all border-slate-200/80">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-bold text-slate-800 mt-2">{value}</p>
            {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
            {linkTo && (
              <Link to={linkTo} className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
                View details →
              </Link>
            )}
          </div>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color.replace('text', 'bg')}/10`}>
            <Icon className={`w-7 h-7 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Operations Dashboard</h1>
          <p className="text-slate-600 text-lg">
            Real-time overview of shuttle operations 
            {simulation.isActive && <Badge className="ml-2 bg-orange-100 text-orange-800">DEMO ACTIVE</Badge>}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Active Rides"
            value={stats.totalRides}
            subtitle="Pending, assigned, in-progress"
            icon={TrendingUp}
            color="text-blue-600"
            linkTo={createPageUrl("DispatcherControl")}
          />
          <StatCard
            title="Pending Rides"
            value={stats.pendingRides}
            subtitle="Awaiting assignment"
            icon={Clock}
            color="text-amber-600"
            linkTo={createPageUrl("DispatcherControl")}
          />
          <StatCard
            title="Active Rides"
            value={stats.activeRides}
            subtitle="Currently in service"
            icon={Truck}
            color="text-indigo-600"
            linkTo={createPageUrl("DispatcherControl")}
          />
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            subtitle="Successfully finished"
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatCard
            title="Active Drivers"
            value={stats.activeDrivers}
            subtitle="Currently on duty"
            icon={Users}
            color="text-purple-600"
            linkTo={createPageUrl("DispatcherControl")}
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            subtitle="Requires attention"
            icon={AlertTriangle}
            color="text-red-600"
            linkTo={createPageUrl("DispatcherControl")}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daily Ride Volume (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rides" stroke="#3b82f6" strokeWidth={2} name="Total Rides" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top 5 Popular Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularRoutes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="route" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Ride Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRides.length > 0 ? (
                recentRides.map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{ride.guest}</p>
                        <p className="text-sm text-slate-600">{ride.route}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">{ride.time}</span>
                      <Badge className={getStatusColor(ride.status)}>
                        {ride.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">No recent ride activity to display.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link to={createPageUrl("DispatcherControl")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Truck className="w-4 h-4 mr-2" />
                Dispatcher Control
              </Button>
            </Link>
            <Link to={createPageUrl("TVMonitor")}>
              <Button variant="outline">
                View TV Monitor
              </Button>
            </Link>
            <Link to={createPageUrl("DriverDashboard")}>
              <Button variant="outline">
                Driver Dashboard
              </Button>
            </Link>
            <Link to={createPageUrl("GuestPortal")}>
              <Button variant="outline">
                Guest Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
