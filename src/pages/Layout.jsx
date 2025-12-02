import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from '@/api/appEntities';
import {
  LayoutDashboard,
  Users,
  Truck,
  Shield,
  Tv,
  LogOut,
  UserCog,
  Menu,
  X,
  BookOpen,
  HelpCircle,
  Car,
  Building2,
  ChevronDown,
  Crown
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SimulationProvider } from "@/components/contexts/SimulationContext";
import { FeatureFlagsProvider } from "@/components/contexts/FeatureFlagsContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const allNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    roles: ["master_admin", "admin", "dispatcher"]
  },
  {
    title: "Admin Panel",
    url: createPageUrl("Admin"),
    icon: Shield,
    roles: ["master_admin", "admin"]
  },
  {
    title: "Dispatch Control",
    url: createPageUrl("DispatcherControl"),
    icon: Truck,
    roles: ["master_admin", "admin", "dispatcher"]
  },
  {
    title: "Driver Dashboard",
    url: createPageUrl("DriverDashboard"),
    icon: Car,
    roles: ["master_admin", "admin", "driver"]
  },
  {
    title: "Guest Portal",
    url: createPageUrl("GuestPortal"),
    icon: Users,
    roles: ["master_admin", "admin", "dispatcher"]
  },
  {
    title: "TV Monitor",
    url: createPageUrl("TVMonitor"),
    icon: Tv,
    roles: ["master_admin", "admin", "dispatcher", "monitor"]
  },
  {
    title: "Help & Docs",
    url: createPageUrl("Help"),
    icon: HelpCircle,
    roles: ["master_admin", "admin", "dispatcher", "driver"]
  }
];

const SidebarContent = ({ currentUser, accessibleNavItems }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const branding = useBranding();
  const { organization, allOrganizations, isMasterAdmin, switchOrganization } = useOrganization();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-primary/30 p-1">
            <img
              src={branding.enableCustomBranding ? branding.logoUrl : "/src/assets/logo.png"}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = "/src/assets/logo.png";
              }}
            />
          </div>
          <div>
            <h1 className="font-bold text-xl text-primary tracking-tight">
              {branding.enableCustomBranding ? branding.appName : 'Shuttle Pro'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {branding.enableCustomBranding ? branding.companyName : 'Fleet Management'}
            </p>
          </div>
        </div>
      </div>

      {/* Organization Switcher for Master Admin */}
      {isMasterAdmin && allOrganizations.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-white border-purple-200 hover:bg-purple-50"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="truncate text-sm">
                    {organization?.name || 'Select Organization'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-purple-600 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                Switch Organization
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allOrganizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => switchOrganization(org.id)}
                  className={organization?.id === org.id ? 'bg-purple-50' : ''}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="truncate flex-1">{org.name}</span>
                    {organization?.id === org.id && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">Active</Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-purple-700 mt-1.5 text-center">
            Viewing as Master Admin
          </p>
        </div>
      )}

      {/* Current Organization Display for Hotel Admins */}
      {!isMasterAdmin && organization && (
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-900 truncate">
              {organization.name}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="mb-6 px-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</p>
          {accessibleNavItems.map((item) => {
            const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span>{item.title}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage src={currentUser?.avatar_url} />
            <AvatarFallback className="bg-slate-800 text-white font-semibold">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {currentUser?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {currentUser?.email || ''}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

// Mobile Header Component with Branding Support
const MobileHeader = () => {
  const branding = useBranding();
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-primary/30 p-0.5">
        <img
          src={branding.enableCustomBranding ? branding.logoUrl : "/src/assets/logo.png"}
          alt="Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = "/src/assets/logo.png";
          }}
        />
      </div>
      <h2 className="font-bold text-primary text-lg">
        {branding.enableCustomBranding ? branding.appName : 'Shuttle Pro'}
      </h2>
    </div>
  );
};

export default function Layout({ children, currentPageName }) {
  const { user: currentUser, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Public pages that don't require authentication
  // CRITICAL: Ensure case sensitivity matches routes in index.jsx
  const publicPages = ['/login', '/register', '/forgot-password', '/public-ride', '/guest-portal', '/GuestPortal', '/PublicRideDetails'];
  const isPublicPage = publicPages.some(page => location.pathname.toLowerCase().startsWith(page.toLowerCase()));

  useEffect(() => {
    if (!loading && !currentUser && !isPublicPage) {
      navigate('/login');
      return;
    }

    if (currentUser) {
        const isDriverStrict = currentUser.roles?.includes('driver') && !currentUser.roles?.includes('admin') && !currentUser.roles?.includes('dispatcher');
        const isMonitorStrict = currentUser.roles?.includes('monitor');

        if (isDriverStrict) {
            const allowedPaths = ['/DriverDashboard', '/Help'];
            const isAllowed = allowedPaths.some(path => location.pathname.toLowerCase().startsWith(path.toLowerCase()));
            if (!isAllowed) {
                console.log('Restricted Access: Redirecting Driver to Dashboard');
                navigate('/DriverDashboard');
            }
        } else if (isMonitorStrict) {
            const allowedPaths = ['/TVMonitor'];
            const isAllowed = allowedPaths.some(path => location.pathname.toLowerCase().startsWith(path.toLowerCase()));
            if (!isAllowed) {
                console.log('Restricted Access: Redirecting Monitor to TV Page');
                navigate('/TVMonitor');
            }
        }
    }
  }, [currentUser, loading, isPublicPage, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser && !isPublicPage) {
    return null; // Will redirect in useEffect
  }

  // If on a public page, render children without layout wrapper (or with minimal wrapper)
  if (isPublicPage) {
    return (
      <FeatureFlagsProvider>
        <SimulationProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SimulationProvider>
      </FeatureFlagsProvider>
    );
  }

  const isMasterAdmin = currentUser?.roles?.includes('master_admin');
  const isHotelAdmin = currentUser?.roles?.includes('admin');
  
  const accessibleNavItems = currentUser && currentUser.roles ? allNavigationItems.filter(item => {
    // 0. Master Admin: Full access to everything
    if (isMasterAdmin) {
        return item.roles.includes('master_admin');
    }
    
    // 1. Driver Strict Mode: Only Driver Dashboard and Help
    if (currentUser.roles.includes('driver') && !currentUser.roles.includes('admin') && !currentUser.roles.includes('dispatcher')) {
        return item.title === "Driver Dashboard" || item.title === "Help & Docs";
    }

    // 2. Monitor Strict Mode: Only TV Monitor
    if (currentUser.roles.includes('monitor') && !currentUser.roles.includes('admin') && !currentUser.roles.includes('dispatcher')) {
        return item.title === "TV Monitor";
    }

    // 3. Dispatcher Strict Mode: Dashboard, Dispatch Control, Guest Portal, TV Monitor, Help
    // CRITICAL: If user has 'dispatcher' role, they are RESTRICTED to these pages
    if (currentUser.roles.includes('dispatcher') && !currentUser.roles.includes('admin')) {
        const allowed = ["Dashboard", "Dispatch Control", "Guest Portal", "TV Monitor", "Help & Docs"];
        return allowed.includes(item.title);
    }

    // 4. Hotel Admin (Admin Role): Everything EXCEPT Driver Dashboard (unless they are also a driver)
    if (isHotelAdmin) {
        return item.roles.includes('admin');
    }

    return item.roles.some(role => currentUser.roles.includes(role));
  }) : [];

  const mobileUserInitial = currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U';

  const isDriverStrict = currentUser?.roles?.includes('driver') && !currentUser?.roles?.includes('master_admin') && !currentUser?.roles?.includes('admin') && !currentUser?.roles?.includes('dispatcher');
  const isMonitorStrict = currentUser?.roles?.includes('monitor') && !currentUser?.roles?.includes('master_admin') && !currentUser?.roles?.includes('admin') && !currentUser?.roles?.includes('dispatcher');

  // STRICT MODE LAYOUT (Driver & Monitor)
  if (isDriverStrict || isMonitorStrict) {
     return (
      <FeatureFlagsProvider>
        <SimulationProvider>
          <div className="min-h-screen w-full bg-slate-50 relative">
             {/* Minimal Floating Logout for Strict Mode */}
             <div className="absolute top-4 right-4 z-50">
                 <Button 
                   variant="destructive" 
                   size="sm" 
                   className="shadow-md opacity-80 hover:opacity-100 transition-opacity"
                   onClick={handleLogout}
                 >
                   <LogOut className="w-4 h-4 mr-2" />
                   Sign Out
                 </Button>
             </div>
             {children}
          </div>
          <Toaster richColors position="top-right" />
        </SimulationProvider>
      </FeatureFlagsProvider>
     );
  }

  return (
    <FeatureFlagsProvider>
      <SimulationProvider>
        <div className="min-h-screen w-full bg-slate-50 flex">
        <aside className="w-64 hidden md:block border-r border-slate-200 shadow-sm">
          <SidebarContent currentUser={currentUser} accessibleNavItems={accessibleNavItems} />
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 p-4 md:hidden flex items-center justify-between sticky top-0 z-10">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                 <SidebarContent currentUser={currentUser} accessibleNavItems={accessibleNavItems} />
              </SheetContent>
            </Sheet>
            <MobileHeader />
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Avatar className="h-9 w-9">
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback className="bg-slate-700 text-white font-semibold">
                    {mobileUserInitial}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
      </SimulationProvider>
    </FeatureFlagsProvider>
  );
}
