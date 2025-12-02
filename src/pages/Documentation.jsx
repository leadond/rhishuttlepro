import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, ExternalLink, Key, Globe, Check, AlertTriangle } from "lucide-react";

export default function Documentation() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">External API Integration</h1>
          <p className="text-lg text-slate-600">Integrate Shuttle Pro with your website or mobile app</p>
        </header>

        <Card className="shadow-lg border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              Before using the API, you must set the following environment variables in your application settings:
            </p>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-slate-900 mb-2">1. EXTERNAL_API_KEY</p>
              <p className="text-sm text-slate-600 mb-2">Generate a strong random key for authentication</p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">Example: 8f7e6d5c-4b3a-2918-7f6e-5d4c3b2a1918</code>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-slate-900 mb-2">2. APP_URL</p>
              <p className="text-sm text-slate-600 mb-2">Your Shuttle Pro app's public URL</p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">Example: https://your-app-url.com</code>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" />
              API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">1. Create Ride Request</h3>
              <Badge className="mb-2 bg-green-600">POST</Badge>
              <code className="block bg-slate-900 text-green-400 p-3 rounded-lg text-sm mb-3">
                POST /externalRideRequest
              </code>
              <p className="text-slate-700 mb-3">Submit a ride request from your external app.</p>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-slate-900">Request Body (JSON):</p>
                <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "api_key": "your-secret-api-key",
  "guest_name": "John Doe",
  "guest_room": "123",
  "guest_phone": "+18881234567",
  "pickup_location": "hotel-lobby",
  "destination": "museum-fine-arts",
  "special_requests": "Wheelchair accessible"
}`}
                </pre>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 mt-3">
                <p className="font-semibold text-slate-900">Response (JSON):</p>
                <pre className="bg-slate-900 text-blue-400 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "Ride request created successfully",
  "ride": {
    "id": "abc123...",
    "ride_code": "H7K3M2",
    "status": "pending",
    "tracking_url": "https://yourapp.com/PublicRideDetails?token=...",
    "guest_name": "John Doe",
    "pickup_location": "hotel-lobby",
    "destination": "museum-fine-arts",
    "created_at": "2025-01-15T10:30:00Z"
  }
}`}
                </pre>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">2. Get Ride Status</h3>
              <Badge className="mb-2 bg-blue-600">GET</Badge>
              <code className="block bg-slate-900 text-blue-400 p-3 rounded-lg text-sm mb-3">
                GET /getRideStatus?token=PUBLIC_TOKEN
              </code>
              <p className="text-slate-700 mb-3">Check the status and location of a ride.</p>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-slate-900">Query Parameters:</p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                  <li><code>token</code> - Public access token (for guests)</li>
                  <li>OR <code>api_key</code> + <code>ride_code</code> (for your backend)</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 mt-3">
                <p className="font-semibold text-slate-900">Response (JSON):</p>
                <pre className="bg-slate-900 text-blue-400 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "success": true,
  "ride": {
    "ride_code": "H7K3M2",
    "status": "assigned",
    "guest_name": "John Doe",
    "pickup_location": "hotel-lobby",
    "destination": "museum-fine-arts",
    "assigned_driver": "Michael Smith",
    "vehicle_number": "SHUTTLE-01",
    "driver_location": {
      "lat": 29.7074,
      "lng": -95.3981,
      "updated_at": "2025-01-15T10:35:00Z"
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
}`}
                </pre>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">3. Submit Rating</h3>
              <Badge className="mb-2 bg-purple-600">POST</Badge>
              <code className="block bg-slate-900 text-purple-400 p-3 rounded-lg text-sm mb-3">
                POST /submitRating
              </code>
              <p className="text-slate-700 mb-3">Submit a rating after ride completion.</p>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-slate-900">Request Body (JSON):</p>
                <pre className="bg-slate-900 text-purple-400 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "token": "public-access-token",
  "rating": 5,
  "service_quality": 5,
  "punctuality": 5,
  "vehicle_condition": 5,
  "would_recommend": true,
  "comments": "Great service!"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-orange-600" />
              Integration Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">JavaScript/React Example</h3>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`// Request a ride
async function requestRide(guestData) {
  const response = await fetch('https://your-app-url.com/api/functions/externalRideRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: 'your-secret-key',
      guest_name: guestData.name,
      guest_phone: guestData.phone,
      pickup_location: 'hotel-lobby',
      destination: 'museum-fine-arts'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Ride created:', data.ride.ride_code);
    console.log('Tracking URL:', data.ride.tracking_url);
    // Redirect guest to tracking page
    window.location.href = data.ride.tracking_url;
  }
}

// Check ride status
async function checkRideStatus(token) {
  const response = await fetch(
    \`https://your-app-url.com/api/functions/getRideStatus?token=\${token}\`
  );
  const data = await response.json();
  
  console.log('Ride status:', data.ride.status);
  console.log('Driver location:', data.ride.driver_location);
}

// Submit rating
async function submitRating(token, rating) {
  const response = await fetch('https://your-app-url.com/api/functions/submitRating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: token,
      rating: rating,
      would_recommend: true,
      comments: 'Great service!'
    })
  });
  
  const data = await response.json();
  console.log('Rating submitted:', data.success);
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Embedding the Tracking View</h3>
              <p className="text-slate-600 mb-3">
                You can embed the ride tracking page in your website using an iframe:
              </p>
              <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-sm overflow-x-auto">
{`<iframe 
  src="https://your-app-url.com/PublicRideDetails?token=GUEST_TOKEN"
  width="100%"
  height="600px"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
              Route Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-slate-700 font-semibold">
                🚨 Important: Shuttle Route Policies
              </p>
              
              <div className="bg-white p-4 rounded-lg border border-amber-200 space-y-3">
                <div>
                  <p className="text-slate-900 font-semibold mb-2">Policy 1: Hotel-Based Routes</p>
                  <ul className="space-y-2 text-slate-700 ml-4 list-disc">
                    <li><strong>FROM Hotel</strong> → Guests can go to <strong>ANY OTHER destination</strong></li>
                    <li><strong>FROM Any Other Location</strong> → Guests can <strong>ONLY return to Hotel</strong></li>
                  </ul>
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-slate-900 font-semibold mb-2">Policy 2: Different Locations Required</p>
                  <ul className="space-y-2 text-slate-700 ml-4 list-disc">
                    <li><strong>Pickup and destination MUST be different</strong></li>
                    <li>Cannot go from hotel-lobby to hotel-lobby</li>
                    <li>Cannot go from museum to same museum</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>These policies prevent misuse of the shuttle service.</strong> API requests that violate either policy will be rejected with a 400 error.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold mb-2">✅ Valid Examples:</p>
                <ul className="text-xs text-green-800 space-y-1 ml-4 list-disc">
                  <li><code>hotel-lobby</code> → <code>museum-fine-arts</code> ✓ (hotel to anywhere)</li>
                  <li><code>hotel-lobby</code> → <code>md-main-building</code> ✓ (hotel to anywhere)</li>
                  <li><code>museum-fine-arts</code> → <code>hotel-lobby</code> ✓ (anywhere to hotel)</li>
                  <li><code>starbucks-rice</code> → <code>hotel-lobby</code> ✓ (anywhere to hotel)</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold mb-2">❌ Invalid Examples:</p>
                <ul className="text-xs text-red-800 space-y-1 ml-4 list-disc">
                  <li><code>hotel-lobby</code> → <code>hotel-lobby</code> ✗ (same location)</li>
                  <li><code>museum-fine-arts</code> → <code>museum-fine-arts</code> ✗ (same location)</li>
                  <li><code>museum-fine-arts</code> → <code>md-main-building</code> ✗ (non-hotel to non-hotel)</li>
                  <li><code>starbucks-rice</code> → <code>damicos-rice</code> ✗ (non-hotel to non-hotel)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Check className="w-5 h-5" />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Never expose your API key</strong> in client-side code. Always call from your backend.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Use HTTPS</strong> for all API requests to ensure data encryption.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Validate phone numbers</strong> before sending to ensure proper SMS delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Monitor API usage</strong> and implement rate limiting on your end if needed.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Public tokens</strong> can be safely shared with guests for tracking and rating.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Available Location IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Hotels</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><code>hotel-lobby</code> - Hotel Lobby</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Rice Village</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><code>starbucks-rice</code> - Starbucks</li>
                  <li><code>damicos-rice</code> - D'Amico's</li>
                  <li><code>black-walnut-rice</code> - Black Walnut Cafe</li>
                  <li><code>banana-republic-rice</code> - Banana Republic</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Museum District</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><code>museum-natural-science</code> - Museum of Natural Science</li>
                  <li><code>museum-fine-arts</code> - Museum of Fine Arts</li>
                  <li><code>health-museum</code> - Health Museum</li>
                  <li><code>houston-zoo</code> - The Houston Zoo</li>
                  <li><code>holocaust-museum</code> - Holocaust Museum</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">MD Anderson</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><code>md-main-building</code> - Main Building</li>
                  <li><code>md-mays-clinic</code> - Mays Clinic</li>
                  <li><code>md-pickens-tower</code> - Pickens Tower</li>
                  <li><code>md-proton-therapy-1</code> - Proton Therapy 1</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
