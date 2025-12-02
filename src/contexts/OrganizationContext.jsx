import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { Organization, UserEntity } from '@/api/appEntities';

const OrganizationContext = createContext({
  organization: null,
  organizationId: null,
  loading: true,
  isOrganizationMember: false,
  isMasterAdmin: false,
  refreshOrganization: () => {},
  switchOrganization: () => {},
  allOrganizations: [],
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMasterAdmin = user?.roles?.includes('master_admin') || false;
  
  // Fetch organization data for the current user
  const fetchOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      // Master admins can see all organizations
      if (isMasterAdmin) {
        const orgs = await Organization.list();
        setAllOrganizations(orgs || []);
        
        // Check if there's a stored organization preference
        const storedOrgId = localStorage.getItem('selected_organization_id');
        if (storedOrgId) {
          const selectedOrg = (orgs || []).find(o => o.id === storedOrgId);
          if (selectedOrg) {
            setOrganization(selectedOrg);
            setLoading(false);
            return;
          }
        }
        
        // Default to first organization or null
        if (orgs && orgs.length > 0) {
          setOrganization(orgs[0]);
          localStorage.setItem('selected_organization_id', orgs[0].id);
        } else {
          setOrganization(null);
        }
      } else {
        // Regular users - fetch their assigned organization
        const dbUsers = await UserEntity.filter({ email: user.email });
        if (dbUsers && dbUsers.length > 0 && dbUsers[0].organization_id) {
          const orgData = await Organization.get(dbUsers[0].organization_id);
          setOrganization(orgData);
          setAllOrganizations(orgData ? [orgData] : []);
        } else {
          // No organization assigned
          setOrganization(null);
          setAllOrganizations([]);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, [user, isMasterAdmin]);

  // Refresh organization data
  const refreshOrganization = useCallback(() => {
    setLoading(true);
    fetchOrganization();
  }, [fetchOrganization]);

  // Switch organization (for master admins)
  const switchOrganization = useCallback(async (orgId) => {
    if (!isMasterAdmin) {
      console.warn('Only master admins can switch organizations');
      return;
    }

    try {
      const org = await Organization.get(orgId);
      if (org) {
        setOrganization(org);
        localStorage.setItem('selected_organization_id', orgId);
        // Trigger a page reload to refresh all data with new org context
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  }, [isMasterAdmin]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrganization();
    }
  }, [authLoading, fetchOrganization]);

  const value = {
    organization,
    organizationId: organization?.id || null,
    loading: loading || authLoading,
    isOrganizationMember: !!organization,
    isMasterAdmin,
    refreshOrganization,
    switchOrganization,
    allOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

// Helper hook to add organization_id to entity operations
export const useOrganizationFilter = () => {
  const { organizationId, isMasterAdmin } = useOrganization();

  // Add organization filter to query params
  const addOrgFilter = useCallback((params = {}) => {
    if (!organizationId) return params;
    return {
      ...params,
      organization_id: organizationId,
    };
  }, [organizationId]);

  // Add organization_id to create params
  const addOrgToCreate = useCallback((params = {}) => {
    if (!organizationId) return params;
    return {
      ...params,
      organization_id: organizationId,
    };
  }, [organizationId]);

  return {
    addOrgFilter,
    addOrgToCreate,
    organizationId,
    isMasterAdmin,
  };
};

export default OrganizationContext;