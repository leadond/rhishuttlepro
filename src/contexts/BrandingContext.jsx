import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { Branding } from '@/api/appEntities';
import { useOrganization } from '@/contexts/OrganizationContext';

// Convert hex color to HSL values (without hsl() wrapper - just "h s% l%")
function hexToHSL(hex) {
  if (!hex || typeof hex !== 'string') return null;
  
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  } else {
    return null;
  }
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }

  // Return in format "h s% l%" for CSS custom properties (shadcn format)
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generate a lighter tint of a color (for foreground/contrast)
function getLighterHSL(hsl, amount = 40) {
  if (!hsl) return '0 0% 100%';
  const parts = hsl.split(' ');
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = Math.min(100, parseFloat(parts[2]) + amount);
  return `${h} ${s}% ${l}%`;
}

// Generate a darker variant
function getDarkerHSL(hsl, amount = 10) {
  if (!hsl) return '0 0% 9%';
  const parts = hsl.split(' ');
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = Math.max(0, parseFloat(parts[2]) - amount);
  return `${h} ${s}% ${l}%`;
}

// Default CSS variable values (from index.css)
const defaultCSSVars = {
  '--primary': '0 0% 9%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96.1%',
  '--secondary-foreground': '0 0% 9%',
  '--accent': '0 0% 96.1%',
  '--accent-foreground': '0 0% 9%',
  '--sidebar-background': '0 0% 98%',
  '--sidebar-foreground': '240 5.3% 26.1%',
  '--sidebar-primary': '240 5.9% 10%',
  '--sidebar-primary-foreground': '0 0% 98%',
  '--sidebar-accent': '240 4.8% 95.9%',
  '--sidebar-accent-foreground': '240 5.9% 10%',
  '--sidebar-ring': '217.2 91.2% 59.8%',
  '--ring': '0 0% 3.9%'
};

// Default branding configuration
const defaultBranding = {
  appName: 'Shuttle Pro',
  companyName: 'Shuttle Services Inc.',
  tagline: 'Premium Fleet Management',
  primaryColor: '#2563eb', // blue-600
  secondaryColor: '#1d4ed8', // blue-700
  logoUrl: '/src/assets/logo.png',
  faviconUrl: '/favicon.ico',
  supportEmail: 'support@shuttlepro.com',
  supportPhone: '+1-800-SHUTTLE',
  theme: 'light', // 'light' or 'dark'
  enableCustomBranding: false,
  loading: true
};

// Apply CSS variables to document root
function applyCSSVariables(branding, isCustomEnabled) {
  const root = document.documentElement;
  
  if (isCustomEnabled && branding) {
    const primaryHSL = hexToHSL(branding.primaryColor || branding.primary_color);
    const secondaryHSL = hexToHSL(branding.secondaryColor || branding.secondary_color);
    
    if (primaryHSL) {
      // Primary color variables
      root.style.setProperty('--primary', primaryHSL);
      root.style.setProperty('--primary-foreground', '0 0% 100%'); // White text on primary
      root.style.setProperty('--ring', primaryHSL);
      
      // Sidebar variables
      root.style.setProperty('--sidebar-primary', primaryHSL);
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-ring', primaryHSL);
      
      // Accent
      root.style.setProperty('--accent', getLighterHSL(primaryHSL, 45));
      root.style.setProperty('--accent-foreground', getDarkerHSL(primaryHSL, 40));
    }
    
    if (secondaryHSL) {
      root.style.setProperty('--secondary', secondaryHSL);
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
    }
    
    // Store hex values for components that need direct color access
    root.style.setProperty('--brand-primary-hex', branding.primaryColor || branding.primary_color || defaultBranding.primaryColor);
    root.style.setProperty('--brand-secondary-hex', branding.secondaryColor || branding.secondary_color || defaultBranding.secondaryColor);
    
    console.log('✅ Applied custom branding CSS variables', { primaryHSL, secondaryHSL });
  } else {
    // Reset to defaults
    Object.entries(defaultCSSVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    root.style.removeProperty('--brand-primary-hex');
    root.style.removeProperty('--brand-secondary-hex');
    
    console.log('✅ Reset to default CSS variables');
  }
}

// Create context with default values including refresh function
const BrandingContext = createContext({
  branding: defaultBranding,
  refresh: () => {}
});

// Branding provider component
export function BrandingProvider({ children }) {
  const { organizationId, loading: orgLoading } = useOrganization();
  
  const [brandingConfig, setBrandingConfig] = useState({
    ...defaultBranding,
    // Start with environment variables as initial values
    appName: import.meta.env.VITE_APP_NAME || defaultBranding.appName,
    companyName: import.meta.env.VITE_COMPANY_NAME || defaultBranding.companyName,
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR || defaultBranding.primaryColor,
    secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || defaultBranding.secondaryColor,
    logoUrl: import.meta.env.VITE_LOGO_URL || defaultBranding.logoUrl,
    faviconUrl: import.meta.env.VITE_FAVICON_URL || defaultBranding.faviconUrl,
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || defaultBranding.supportEmail,
    supportPhone: import.meta.env.VITE_SUPPORT_PHONE || defaultBranding.supportPhone,
    theme: import.meta.env.VITE_THEME || defaultBranding.theme,
    enableCustomBranding: import.meta.env.VITE_ENABLE_CUSTOM_BRANDING === 'true',
    loading: true
  });

  // Function to load branding from database (filtered by organization if available)
  const loadBrandingFromDatabase = useCallback(async () => {
    try {
      let brandingList;
      
      // If we have an organization, filter branding by organization_id
      if (organizationId) {
        brandingList = await Branding.filter({ organization_id: organizationId });
      } else {
        // Fallback: try to get global branding (no organization_id)
        brandingList = await Branding.filter({ organization_id: null });
        
        // If no global branding, get the first one as fallback
        if (!brandingList || brandingList.length === 0) {
          brandingList = await Branding.list();
        }
      }
      
      if (brandingList && brandingList.length > 0) {
        const dbBranding = brandingList[0];
        const isCustomEnabled = !!dbBranding.enable_custom_branding;
        
        const newConfig = {
          appName: dbBranding.app_name || defaultBranding.appName,
          companyName: dbBranding.company_name || defaultBranding.companyName,
          tagline: dbBranding.tagline || defaultBranding.tagline,
          primaryColor: dbBranding.primary_color || defaultBranding.primaryColor,
          secondaryColor: dbBranding.secondary_color || defaultBranding.secondaryColor,
          logoUrl: dbBranding.logo_url || defaultBranding.logoUrl,
          faviconUrl: dbBranding.favicon_url || defaultBranding.faviconUrl,
          supportEmail: dbBranding.support_email || defaultBranding.supportEmail,
          supportPhone: dbBranding.support_phone || defaultBranding.supportPhone,
          theme: dbBranding.theme || defaultBranding.theme,
          enableCustomBranding: isCustomEnabled,
          loading: false
        };
        
        setBrandingConfig(newConfig);
        
        // Apply CSS variables based on whether custom branding is enabled
        applyCSSVariables(newConfig, isCustomEnabled);
        
        // Update document title & favicon if custom branding is enabled
        if (isCustomEnabled) {
          document.title = newConfig.appName;
          
          if (newConfig.faviconUrl) {
            const faviconLink = document.querySelector("link[rel~='icon']");
            if (faviconLink) {
              faviconLink.href = newConfig.faviconUrl;
            }
          }
        } else {
          // Reset to default title
          document.title = defaultBranding.appName;
        }
      } else {
        setBrandingConfig(prev => ({ ...prev, loading: false }));
        applyCSSVariables(null, false);
      }
    } catch (error) {
      console.error('Error loading branding from database:', error);
      setBrandingConfig(prev => ({ ...prev, loading: false }));
      applyCSSVariables(null, false);
    }
  }, []);

  // Load branding when organization changes
  useEffect(() => {
    if (!orgLoading) {
      loadBrandingFromDatabase();
    }
  }, [loadBrandingFromDatabase, organizationId, orgLoading]);

  // Refresh function to reload branding from database
  const refresh = useCallback(() => {
    setBrandingConfig(prev => ({ ...prev, loading: true }));
    loadBrandingFromDatabase();
  }, [loadBrandingFromDatabase]);

  // Memoize the context value - provide branding as a nested object for component access
  const contextValue = useMemo(() => ({
    branding: brandingConfig,
    ...brandingConfig, // Also spread for backwards compatibility
    refresh
  }), [brandingConfig, refresh]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

// Custom hook to use branding
export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

// Helper hook to generate CSS variables
export function useBrandingStyles() {
  const { branding } = useBranding();
  
  return useMemo(() => ({
    '--primary': branding.primaryColor,
    '--primary-foreground': '#ffffff',
    '--primary-hover': branding.secondaryColor,
    '--brand-app-name': `"${branding.appName}"`,
    '--brand-company-name': `"${branding.companyName}"`,
  }), [branding]);
}