import React, { useState, useEffect } from 'react';
import { FeatureFlag } from "@/api/appEntities";
import { useFeatureFlags } from '@/components/contexts/FeatureFlagsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, MessageSquare, BarChart3, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const FEATURE_DEFINITIONS = [
  // AI Features (Advanced)
  {
    feature_key: 'ai_voice_handler',
    feature_name: 'AI Voice Handler',
    description: 'Twilio voice calls with AI agent for ride requests',
    category: 'ai',
    is_advanced: true,
    icon: Sparkles
  },
  {
    feature_key: 'ai_ride_agent',
    feature_name: 'AI Ride Request Agent',
    description: 'Conversational AI assistant for booking rides',
    category: 'ai',
    is_advanced: true,
    icon: Sparkles
  },
  
  // Integrations (Basic)
  {
    feature_key: 'webhooks',
    feature_name: 'Webhook Integrations',
    description: 'Real-time webhooks for external system integration',
    category: 'integrations',
    is_advanced: false,
    icon: Zap
  },
  {
    feature_key: 'external_api',
    feature_name: 'External API Access',
    description: 'REST API endpoints for third-party integration',
    category: 'integrations',
    is_advanced: false,
    icon: Zap
  },
  
  // Communication (Basic)
  {
    feature_key: 'sms_notifications',
    feature_name: 'SMS Notifications',
    description: 'Automated SMS updates to guests via Twilio',
    category: 'communication',
    is_advanced: false,
    icon: MessageSquare
  },
  {
    feature_key: 'guest_chat',
    feature_name: 'Guest Chat',
    description: 'In-app messaging between guests and dispatch',
    category: 'communication',
    is_advanced: false,
    icon: MessageSquare
  },
  
  // Analytics (Basic)
  {
    feature_key: 'advanced_analytics',
    feature_name: 'Advanced Analytics',
    description: 'Detailed charts, trends, and performance metrics',
    category: 'analytics',
    is_advanced: false,
    icon: BarChart3
  },
  {
    feature_key: 'rating_system',
    feature_name: 'Rating & Feedback System',
    description: 'Guest ratings with sentiment analysis',
    category: 'analytics',
    is_advanced: false,
    icon: BarChart3
  },
  
  // Operations (Basic - always enabled)
  {
    feature_key: 'ride_management',
    feature_name: 'Ride Management',
    description: 'Create, assign, track, and complete ride requests',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'driver_dashboard',
    feature_name: 'Driver Mobile Dashboard',
    description: 'Mobile-friendly interface for drivers to manage rides',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'dispatch_control',
    feature_name: 'Dispatch Control Center',
    description: 'Real-time fleet management and ride assignment',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'vehicle_tracking',
    feature_name: 'Vehicle GPS Tracking',
    description: 'Live location tracking of all vehicles',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'vehicle_inspection',
    feature_name: 'Vehicle Inspection',
    description: 'Pre-trip safety checks and maintenance logs',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'guest_portal',
    feature_name: 'Guest Ride Tracking',
    description: 'Public portal for guests to track their rides',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'emergency_alerts',
    feature_name: 'Emergency Alert System',
    description: 'Driver panic button and emergency notifications',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'tv_monitor',
    feature_name: 'TV Monitor Display',
    description: 'Large screen display for lobby/dispatch office',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'basic_reporting',
    feature_name: 'Basic Reporting',
    description: 'Daily ride counts and basic operational stats',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'user_management',
    feature_name: 'User & Role Management',
    description: 'Admin, dispatcher, and driver account management',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  },
  {
    feature_key: 'simulation_mode',
    feature_name: 'Demo/Simulation Mode',
    description: 'Generate test data for demos and training',
    category: 'operations',
    is_advanced: false,
    icon: Settings
  }
];

const categoryColors = {
  ai: 'bg-purple-100 text-purple-800 border-purple-200',
  integrations: 'bg-blue-100 text-blue-800 border-blue-200',
  communication: 'bg-green-100 text-green-800 border-green-200',
  analytics: 'bg-orange-100 text-orange-800 border-orange-200',
  operations: 'bg-slate-100 text-slate-800 border-slate-200'
};

import { useAuth } from '@/components/contexts/AuthContext';

export default function FeatureManagement() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFeatures();
    }
  }, [user]);

  const loadFeatures = async () => {
    try {
      const existingFeatures = await FeatureFlag.list();
      
      // Check for duplicates and clean them up
      const keyMap = {};
      const duplicates = [];
      
      existingFeatures.forEach(f => {
        if (!keyMap[f.feature_key]) {
          keyMap[f.feature_key] = f;
        } else {
          // Found a duplicate. Keep the one with the higher ID (assuming newer) or updated_date
          const existing = keyMap[f.feature_key];
          // Simple heuristic: Keep the one with the higher ID (assuming auto-increment or time-based)
          // Or prefer the one that is enabled if one is disabled? No, better to stick to recency.
          // Let's assume higher ID is newer.
          if (f.id > existing.id) {
            duplicates.push(existing);
            keyMap[f.feature_key] = f;
          } else {
            duplicates.push(f);
          }
        }
      });

      // Delete duplicates and invalid records (zombies) in background
      const toDelete = [...duplicates];
      
      // Find records with missing feature_key (corrupted by destructive PUT)
      existingFeatures.forEach(f => {
        if (!f.feature_key) {
          console.warn('Found corrupted feature flag (missing key):', f);
          toDelete.push(f);
        }
      });

      if (toDelete.length > 0) {
        console.warn(`Found ${toDelete.length} records to clean up...`, toDelete);
        toDelete.forEach(async (item) => {
          try {
            await FeatureFlag.delete(item.id);
            console.log(`Deleted cleanup item: ${item.id}`);
          } catch (e) {
            console.error('Failed to delete item:', e);
          }
        });
      }

      const featureMap = {};
      Object.values(keyMap).forEach(f => {
        if (f.feature_key) { // Only map valid features
          featureMap[f.feature_key] = f;
        }
      });

      // Merge with definitions
      const merged = FEATURE_DEFINITIONS.map(def => ({
        ...def,
        ...featureMap[def.feature_key],
        id: featureMap[def.feature_key]?.id
      }));

      setFeatures(merged);
      setLoading(false);
    } catch (error) {
      console.error('Error loading features:', error);
      toast.error('Failed to load features');
      setLoading(false);
    }
  };

  const initializeFeatures = async () => {
    try {
      setLoading(true);
      
      // Get fresh list from backend to be sure
      const existingFeatures = await FeatureFlag.list();
      const existingKeys = new Set(existingFeatures.map(f => f.feature_key).filter(Boolean));
      
      let createdCount = 0;

      for (const def of FEATURE_DEFINITIONS) {
        if (!existingKeys.has(def.feature_key)) {
          console.log(`✨ Initializing missing feature: ${def.feature_key}`);
          await FeatureFlag.create({
            feature_key: def.feature_key,
            feature_name: def.feature_name,
            description: def.description,
            category: def.category,
            is_advanced: def.is_advanced,
            // CRITICAL: Default advanced features to FALSE (disabled)
            // Only basic operations features should be enabled by default
            is_enabled: !def.is_advanced 
          });
          createdCount++;
        }
      }
      
      if (createdCount > 0) {
        toast.success(`Initialized ${createdCount} new features`);
      } else {
        toast.info('All features already initialized');
      }
      
      await loadFeatures();
    } catch (error) {
      console.error('Error initializing features:', error);
      toast.error('Failed to initialize features');
      setLoading(false);
    }
  };

  const { refresh: refreshGlobalFlags } = useFeatureFlags();

  const toggleFeature = async (feature) => {
    setUpdating({ ...updating, [feature.feature_key]: true });
    
    // Optimistic update
    const newStatus = !feature.is_enabled;
    setFeatures(prev => prev.map(f => 
      f.feature_key === feature.feature_key ? { ...f, is_enabled: newStatus } : f
    ));

    try {
      if (!feature.id) {
        // Create new feature
        const created = await FeatureFlag.create({
          feature_key: feature.feature_key,
          feature_name: feature.feature_name,
          description: feature.description,
          category: feature.category,
          is_advanced: feature.is_advanced,
          is_enabled: newStatus
        });
        
        // Update with real ID from backend
        setFeatures(prev => prev.map(f => 
          f.feature_key === feature.feature_key ? { ...f, id: created.id } : f
        ));
        
        toast.success(`${feature.feature_name} ${newStatus ? 'enabled' : 'disabled'}`);
      } else {
        // Update existing
        // CRITICAL: Send FULL object because PUT replaces the resource
        // If we only send is_enabled, other fields might be lost if backend uses PUT
        await FeatureFlag.update(feature.id, {
          feature_key: feature.feature_key,
          feature_name: feature.feature_name,
          description: feature.description,
          category: feature.category,
          is_advanced: feature.is_advanced,
          is_enabled: newStatus
        });
        
        toast.success(`${feature.feature_name} ${newStatus ? 'enabled' : 'disabled'}`);
      }
      
      // Refresh global context so other components see the change
      refreshGlobalFlags();
      
      // We skip loadFeatures() here to avoid race conditions with stale data
      // The optimistic update is enough for the UI
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error(`Failed to update feature: ${error.message || 'Unknown error'}`);
      
      // Revert on error
      setFeatures(prev => prev.map(f => 
        f.feature_key === feature.feature_key ? { ...f, is_enabled: !newStatus } : f
      ));
    } finally {
      setUpdating(prev => ({ ...prev, [feature.feature_key]: false }));
    }
  };

  const enableAllAdvanced = async () => {
    setLoading(true);
    try {
      for (const feature of features.filter(f => f.is_advanced)) {
        if (!feature.is_enabled) {
          if (feature.id) {
            await FeatureFlag.update(feature.id, { is_enabled: true });
          } else {
            // Create if missing
            await FeatureFlag.create({
              feature_key: feature.feature_key,
              feature_name: feature.feature_name,
              description: feature.description,
              category: feature.category,
              is_advanced: feature.is_advanced,
              is_enabled: true
            });
          }
        }
      }
      toast.success('All advanced features enabled!');
      await loadFeatures();
    } catch (error) {
      console.error('Error enabling features:', error);
      toast.error('Failed to enable features');
      setLoading(false);
    }
  };

  const disableAllAdvanced = async () => {
    setLoading(true);
    try {
      const advancedWithIds = features.filter(f => f.is_advanced && f.id);
      
      console.log('🔄 Disabling features:', advancedWithIds.map(f => ({
        key: f.feature_key,
        id: f.id,
        current: f.is_enabled
      })));
      
      for (const feature of advancedWithIds) {
        if (feature.is_enabled) {
          console.log(`🔴 Disabling ${feature.feature_key} (ID: ${feature.id})`);
          await FeatureFlag.update(feature.id, { is_enabled: false });
        }
      }
      
      toast.success('All advanced features disabled!');
      await loadFeatures();
    } catch (error) {
      console.error('Error disabling features:', error);
      toast.error('Failed to disable features: ' + error.message);
      setLoading(false);
    }
  };

  const advancedFeatures = features.filter(f => f.is_advanced);
  const basicFeatures = features.filter(f => !f.is_advanced);
  const advancedEnabled = advancedFeatures.filter(f => f.is_enabled).length;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading features...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Feature Management</h3>
              <p className="text-sm text-slate-700 mb-3">
                Control which features are available in your Shuttle Pro system. Advanced features are part of premium tiers and can be enabled/disabled based on your customer's subscription.
              </p>
              <div className="flex gap-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  {advancedEnabled}/{advancedFeatures.length} Advanced Features Active
                </Badge>
                <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                  {basicFeatures.length} Basic Features (Always On)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tier Management */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            Subscription Tier Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Standard Tier */}
            <div 
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${advancedEnabled === 0 ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
              onClick={disableAllAdvanced}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900">Standard Tier</h4>
                {advancedEnabled === 0 && <Badge className="bg-blue-600">Active</Badge>}
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Basic operations only. All advanced AI, Analytics, and Integration features are <strong>disabled</strong>.
              </p>
              <Button 
                size="sm" 
                variant={advancedEnabled === 0 ? "outline" : "default"}
                className="w-full"
                onClick={(e) => { e.stopPropagation(); disableAllAdvanced(); }}
              >
                {advancedEnabled === 0 ? 'Re-apply Standard Defaults' : 'Downgrade to Standard'}
              </Button>
            </div>

            {/* Premium Tier */}
            <div 
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${advancedEnabled > 0 ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}
              onClick={enableAllAdvanced}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900">Premium Tier</h4>
                {advancedEnabled > 0 && <Badge className="bg-purple-600">Active</Badge>}
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Full access to all features including AI Agents, Webhooks, and Advanced Analytics.
              </p>
              <Button 
                size="sm" 
                variant={advancedEnabled > 0 ? "outline" : "default"}
                className={advancedEnabled > 0 ? "w-full border-purple-200 text-purple-700 hover:bg-purple-100" : "w-full bg-purple-600 hover:bg-purple-700"}
                onClick={(e) => { e.stopPropagation(); enableAllAdvanced(); }}
              >
                {advancedEnabled === features.filter(f => f.is_advanced).length ? 'Re-apply Premium Defaults' : 'Upgrade to Premium'}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={initializeFeatures} variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
              <RefreshCw className="w-3 h-3 mr-2" />
              Repair / Initialize Missing Flags
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Advanced Features (Premium Tier)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {advancedFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.feature_key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="w-5 h-5 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{feature.feature_name}</h4>
                      <Badge className={categoryColors[feature.category]}>
                        {feature.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feature.is_enabled === true}
                      onCheckedChange={() => toggleFeature(feature)}
                      disabled={updating[feature.feature_key]}
                    />
                    <Label className={`text-sm font-medium ${feature.is_enabled ? 'text-green-700' : 'text-red-600'}`}>
                      {feature.is_enabled ? '✓ Enabled' : '✗ Disabled'}
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Basic Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Basic Features (All Tiers)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {basicFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.feature_key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 opacity-75">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="w-5 h-5 text-slate-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{feature.feature_name}</h4>
                      <Badge className={categoryColors[feature.category]}>
                        {feature.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={true}
                      disabled={true}
                      className="data-[state=checked]:bg-slate-400"
                    />
                    <Label className="text-sm font-medium text-slate-500">
                      Always On
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feature Categories Legend */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Feature Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Badge className={categoryColors.ai}>AI Features</Badge>
              <p className="text-xs text-slate-600 mt-1">AI-powered automation</p>
            </div>
            <div>
              <Badge className={categoryColors.integrations}>Integrations</Badge>
              <p className="text-xs text-slate-600 mt-1">External connections</p>
            </div>
            <div>
              <Badge className={categoryColors.communication}>Communication</Badge>
              <p className="text-xs text-slate-600 mt-1">Guest messaging</p>
            </div>
            <div>
              <Badge className={categoryColors.analytics}>Analytics</Badge>
              <p className="text-xs text-slate-600 mt-1">Insights & reports</p>
            </div>
            <div>
              <Badge className={categoryColors.operations}>Operations</Badge>
              <p className="text-xs text-slate-600 mt-1">Core functionality</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}