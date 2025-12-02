import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Car, 
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Organization, UserEntity, Vehicle, Driver } from "@/api/appEntities";
import { useOrganization } from "@/contexts/OrganizationContext";

const OrganizationManagement = () => {
  const { toast } = useToast();
  const { refreshOrganization } = useOrganization();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgStats, setOrgStats] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    subscription_tier: 'basic',
    subscription_status: 'active',
    max_vehicles: 10,
    max_users: 25,
    features_enabled: [],
    notes: '',
    is_active: true,
  });

  const subscriptionTiers = [
    { value: 'basic', label: 'Basic', maxVehicles: 5, maxUsers: 10 },
    { value: 'standard', label: 'Standard', maxVehicles: 15, maxUsers: 50 },
    { value: 'premium', label: 'Premium', maxVehicles: 50, maxUsers: 200 },
    { value: 'enterprise', label: 'Enterprise', maxVehicles: -1, maxUsers: -1 },
  ];

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await Organization.list();
      setOrganizations(orgs || []);
      
      // Fetch stats for each organization
      const stats = {};
      for (const org of (orgs || [])) {
        try {
          const [users, vehicles, drivers] = await Promise.all([
            UserEntity.filter({ organization_id: org.id }),
            Vehicle.filter({ organization_id: org.id }),
            Driver.filter({ organization_id: org.id }),
          ]);
          stats[org.id] = {
            users: users?.length || 0,
            vehicles: vehicles?.length || 0,
            drivers: drivers?.length || 0,
          };
        } catch (err) {
          stats[org.id] = { users: 0, vehicles: 0, drivers: 0 };
        }
      }
      setOrgStats(stats);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleTierChange = (tier) => {
    const tierConfig = subscriptionTiers.find(t => t.value === tier);
    setFormData(prev => ({
      ...prev,
      subscription_tier: tier,
      max_vehicles: tierConfig?.maxVehicles || 10,
      max_users: tierConfig?.maxUsers || 25,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      subscription_tier: 'basic',
      subscription_status: 'active',
      max_vehicles: 10,
      max_users: 25,
      features_enabled: [],
      notes: '',
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate slug
    const existingOrg = organizations.find(o => o.slug === formData.slug);
    if (existingOrg) {
      toast({
        title: "Validation Error",
        description: "An organization with this slug already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      await Organization.create({
        ...formData,
        created_at: new Date().toISOString(),
      });
      
      toast({
        title: "Success",
        description: `Organization "${formData.name}" created successfully`,
      });
      
      setShowCreateDialog(false);
      resetForm();
      fetchOrganizations();
      refreshOrganization();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (org) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name || '',
      slug: org.slug || '',
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || '',
      address: org.address || '',
      subscription_tier: org.subscription_tier || 'basic',
      subscription_status: org.subscription_status || 'active',
      max_vehicles: org.max_vehicles || 10,
      max_users: org.max_users || 25,
      features_enabled: org.features_enabled || [],
      notes: org.notes || '',
      is_active: org.is_active !== false,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedOrg) return;

    try {
      await Organization.update(selectedOrg.id, {
        ...formData,
        updated_at: new Date().toISOString(),
      });
      
      toast({
        title: "Success",
        description: `Organization "${formData.name}" updated successfully`,
      });
      
      setShowEditDialog(false);
      setSelectedOrg(null);
      resetForm();
      fetchOrganizations();
      refreshOrganization();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (org) => {
    const stats = orgStats[org.id] || {};
    if (stats.users > 0 || stats.vehicles > 0) {
      toast({
        title: "Cannot Delete",
        description: `This organization has ${stats.users} users and ${stats.vehicles} vehicles. Remove them first.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await Organization.delete(org.id);
      
      toast({
        title: "Success",
        description: `Organization "${org.name}" deleted successfully`,
      });
      
      fetchOrganizations();
      refreshOrganization();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  const toggleOrgStatus = async (org) => {
    try {
      await Organization.update(org.id, {
        is_active: !org.is_active,
        updated_at: new Date().toISOString(),
      });
      
      toast({
        title: "Success",
        description: `Organization "${org.name}" ${!org.is_active ? 'activated' : 'deactivated'}`,
      });
      
      fetchOrganizations();
    } catch (error) {
      console.error('Error toggling organization status:', error);
      toast({
        title: "Error",
        description: "Failed to update organization status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500">Suspended</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'standard':
        return <Badge className="bg-blue-600">Standard</Badge>;
      case 'premium':
        return <Badge className="bg-purple-600">Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-amber-600">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  const OrganizationForm = ({ isEdit = false }) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Organization Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="Marriott Downtown Houston"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="slug">URL Slug</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="marriott-downtown-houston"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">Used for unique identification</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            placeholder="admin@hotel.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="123 Main Street, Houston, TX 77001"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Subscription Tier</Label>
          <Select value={formData.subscription_tier} onValueChange={handleTierChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionTiers.map(tier => (
                <SelectItem key={tier.value} value={tier.value}>
                  {tier.label} ({tier.maxVehicles === -1 ? 'Unlimited' : tier.maxVehicles} vehicles)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Subscription Status</Label>
          <Select 
            value={formData.subscription_status} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, subscription_status: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="max_vehicles">Max Vehicles</Label>
          <Input
            id="max_vehicles"
            type="number"
            value={formData.max_vehicles}
            onChange={(e) => setFormData(prev => ({ ...prev, max_vehicles: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="max_users">Max Users</Label>
          <Input
            id="max_users"
            type="number"
            value={formData.max_users}
            onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Internal notes about this organization..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Organization is Active</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Management
              </CardTitle>
              <CardDescription>
                Manage customer organizations and their subscription settings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchOrganizations} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Set up a new customer organization with their subscription details
                    </DialogDescription>
                  </DialogHeader>
                  <OrganizationForm />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate}>Create Organization</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Organizations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first organization to start managing customer tenants
              </p>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Organization
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead className="text-center">Vehicles</TableHead>
                  <TableHead className="text-center">Drivers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const stats = orgStats[org.id] || {};
                  return (
                    <TableRow key={org.id} className={!org.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {org.name}
                              {!org.is_active && (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{org.contact_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(org.subscription_status)}</TableCell>
                      <TableCell>{getTierBadge(org.subscription_tier)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{stats.users || 0}</span>
                          <span className="text-muted-foreground">/ {org.max_users || '∞'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{stats.vehicles || 0}</span>
                          <span className="text-muted-foreground">/ {org.max_vehicles === -1 ? '∞' : org.max_vehicles || '∞'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span>{stats.drivers || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleOrgStatus(org)}
                            title={org.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {org.is_active ? (
                              <XCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(org)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{organizations.length}</div>
                <div className="text-sm text-muted-foreground">Total Organizations</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {organizations.filter(o => o.is_active && o.subscription_status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Subscriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Object.values(orgStats).reduce((sum, s) => sum + (s.users || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Car className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Object.values(orgStats).reduce((sum, s) => sum + (s.vehicles || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Vehicles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details and subscription settings
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedOrg(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationManagement;