import React, { useState, useEffect } from 'react';
import { Branding } from '@/api/appEntities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  Building,
  Image,
  Save,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { useBranding } from '@/contexts/BrandingContext';
import { useOrganization } from '@/contexts/OrganizationContext';

const defaultBrandingConfig = {
  app_name: 'Shuttle Pro',
  company_name: 'Shuttle Services Inc.',
  primary_color: '#2563eb',
  secondary_color: '#1d4ed8',
  logo_url: '/logo.svg',
  favicon_url: '/favicon.ico',
  support_email: 'support@shuttlepro.com',
  support_phone: '+1-800-SHUTTLE',
  theme: 'light',
  enable_custom_branding: false
};

export default function BrandingSettings() {
  const [branding, setBranding] = useState(defaultBrandingConfig);
  const [originalBranding, setOriginalBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandingId, setBrandingId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { refresh: refreshBrandingContext } = useBranding();
  const { organization, organizationId, loading: orgLoading } = useOrganization();

  useEffect(() => {
    if (!orgLoading) {
      loadBranding();
    }
  }, [organizationId, orgLoading]);

  useEffect(() => {
    if (originalBranding) {
      const isDifferent = JSON.stringify(branding) !== JSON.stringify(originalBranding);
      setHasChanges(isDifferent);
    }
  }, [branding, originalBranding]);

  const loadBranding = async () => {
    try {
      setLoading(true);
      
      // Filter by organization_id if available
      let brandingList;
      if (organizationId) {
        brandingList = await Branding.filter({ organization_id: organizationId });
      } else {
        // Fallback to global branding or first branding record
        brandingList = await Branding.filter({ organization_id: null });
        if (!brandingList || brandingList.length === 0) {
          brandingList = await Branding.list();
        }
      }
      
      if (brandingList && brandingList.length > 0) {
        const existingBranding = brandingList[0];
        setBrandingId(existingBranding.id);
        const loadedBranding = {
          app_name: existingBranding.app_name || defaultBrandingConfig.app_name,
          company_name: existingBranding.company_name || defaultBrandingConfig.company_name,
          primary_color: existingBranding.primary_color || defaultBrandingConfig.primary_color,
          secondary_color: existingBranding.secondary_color || defaultBrandingConfig.secondary_color,
          logo_url: existingBranding.logo_url || defaultBrandingConfig.logo_url,
          favicon_url: existingBranding.favicon_url || defaultBrandingConfig.favicon_url,
          support_email: existingBranding.support_email || defaultBrandingConfig.support_email,
          support_phone: existingBranding.support_phone || defaultBrandingConfig.support_phone,
          theme: existingBranding.theme || defaultBrandingConfig.theme,
          enable_custom_branding: existingBranding.enable_custom_branding || false
        };
        setBranding(loadedBranding);
        setOriginalBranding(loadedBranding);
      } else {
        setBranding(defaultBrandingConfig);
        setOriginalBranding(defaultBrandingConfig);
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Include organization_id in branding data
      const brandingData = {
        ...branding,
        organization_id: organizationId || null,
      };
      
      if (brandingId) {
        await Branding.update(brandingId, brandingData);
      } else {
        const created = await Branding.create(brandingData);
        setBrandingId(created.id);
      }
      
      setOriginalBranding({ ...branding });
      setHasChanges(false);
      
      // Refresh the global branding context
      if (refreshBrandingContext) {
        refreshBrandingContext();
      }
      
      toast.success('Branding settings saved successfully!', {
        description: 'Changes will be reflected across the application.'
      });
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalBranding) {
      setBranding({ ...originalBranding });
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all branding settings to defaults?')) {
      return;
    }
    
    setBranding({ ...defaultBrandingConfig });
    if (brandingId) {
      try {
        setSaving(true);
        await Branding.update(brandingId, { ...defaultBrandingConfig, organization_id: organizationId || null });
        setOriginalBranding({ ...defaultBrandingConfig });
        setHasChanges(false);
        
        if (refreshBrandingContext) {
          refreshBrandingContext();
        }
        
        toast.success('Branding reset to defaults');
      } catch (error) {
        console.error('Error resetting branding:', error);
        toast.error('Failed to reset branding');
      } finally {
        setSaving(false);
      }
    }
  };

  const updateField = (field, value) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading branding settings...</p>
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
                  Managing branding for: <span className="font-bold">{organization.name}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Changes will only affect this organization's branding
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Palette className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">White Label Branding</h3>
              <p className="text-sm text-slate-700 mb-3">
                Customize the appearance of your Shuttle Pro application. Changes will be reflected across all pages and components.
              </p>
              <div className="flex gap-2 flex-wrap">
                {branding.enable_custom_branding ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Custom Branding Enabled
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Using Default Branding
                  </Badge>
                )}
                {hasChanges && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enable Custom Branding Toggle - Enhanced UI */}
      <Card className={`border-2 transition-all duration-300 ${branding.enable_custom_branding ? 'border-green-500 bg-green-50/50' : 'border-slate-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-semibold text-slate-900 text-lg">Custom Branding Mode</h4>
              <p className="text-sm text-slate-600 mt-1">
                Toggle to switch between default Shuttle Pro branding and your custom white-label branding
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${!branding.enable_custom_branding ? 'text-slate-900' : 'text-slate-400'}`}>
                Default
              </span>
              <Switch
                checked={branding.enable_custom_branding}
                onCheckedChange={(checked) => updateField('enable_custom_branding', checked)}
                className="data-[state=checked]:bg-green-600"
              />
              <span className={`text-sm font-medium ${branding.enable_custom_branding ? 'text-green-700' : 'text-slate-400'}`}>
                Custom
              </span>
            </div>
          </div>

          {/* Side-by-Side Comparison Preview */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Default Branding Preview */}
            <div className={`p-4 rounded-lg border-2 transition-all ${!branding.enable_custom_branding ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Default UI</span>
                {!branding.enable_custom_branding && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center shadow-sm p-1">
                  <img src="/src/assets/logo.png" alt="Default Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Shuttle Pro</p>
                  <p className="text-xs text-slate-500">Premium Fleet Management</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 border" title="#2563eb"></div>
                <div className="w-6 h-6 rounded bg-blue-700 border" title="#1d4ed8"></div>
              </div>
            </div>

            {/* Custom Branding Preview */}
            <div className={`p-4 rounded-lg border-2 transition-all ${branding.enable_custom_branding ? 'border-green-500 bg-green-50/50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Custom UI</span>
                {branding.enable_custom_branding && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center shadow-sm p-1">
                  {branding.logo_url ? (
                    <img
                      src={branding.logo_url}
                      alt="Custom Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/src/assets/logo.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-xs text-slate-400">
                      No Logo
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{branding.app_name || 'Your App Name'}</p>
                  <p className="text-xs text-slate-500">{branding.company_name || 'Your Company'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: branding.primary_color }}
                  title={branding.primary_color}
                ></div>
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: branding.secondary_color }}
                  title={branding.secondary_color}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Switch Hint */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>💡 Tip:</strong> Toggle the switch above to instantly preview how your app will look. Changes apply after saving.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="identity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identity">
            <Building className="w-4 h-4 mr-2" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="w-4 h-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Image className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Mail className="w-4 h-4 mr-2" />
            Contact
          </TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Brand Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app_name">Application Name</Label>
                <Input
                  id="app_name"
                  value={branding.app_name}
                  onChange={(e) => updateField('app_name', e.target.value)}
                  placeholder="Shuttle Pro"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This name appears in the sidebar, headers, and browser tab
                </p>
              </div>

              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={branding.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="Shuttle Services Inc."
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your organization name for legal and branding purposes
                </p>
              </div>

              <div>
                <Label>Theme</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant={branding.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => updateField('theme', 'light')}
                    className="flex-1"
                  >
                    ☀️ Light
                  </Button>
                  <Button
                    variant={branding.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => updateField('theme', 'dark')}
                    className="flex-1"
                  >
                    🌙 Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      id="primary_color"
                      value={branding.primary_color}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.primary_color}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Used for buttons, links, and accents
                  </p>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      id="secondary_color"
                      value={branding.secondary_color}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.secondary_color}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      placeholder="#1d4ed8"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Used for hover states and secondary elements
                  </p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-4 bg-slate-50 rounded-lg border">
                <p className="text-sm font-semibold text-slate-700 mb-3">Preview</p>
                <div className="flex gap-3 items-center">
                  <div 
                    className="w-16 h-16 rounded-lg shadow-sm flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    Aa
                  </div>
                  <div 
                    className="w-16 h-16 rounded-lg shadow-sm flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: branding.secondary_color }}
                  >
                    Aa
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button style={{ backgroundColor: branding.primary_color }} className="w-full">
                      Primary Button
                    </Button>
                    <Button variant="outline" style={{ borderColor: branding.primary_color, color: branding.primary_color }}>
                      Outline Button
                    </Button>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Blue', primary: '#2563eb', secondary: '#1d4ed8' },
                    { name: 'Green', primary: '#16a34a', secondary: '#15803d' },
                    { name: 'Purple', primary: '#9333ea', secondary: '#7e22ce' },
                    { name: 'Red', primary: '#dc2626', secondary: '#b91c1c' },
                    { name: 'Orange', primary: '#ea580c', secondary: '#c2410c' },
                    { name: 'Teal', primary: '#0d9488', secondary: '#0f766e' },
                    { name: 'Slate', primary: '#475569', secondary: '#334155' },
                  ].map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateField('primary_color', preset.primary);
                        updateField('secondary_color', preset.secondary);
                      }}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.primary }}
                      />
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-green-600" />
                Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={branding.logo_url}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  placeholder="/logo.svg or https://example.com/logo.png"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recommended size: 200x50px. Supports PNG, SVG, JPG
                </p>
                {branding.logo_url && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg border inline-block">
                    <p className="text-xs text-slate-500 mb-2">Logo Preview:</p>
                    <img 
                      src={branding.logo_url} 
                      alt="Logo preview" 
                      className="max-h-12 max-w-48 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input
                  id="favicon_url"
                  value={branding.favicon_url}
                  onChange={(e) => updateField('favicon_url', e.target.value)}
                  placeholder="/favicon.ico or https://example.com/favicon.ico"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Browser tab icon. Recommended size: 32x32px or 16x16px
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-600" />
                Support Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="support_email"
                    type="email"
                    value={branding.support_email}
                    onChange={(e) => updateField('support_email', e.target.value)}
                    placeholder="support@example.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Displayed in help sections and error pages
                </p>
              </div>

              <div>
                <Label htmlFor="support_phone">Support Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="support_phone"
                    value={branding.support_phone}
                    onChange={(e) => updateField('support_phone', e.target.value)}
                    placeholder="+1-800-EXAMPLE"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Phone number for customer support
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={!hasChanges || saving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Discard Changes
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleResetToDefaults}
                disabled={saving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Reset to Defaults
              </Button>
            </div>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}