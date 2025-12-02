import React, { useState, useEffect } from "react";

import { UserEntity, Rating } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, Shield, Truck, Plus, Trash2, Edit, Check, X, AlertCircle, Webhook as WebhookIcon, Key, Copy, RefreshCw, CheckCircle2, CheckCircle, Activity, Palette } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { createUser } from "@/api/functions";
import { updateUserPassword } from "@/api/functions";
import { registerWebhook } from "@/api/functions";
import FeatureManagement from "../components/admin/FeatureManagement";
import RolesManagement from "../components/admin/RolesManagement";
import VehicleManagement from "../components/admin/VehicleManagement";
import CustomerOnboarding from "../components/admin/CustomerOnboarding";
import BrandingSettings from "../components/admin/BrandingSettings";
import { useAuth } from "@/components/contexts/AuthContext";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', roles: [] });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('users');
  const [webhooks, setWebhooks] = useState([]);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: [],
    description: ''
  });
  const [webhookLogs, setWebhookLogs] = useState([]); // New state
  const [showLogs, setShowLogs] = useState(false); // New state
  const { user: currentUser } = useAuth();
  
  // Role hierarchy helpers
  // Master Admin: Full system access - manages all tenants, features, webhooks, API keys
  // Hotel Admin: Tenant-level access - manages users, vehicles, branding for their property
  const isMasterAdmin = currentUser?.roles?.includes('master_admin');
  const isHotelAdmin = currentUser?.roles?.includes('admin') && !isMasterAdmin;

  useEffect(() => {
    fetchUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    // try {
    //   const user = await base44.auth.me(); // Handled by useAuth
    //   setCurrentUser(user);
    // } catch (error) {
    //   console.error('Error loading user:', error);
    // }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await UserEntity.list();
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'webhooks' && currentUser) {
      loadWebhooks();
    }
  }, [selectedTab, currentUser]);

  const generateApiKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setApiKey(key);
    setCopied(false);
    toast.success('New API key generated!');
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success('API key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await createUser({
        full_name: newUser.full_name,
        email: newUser.email,
        password: newUser.password,
        roles: newUser.roles
      });

      if (response && response.user) {
        toast.success('User created successfully!');
        setShowCreateDialog(false);
        setNewUser({ full_name: '', email: '', password: '', roles: [] });
        fetchUsers();
      } else {
        toast.error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await UserEntity.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const toggleRole = (role) => {
    setNewUser(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'master_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'dispatcher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'driver': return 'bg-green-100 text-green-800 border-green-200';
      case 'monitor': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const loadWebhooks = async () => {
    if (!currentUser) return;
    try {
      console.log('🔄 Loading webhooks...');
      const response = await registerWebhook({
        action: 'list'
      });
      
      console.log('📦 Webhook list response:', response.data);
      
      if (response.success) {
        console.log('✅ Loaded webhooks:', response.webhooks);
        setWebhooks(response.webhooks);
        toast.success(`Loaded ${response.webhooks.length} webhook(s)`);
      } else {
        console.error('❌ Error loading webhooks:', response.error);
        toast.error('Failed to load webhooks: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error loading webhooks:', error);
      toast.error('Failed to load webhooks: ' + error.message);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.url || webhookForm.events.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }

    try {
      console.log('Creating webhook with data:', webhookForm);
      
      const response = await registerWebhook({
        action: 'create',
        url: webhookForm.url,
        events: webhookForm.events,
        description: webhookForm.description
      });

      console.log('Webhook creation response:', response);

      if (response.success) {
        toast.success('Webhook registered successfully!');
        toast.info(`Secret: ${response.webhook.secret}`, {
          duration: 10000,
          description: 'Save this secret - you need it to verify webhook signatures'
        });
        
        setShowWebhookForm(false);
        setWebhookForm({ url: '', events: [], description: '' });
        
        // Wait 2 seconds then reload to ensure database commit
        setTimeout(() => {
          console.log('🔄 Reloading webhooks after creation...');
          loadWebhooks();
        }, 2000);
      } else {
        toast.error(response.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Failed to create webhook: ' + error.message);
    }
  };

  const handleTestWebhook = async (webhookId) => {
    try {
      const response = await registerWebhook({
        action: 'test',
        webhookId
      });

      if (response.success) {
        toast.success('Test webhook delivered successfully!', {
          description: `Status: ${response.status_code || 200}`,
          duration: 5000
        });
      } else {
        toast.error(`Test failed: ${response.error}`);
      }
      
      loadWebhooks();
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook: ' + error.message);
    }
  };

  const handleToggleWebhook = async (webhookId, currentStatus) => {
    try {
      await registerWebhook({
        action: 'update',
        webhookId,
        is_active: !currentStatus
      });

      toast.success(`Webhook ${!currentStatus ? 'enabled' : 'disabled'}`);
      loadWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Failed to update webhook: ' + error.message);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await registerWebhook({
        action: 'delete',
        webhookId
      });

      toast.success('Webhook deleted');
      loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook: ' + error.message);
    }
  };

  const toggleEvent = (event) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const availableEvents = [
    { value: 'ride.created', label: 'Ride Created', description: 'New ride request submitted' },
    { value: 'ride.assigned', label: 'Ride Assigned', description: 'Driver assigned to ride' },
    { value: 'ride.in_progress', label: 'Ride In Progress', description: 'Guest picked up' },
    { value: 'ride.completed', label: 'Ride Completed', description: 'Ride finished' },
    { value: 'ride.cancelled', label: 'Ride Cancelled', description: 'Ride was cancelled' },
    { value: 'vehicle.status_changed', label: 'Vehicle Status', description: 'Vehicle status updated' },
    { value: 'alert.created', label: 'Alert Created', description: 'Emergency alert triggered' },
    { value: 'rating.submitted', label: 'Rating Submitted', description: 'Guest submitted rating' }
  ];

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600"/>
            Admin Panel
          </h1>
          <p className="text-slate-600 mt-2">Manage users, roles, and system settings</p>
        </header>

        {/* Role Info Banner */}
        {isMasterAdmin && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-900">Master Admin Access</p>
                <p className="text-sm text-purple-700">You have full system access including webhooks, features, and API management.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white p-1.5 rounded-lg shadow-md border border-slate-200">
          <div className="flex gap-1 flex-wrap">
              {/* Hotel Admin Tabs - Available to all admins */}
              <Button
                onClick={() => setSelectedTab('users')}
                variant="ghost"
                className={`flex-1 h-11 font-semibold ${selectedTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
              <Button
                onClick={() => setSelectedTab('roles')}
                variant="ghost"
                className={`flex-1 h-11 font-semibold ${selectedTab === 'roles' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                <UserCog className="w-4 h-4 mr-2" />
                Roles
              </Button>
              <Button
                onClick={() => setSelectedTab('vehicles')}
                variant="ghost"
                className={`flex-1 h-11 font-semibold ${selectedTab === 'vehicles' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                <Truck className="w-4 h-4 mr-2" />
                Vehicles
              </Button>
              {/* Branding - Available to all admins */}
              <Button
                onClick={() => setSelectedTab('branding')}
                variant="ghost"
                className={`flex-1 h-11 font-semibold ${selectedTab === 'branding' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                <Palette className="w-4 h-4 mr-2" />
                Branding
              </Button>
              <Button
                onClick={() => setSelectedTab('onboarding')}
                variant="ghost"
                className={`flex-1 h-11 font-semibold ${selectedTab === 'onboarding' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Onboarding
              </Button>
              
              {/* Master Admin Only Tabs - System configuration */}
              {isMasterAdmin && (
                <>
                  <Button
                    onClick={() => setSelectedTab('webhooks')}
                    variant="ghost"
                    className={`flex-1 h-11 font-semibold ${selectedTab === 'webhooks' ? 'bg-purple-700 text-white' : 'text-purple-600 bg-purple-50'}`}
                  >
                    <WebhookIcon className="w-4 h-4 mr-2" />
                    Webhooks
                  </Button>
                  <Button
                    onClick={() => setSelectedTab('features')}
                    variant="ghost"
                    className={`flex-1 h-11 font-semibold ${selectedTab === 'features' ? 'bg-purple-700 text-white' : 'text-purple-600 bg-purple-50'}`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Features
                  </Button>
                </>
              )}
          </div>
        </div>

        {/* Branding Settings Tab */}
        {selectedTab === 'branding' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                White Label Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BrandingSettings />
            </CardContent>
          </Card>
        )}

        {selectedTab === 'onboarding' && (
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Customer Onboarding</CardTitle></CardHeader>
            <CardContent>
              <CustomerOnboarding />
            </CardContent>
          </Card>
        )}

        {selectedTab === 'users' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* User Management */}
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  User Management
                </CardTitle>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={newUser.full_name}
                          onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          placeholder="Secure password"
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Roles</Label>
                        <div className="flex gap-2 flex-wrap">
                          {/* Master Admin can assign all roles including master_admin */}
                          {(isMasterAdmin ? ['master_admin', 'admin', 'dispatcher', 'driver', 'monitor'] : ['admin', 'dispatcher', 'driver', 'monitor']).map((role) => (
                            <Badge
                              key={role}
                              className={`cursor-pointer ${newUser.roles.includes(role) ? getRoleBadgeColor(role) : 'bg-slate-100 text-slate-600'}`}
                              onClick={() => toggleRole(role)}
                            >
                              {role === 'master_admin' ? 'Master Admin' : role}
                            </Badge>
                          ))}
                        </div>
                        {!isMasterAdmin && (
                          <p className="text-xs text-slate-500 mt-2">
                            Note: Only Master Admins can assign the Master Admin role.
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser}>
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <div className="flex gap-1 mt-1">
                          {user.roles?.map((role) => (
                            <Badge key={role} className={getRoleBadgeColor(role)}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* API Key Generator - Master Admin Only */}
            {isMasterAdmin && (
              <Card className="shadow-lg border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-purple-600" />
                    API Key Generator
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 ml-2">Master Admin</Badge>
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Generate secure API keys for external integrations. Use these keys to authenticate requests to your Shuttle Pro API endpoints.
                </p>
                
                <Button 
                  onClick={generateApiKey} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New API Key
                </Button>

                {apiKey && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Generated API Key:</Label>
                    <div className="relative">
                      <Input
                        value={apiKey}
                        readOnly
                        className="font-mono text-xs pr-10"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyApiKey}
                        className="absolute right-1 top-1 h-7 w-7"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        <strong>⚠️ Important:</strong> Copy this key now and store it securely. You'll need to add it as <code className="bg-amber-100 px-1 rounded">EXTERNAL_API_KEY</code> in your environment variables.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">How to use:</p>
                  <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                    <li>Generate a new API key using the button above</li>
                    <li>Copy the generated key</li>
                    <li>Go to Settings → Environment Variables</li>
                    <li>Add a new secret: <code className="bg-blue-100 px-1 rounded">EXTERNAL_API_KEY</code></li>
                    <li>Paste the generated key as the value</li>
                    <li>Use this key in your external app's API requests</li>
                  </ol>
                </div>
                </CardContent>
                </Card>
                )}
                </div>
                )}

        {selectedTab === 'roles' && (
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Role Management</CardTitle></CardHeader>
            <CardContent>
              <RolesManagement isOwner={isMasterAdmin} />
            </CardContent>
          </Card>
        )}

        {selectedTab === 'vehicles' && (
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Vehicle Management</CardTitle></CardHeader>
            <CardContent>
              <VehicleManagement />
            </CardContent>
          </Card>
        )}

        {selectedTab === 'features' && isMasterAdmin && (
          <Card className="shadow-lg border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                Feature Management
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 ml-2">Master Admin</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeatureManagement />
            </CardContent>
          </Card>
        )}

        {selectedTab === 'webhooks' && isMasterAdmin && (
          <Card className="shadow-lg border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                Webhook Management
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 ml-2">Master Admin</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={loadWebhooks} 
                  variant="outline"
                  className="bg-white hover:bg-slate-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh List
                </Button>
                <Button onClick={() => setShowWebhookForm(!showWebhookForm)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Real-time webhook status */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">Webhook System Status</p>
                      <p className="text-xs text-green-700">
                        {webhooks.filter(w => w.is_active).length} active webhook(s) • 
                        {webhooks.reduce((sum, w) => sum + (w.total_deliveries || 0), 0)} total deliveries
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-semibold text-green-900">Online</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook form */}
              {showWebhookForm && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                  <div>
                    <Label htmlFor="webhook_url">Webhook URL *</Label>
                    <Input
                      id="webhook_url"
                      placeholder="https://your-app.com/webhooks/shuttle-pro"
                      value={webhookForm.url}
                      onChange={(e) => setWebhookForm({...webhookForm, url: e.target.value})}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Must be a valid HTTPS URL that can receive POST requests
                    </p>
                  </div>

                  <div>
                    <Label>Events to Subscribe * (Select at least one)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {availableEvents.map(event => (
                        <div key={event.value} className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            id={event.value}
                            checked={webhookForm.events.includes(event.value)}
                            onChange={() => toggleEvent(event.value)}
                            className="mt-1"
                          />
                          <label htmlFor={event.value} className="cursor-pointer flex-1">
                            <p className="font-medium text-sm text-slate-900">{event.label}</p>
                            <p className="text-xs text-slate-500">{event.description}</p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="webhook_desc">Description (Optional)</Label>
                    <Input
                      id="webhook_desc"
                      placeholder="e.g., Production integration with CRM system"
                      value={webhookForm.description}
                      onChange={(e) => setWebhookForm({...webhookForm, description: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateWebhook} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Webhook
                    </Button>
                    <Button onClick={() => setShowWebhookForm(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Webhook list */}
              <div className="space-y-3">
                {webhooks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <WebhookIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-700">No webhooks registered yet</p>
                    <p className="text-sm">Click "Register Webhook" to get started</p>
                  </div>
                ) : (
                  webhooks.map(webhook => (
                    <div key={webhook.id} className="p-5 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* URL and Status */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <code className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                              {webhook.url}
                            </code>
                            <Badge className={webhook.is_active ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}>
                              {webhook.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Disabled
                                </>
                              )}
                            </Badge>
                            {webhook.failure_count > 0 && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {webhook.failure_count} failure{webhook.failure_count > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Description */}
                          {webhook.description && (
                            <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                              {webhook.description}
                            </p>
                          )}

                          {/* Events */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Subscribed Events:</p>
                            <div className="flex flex-wrap gap-2">
                              {webhook.events.map(event => (
                                <Badge key={event} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <Activity className="w-3 h-3 mr-1" />
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
                            <div>
                              <p className="text-xs text-slate-500">Total Deliveries</p>
                              <p className="text-lg font-bold text-slate-900">{webhook.total_deliveries || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Failure Count</p>
                              <p className="text-lg font-bold text-slate-900">{webhook.failure_count || 0}</p>
                            </div>
                            <div className="col-span-2">
                              {webhook.last_triggered_at ? (
                                <>
                                  <p className="text-xs text-slate-500">Last Triggered</p>
                                  <p className="text-sm font-medium text-slate-700">
                                    {new Date(webhook.last_triggered_at).toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-slate-500">Status</p>
                                  <p className="text-sm font-medium text-slate-500">Never triggered</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Error */}
                          {webhook.last_error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs font-semibold text-red-900 mb-1">Last Error:</p>
                              <p className="text-xs text-red-700 font-mono">{webhook.last_error}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleTestWebhook(webhook.id)}
                            className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                          >
                            <Activity className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                            className="whitespace-nowrap"
                          >
                            {webhook.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Integration Guide */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <WebhookIcon className="w-5 h-5 text-blue-600" />
                    Webhook Integration Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">1. Verify Webhook Signatures (HMAC-SHA256)</p>
                    <p className="text-slate-600 mb-2">Every webhook includes an <code className="bg-white px-1 py-0.5 rounded">X-Shuttle-Signature</code> header. Verify it to ensure authenticity:</p>
                    <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const crypto = require('crypto');
const signature = req.headers['x-shuttle-signature'];
const expectedSig = 'sha256=' + crypto
  .createHmac('sha256', yourSecret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature === expectedSig) {
  // ✅ Valid webhook - process it
} else {
  // ❌ Invalid signature - reject
  return res.status(401).send('Unauthorized');
}`}
                    </pre>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-2">2. Webhook Payload Structure</p>
                    <pre className="bg-slate-900 text-blue-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "ride.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "ride_id": "abc123...",
    "ride_code": "H7K3M2",
    "guest_name": "John Doe",
    "status": "pending",
    ...
  }
}`}
                    </pre>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-2">3. Headers Included</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1">
                      <li><code>X-Shuttle-Signature</code>: HMAC-SHA256 signature (sha256=...)</li>
                      <li><code>X-Shuttle-Event</code>: Event name (e.g., ride.created)</li>
                      <li><code>X-Shuttle-Delivery-ID</code>: Unique delivery identifier</li>
                      <li><code>Content-Type</code>: application/json</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-2">4. Response Requirements</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1">
                      <li>Respond with <code>200 OK</code> within <strong>5 seconds</strong></li>
                      <li>Process webhooks asynchronously if needed</li>
                      <li>Webhooks with <strong>10+ consecutive failures</strong> are auto-disabled</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-900 mb-1">⚡ Performance Tips:</p>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      <li>Use HTTPS endpoints only</li>
                      <li>Implement retry logic on your side</li>
                      <li>Monitor webhook health in this dashboard</li>
                      <li>Test with the "Test" button before going live</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/Documentation'}>
              <Key className="w-6 h-6 mb-2" />
              API Documentation
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/DispatcherControl'}>
              <Shield className="w-6 h-6 mb-2" />
              Dispatch Control
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/Dashboard'}>
              <Users className="w-6 h-6 mb-2" />
              Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}