
import React, { useState, useEffect } from 'react';
import { UserEntity } from "@/api/appEntities";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCog, Shield, Truck, Plus, Trash2, RefreshCw, Crown, Tv, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useOrganization } from '@/contexts/OrganizationContext';

// Master Admin only role - system-wide configuration access
const MASTER_ADMIN_ROLE = {
  value: 'master_admin',
  label: 'Master Admin',
  color: 'bg-purple-100 text-purple-800 border-purple-200',
  icon: Crown,
  description: 'Full system access - webhooks, features, API keys'
};

// Standard roles available to all admins to assign
const STANDARD_ROLES = [
  { value: 'admin', label: 'Hotel Admin', color: 'bg-red-100 text-red-800 border-red-200', icon: Shield, description: 'Full access to hotel operations and branding' },
  { value: 'dispatcher', label: 'Dispatcher', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserCog, description: 'Manage rides and drivers' },
  { value: 'driver', label: 'Driver', color: 'bg-green-100 text-green-800 border-green-200', icon: Truck, description: 'Access driver dashboard' },
  { value: 'monitor', label: 'Monitor', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Tv, description: 'TV monitor display only' }
];

export default function RolesManagement({ isOwner }) {
  const { organization, organizationId, loading: orgLoading } = useOrganization();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  useEffect(() => {
    if (!orgLoading) {
      loadUsers();
    }
  }, [organizationId, orgLoading]);

  // Build available roles based on whether current user is Master Admin
  const AVAILABLE_ROLES = isOwner
    ? [MASTER_ADMIN_ROLE, ...STANDARD_ROLES]
    : STANDARD_ROLES;

  const loadUsers = async () => {
    try {
      let allUsers;
      
      // Filter by organization if available (and not master admin viewing all)
      if (organizationId && !isOwner) {
        allUsers = await UserEntity.filter({ organization_id: organizationId });
      } else if (organizationId) {
        // Master admin viewing specific organization
        allUsers = await UserEntity.filter({ organization_id: organizationId });
      } else {
        // Master admin with no org selected - show all users
        allUsers = await UserEntity.list();
      }
      
      // If not master admin, filter out users with master_admin role
      const filteredUsers = isOwner
        ? (allUsers || [])
        : (allUsers || []).filter(u => !u.roles?.includes('master_admin'));
      
      setUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const toggleRole = async (user, role) => {
    try {
      const currentRoles = user.roles || [];
      const hasRole = currentRoles.includes(role);
      
      const newRoles = hasRole
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
      
      await UserEntity.update(user.id, { roles: newRoles });
      
      toast.success(`${hasRole ? 'Removed' : 'Added'} ${role} role ${hasRole ? 'from' : 'to'} ${user.full_name}`);
      await loadUsers();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('Failed to update user roles');
    }
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setShowRoleDialog(true);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info Banner */}
      {organization && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  Managing users for: <span className="font-bold">{organization.name}</span>
                </p>
                <p className="text-sm text-blue-700">
                  {users.length} user{users.length !== 1 ? 's' : ''} in this organization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Hierarchy Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">Role Hierarchy</h4>
        <div className="grid gap-2 text-sm">
          {isOwner && (
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-800">Master Admin:</span>
              <span className="text-slate-600">Full system access - manages webhooks, features, API keys across all tenants</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-800">Hotel Admin:</span>
            <span className="text-slate-600">Tenant-level access - manages users, vehicles, branding for their property</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Dispatcher:</span>
            <span className="text-slate-600">Operational access - manages rides, drivers, and guests</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800">Driver:</span>
            <span className="text-slate-600">Driver dashboard access only</span>
          </div>
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-800">Monitor:</span>
            <span className="text-slate-600">TV monitor display only</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">User Roles</h3>
          <p className="text-sm text-slate-600">Manage user permissions and access levels</p>
        </div>
        <Button onClick={loadUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const isMasterAdminUser = user.roles?.includes('master_admin');
          
          return (
            <Card key={user.id} className={isMasterAdminUser ? 'border-purple-200 bg-purple-50/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-slate-900">{user.full_name}</p>
                      {isMasterAdminUser && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          <Crown className="w-3 h-3 mr-1" />
                          Master Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{user.email}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map((role) => {
                        const hasRole = user.roles?.includes(role.value);
                        const Icon = role.icon;
                        
                        return (
                          <Badge
                            key={role.value}
                            className={`${hasRole ? role.color : 'bg-slate-100 text-slate-400 border-slate-200'} cursor-pointer transition-all`}
                            onClick={() => toggleRole(user, role.value)}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {role.label}
                            {/* Master admin role can only be toggled by master admins */}
                            {(role.value !== 'master_admin' || isOwner) && (hasRole ? ' ✓' : ' +')}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Allow managing non-master-admin users, or allow master admin to manage everyone */}
                  {(isOwner || !isMasterAdminUser) && (
                    <Button
                      onClick={() => openRoleDialog(user)}
                      variant="outline"
                      size="sm"
                    >
                      <UserCog className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role Management Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles for {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Click on a role to add or remove it for this user:
            </p>
            <div className="space-y-3">
              {AVAILABLE_ROLES.map((role) => {
                const hasRole = selectedUser?.roles?.includes(role.value);
                const Icon = role.icon;
                const canToggle = role.value !== 'master_admin' || isOwner;
                
                return (
                  <div
                    key={role.value}
                    onClick={() => canToggle && selectedUser && toggleRole(selectedUser, role.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !canToggle
                        ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-100'
                        : hasRole
                          ? 'cursor-pointer border-blue-500 bg-blue-50'
                          : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${hasRole ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{role.label}</p>
                        <p className="text-xs text-slate-600">{role.description}</p>
                        {!canToggle && (
                          <p className="text-xs text-amber-600 mt-1">Only Master Admins can assign this role</p>
                        )}
                      </div>
                      <div>
                        {hasRole ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRoleDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}