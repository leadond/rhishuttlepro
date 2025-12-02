
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Clock, Star, BarChart3 } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard({ rides, vehicles, ratings }) {
  // Calculate ride statistics
  const rideStats = useMemo(() => {
    const total = rides.length;
    const completed = rides.filter(r => r.status === 'completed').length;
    const cancelled = rides.filter(r => r.status === 'cancelled').length;
    const inProgress = rides.filter(r => r.status === 'in-progress' || r.status === 'assigned').length;
    const pending = rides.filter(r => r.status === 'pending').length;
    
    return {
      total,
      completed,
      cancelled,
      inProgress,
      pending,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
    };
  }, [rides]);

  // Rides by status for pie chart
  const ridesByStatus = useMemo(() => [
    { name: 'Completed', value: rideStats.completed },
    { name: 'In Progress', value: rideStats.inProgress },
    { name: 'Pending', value: rideStats.pending },
    { name: 'Cancelled', value: rideStats.cancelled }
  ].filter(item => item.value > 0), [rideStats]);

  // Popular routes analysis
  const popularRoutes = useMemo(() => {
    const routeCounts = {};
    rides.forEach(ride => {
      const route = `${ride.pickup_location} → ${ride.destination}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });
    
    return Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ 
        route: route.length > 30 ? route.substring(0, 27) + '...' : route, 
        count 
      }));
  }, [rides]);

  // Daily ride volume (last 7 days)
  const dailyRideVolume = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRides = rides.filter(ride => {
        if (!ride.created_date) return false;
        const rideDate = new Date(ride.created_date).toISOString().split('T')[0];
        return rideDate === dateStr;
      });
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rides: dayRides.length,
        completed: dayRides.filter(r => r.status === 'completed').length
      });
    }
    
    return last7Days;
  }, [rides]);

  // Vehicle utilization
  const vehicleUtilization = useMemo(() => {
    return vehicles.map(vehicle => {
      const vehicleRides = rides.filter(r => r.vehicle_number === vehicle.shuttle_number);
      return {
        name: vehicle.shuttle_number,
        rides: vehicleRides.length,
        status: vehicle.status
      };
    }).sort((a, b) => b.rides - a.rides);
  }, [vehicles, rides]);

  // Rating statistics
  const ratingStats = useMemo(() => {
    if (ratings.length === 0) return { average: 0, distribution: [] };
    
    const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
    const average = (total / ratings.length).toFixed(1);
    
    const distribution = [1, 2, 3, 4, 5].map(star => ({
      star: `${star} ⭐`,
      count: ratings.filter(r => r.rating === star).length
    }));
    
    return { average, distribution };
  }, [ratings]);

  // Average ratings by category
  const categoryRatings = useMemo(() => {
    if (ratings.length === 0) return [];
    
    const categories = ['service_quality', 'punctuality', 'vehicle_condition'];
    return categories.map(category => ({
      category: category.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      rating: (ratings.reduce((sum, r) => sum + (r[category] || 0), 0) / ratings.length).toFixed(1)
    }));
  }, [ratings]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
            {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text', 'bg')}/10`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-slate-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Data Available</p>
            <p className="text-sm">Analytics will appear once rides are completed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rides"
          value={rideStats.total}
          subtitle={`${rideStats.completed} completed`}
          icon={TrendingUp}
          color="text-blue-600"
        />
        <StatCard
          title="Completion Rate"
          value={`${rideStats.completionRate}%`}
          subtitle={`${rideStats.cancelled} cancelled`}
          icon={Clock}
          color="text-green-600"
        />
        <StatCard
          title="Average Rating"
          value={ratingStats.average}
          subtitle={`${ratings.length} reviews`}
          icon={Star}
          color="text-yellow-600"
        />
        <StatCard
          title="Active Vehicles"
          value={vehicles.filter(v => v.status !== 'offline' && v.status !== 'maintenance').length}
          subtitle={`of ${vehicles.length} total`}
          icon={Users}
          color="text-indigo-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ride Status Distribution */}
        {ridesByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ride Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ridesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ridesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Daily Ride Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Ride Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyRideVolume}>
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

        {/* Popular Routes */}
        {popularRoutes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Popular Routes</CardTitle>
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
        )}

        {/* Vehicle Utilization */}
        {vehicleUtilization.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vehicleUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rides" fill="#8b5cf6" name="Total Rides" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Rating Distribution */}
        {ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingStats.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="star" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Ratings */}
        {ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Average Ratings by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryRatings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="rating" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
