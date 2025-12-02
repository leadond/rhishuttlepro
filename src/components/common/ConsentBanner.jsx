
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Eye, MapPin, Phone, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ConsentBanner({ onAccept, userRole = 'driver' }) {
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    const consentKey = `shuttle_pro_consent_${userRole}`;
    const hasConsented = localStorage.getItem(consentKey);
    
    if (!hasConsented) {
      setOpen(true);
    }
  }, [userRole]);

  const handleAccept = () => {
    if (!understood) {
      return;
    }

    const consentKey = `shuttle_pro_consent_${userRole}`;
    localStorage.setItem(consentKey, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      role: userRole
    }));

    setOpen(false);
    if (onAccept) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Employee Monitoring & Consent Notice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-semibold mb-2">
              ⚠️ IMPORTANT: By using this application, you consent to monitoring and GPS tracking.
            </p>
            <p className="text-blue-800 text-sm">
              This system is designed for operational efficiency and employee safety. All activities are recorded and monitored, including your real-time GPS location.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-600" />
              What We Monitor & Record
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Real-Time GPS Location Tracking</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Your vehicle's location is tracked continuously while you are signed in and on duty. 
                    GPS data is collected automatically when you use this application. This data is used for 
                    dispatch coordination, route optimization, safety monitoring, and is stored permanently for 
                    operational and legal purposes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Communications & Interactions</p>
                  <p className="text-sm text-slate-600 mt-1">
                    All system communications, ride assignments, status updates, and guest interactions are logged and recorded.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Activity Logs & Performance Data</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Your login times, ride completions, vehicle inspections, emergency alerts, and all system actions are permanently logged with timestamps.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">User Authentication & Access</p>
                  <p className="text-sm text-slate-600 mt-1">
                    All login attempts, session duration, and system access are monitored and recorded for security purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-amber-50 border border-amber-300 rounded-lg p-4">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Purpose of Monitoring
            </h3>
            <ul className="text-sm text-amber-900 space-y-2 list-disc list-inside">
              <li>Operational efficiency and dispatch coordination</li>
              <li>Employee safety and emergency response</li>
              <li>Customer service quality assurance</li>
              <li>Performance evaluation and training</li>
              <li>Compliance with company policies and legal requirements</li>
              <li>Investigation of incidents or complaints</li>
              <li>Vehicle and fleet management</li>
            </ul>
          </div>

          <div className="space-y-3 bg-slate-50 border border-slate-300 rounded-lg p-4">
            <h3 className="font-bold text-slate-900">Data Retention & Access</h3>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>All monitoring data including GPS location is retained indefinitely for operational and legal purposes</li>
              <li>Management, dispatchers, and authorized personnel have access to all recorded data</li>
              <li>Data may be used in disciplinary proceedings or legal matters</li>
              <li>You may request access to your personal data per company policy</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-2">No Expectation of Privacy</h3>
            <p className="text-sm text-red-800">
              While using this system and company vehicles, you have <strong>NO expectation of privacy</strong>. 
              All activities, communications, and locations may be monitored, recorded, and reviewed at any time 
              without further notice. <strong>GPS tracking begins automatically when you sign in.</strong>
            </p>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <Checkbox
              id="consent-checkbox"
              checked={understood}
              onCheckedChange={setUnderstood}
              className="mt-1"
            />
            <label
              htmlFor="consent-checkbox"
              className="text-sm font-medium text-blue-900 cursor-pointer leading-relaxed"
            >
              I have read and understand this notice. I acknowledge that by clicking "I Accept" and using this system, 
              I consent to all monitoring, recording, and GPS tracking described above. I understand that my location 
              will be tracked automatically while I am signed in. I understand that continued employment may be 
              contingent upon my acceptance of these monitoring practices.
            </label>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleAccept}
            disabled={!understood}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
          >
            I Accept - Enable GPS Tracking & Monitoring
          </Button>
          <p className="text-xs text-center text-slate-500 mt-3 w-full">
            By clicking "I Accept", you electronically sign this consent agreement and authorize GPS tracking. 
            Your acceptance is logged with a timestamp.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
