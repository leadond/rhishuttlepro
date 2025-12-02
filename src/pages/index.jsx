import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import GuestPortal from "./GuestPortal";

import DriverDashboard from "./DriverDashboard";

import DispatcherControl from "./DispatcherControl";

import PublicRideDetails from "./PublicRideDetails";

import TVMonitor from "./TVMonitor";

import Admin from "./Admin";

import Help from "./Help";

import Documentation from "./Documentation";
import Login from "./Login";
import RoleBasedRoute from "../components/auth/RoleBasedRoute";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    Login: Login,
    
    Dashboard: Dashboard,
    
    GuestPortal: GuestPortal,
    
    DriverDashboard: DriverDashboard,
    
    DispatcherControl: DispatcherControl,
    
    PublicRideDetails: PublicRideDetails,
    
    TVMonitor: TVMonitor,
    
    Admin: Admin,
    
    Help: Help,
    
    Documentation: Documentation,
    
}

function _getCurrentPage(url) {
    // Handle root path explicitly
    if (url === '/' || url === '') {
        return 'Dashboard';
    }

    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Dashboard'; // Default to Dashboard instead of Login
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={
                        <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'dispatcher']}>
                            <Dashboard />
                        </RoleBasedRoute>
                    } />
                    <Route path="/login" element={<Login />} />
                
                
                <Route path="/Dashboard" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'dispatcher']}>
                        <Dashboard />
                    </RoleBasedRoute>
                } />
                
                <Route path="/GuestPortal" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'dispatcher']}>
                        <GuestPortal />
                    </RoleBasedRoute>
                } />
                
                <Route path="/DriverDashboard" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'driver']}>
                        <DriverDashboard />
                    </RoleBasedRoute>
                } />
                
                <Route path="/DispatcherControl" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'dispatcher']}>
                        <DispatcherControl />
                    </RoleBasedRoute>
                } />
                
                <Route path="/PublicRideDetails" element={
                    <RoleBasedRoute allowedRoles={[]}> 
                        <PublicRideDetails />
                    </RoleBasedRoute>
                } />
                
                <Route path="/TVMonitor" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'dispatcher', 'monitor']}>
                        <TVMonitor />
                    </RoleBasedRoute>
                } />
                
                <Route path="/Admin" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin']}>
                        <Admin />
                    </RoleBasedRoute>
                } />
                
                <Route path="/Help" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin', 'dispatcher', 'driver']}>
                        <Help />
                    </RoleBasedRoute>
                } />
                
                <Route path="/Documentation" element={
                    <RoleBasedRoute allowedRoles={['master_admin', 'admin']}>
                        <Documentation />
                    </RoleBasedRoute>
                } />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}