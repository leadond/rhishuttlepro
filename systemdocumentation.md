# Shuttle Pro - Complete System Documentation

> **Generated:** 2025-11-28  
> **Platform:** Firebase / Vercel  
> **Version:** 1.0

---

## Table of Contents
1. [Database Schema (Entities)](#database-schema)
2. [Pages](#pages)
3. [Components](#components)
4. [Backend Functions](#backend-functions)
5. [API Endpoints](#api-endpoints)
6. [AI Agents](#ai-agents)
7. [Environment Variables](#environment-variables)
8. [Webhooks](#webhooks)

---

## Database Schema (Entities) {#database-schema}

### Built-in Attributes (All Entities)
All entities automatically include:
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (UUID) |
| `created_date` | datetime | When record was created |
| `updated_date` | datetime | When record was last updated |
| `created_by` | string | Email of user who created the record |

---

### 1. User (Built-in + Extended)
**Description:** System users with role-based access control

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | Yes | User's full name (built-in) |
| `email` | string | Yes | User's email address (built-in) |
| `role` | string | No | Legacy single role (built-in) |
| `roles` | array[enum] | No | Multiple roles: `admin`, `dispatcher`, `driver` |

**RLS Rules:** Built-in security - users can only view/update their own records; admins can manage all users.

---

### 2. Ride
**Description:** Core entity for shuttle ride requests and tracking

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `guest_name` | string | **Yes** | - | Guest's full name |
| `guest_room` | string | No | - | Room or booking number |
| `guest_phone` | string | No | - | Contact phone for SMS |
| `sms_consent_status` | enum | No | `none` | Values: `pending`, `granted`, `denied`, `none` |
| `sms_consent_timestamp` | datetime | No | - | When consent was given/denied |
| `pickup_location` | string | **Yes** | - | Pickup location ID |
| `destination` | string | **Yes** | - | Destination location ID |
| `special_requests` | string | No | - | Special requirements |
| `status` | enum | No | `pending` | Values: `pending`, `assigned`, `in-progress`, `completed`, `cancelled` |
| `assigned_driver` | string | No | - | Driver name assigned |
| `vehicle_number` | string | No | - | Shuttle vehicle number |
| `pickup_time` | datetime | No | - | Scheduled pickup time |
| `pending_timestamp` | datetime | No | - | When ride was created |
| `assigned_timestamp` | datetime | No | - | When driver was assigned |
| `in_progress_timestamp` | datetime | No | - | When guest was picked up |
| `completed_timestamp` | datetime | No | - | When ride completed |
| `cancelled_timestamp` | datetime | No | - | When ride was cancelled |
| `eta` | string | No | - | Estimated arrival time |
| `priority` | enum | No | `normal` | Values: `normal`, `high`, `emergency` |
| `ride_code` | string | No | - | Short reference code (e.g., ABC123) |
| `public_access_token` | string | No | - | UUID for public tracking link |
| `access_expires_at` | datetime | No | - | When public link expires |
| `is_archived` | boolean | No | `false` | Whether ride is archived |

**RLS Rules:**
- **Create:** Anyone
- **Read:** Admins, Dispatchers, or assigned driver
- **Update:** Admins, Dispatchers, or assigned driver
- **Delete:** Admins only

---

### 3. Vehicle
**Description:** Fleet vehicles with GPS tracking

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `shuttle_number` | string | **Yes** | - | Vehicle ID (e.g., S-101) |
| `current_driver` | string | No | - | Currently assigned driver |
| `status` | enum | No | `offline` | Values: `available`, `in-use`, `maintenance`, `offline` |
| `current_mileage` | number | No | - | Odometer reading |
| `fuel_level` | enum | No | - | Values: `full`, `3/4`, `1/2`, `1/4`, `low` |
| `last_maintenance` | date | No | - | Date of last maintenance |
| `location_lat` | number | No | - | GPS latitude |
| `location_lng` | number | No | - | GPS longitude |
| `location_accuracy` | number | No | - | GPS accuracy in meters |
| `location_updated` | datetime | No | - | Last GPS update |
| `capacity` | number | No | `8` | Passenger capacity |

**RLS Rules:**
- **Create:** Admins only
- **Read:** Admins, Dispatchers, Drivers
- **Update:** Admins, Dispatchers, or current driver
- **Delete:** Admins only

---

### 4. Driver
**Description:** Driver profiles and shift tracking

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `driver_name` | string | **Yes** | - | Driver's full name |
| `email` | string | No | - | Driver's email |
| `phone` | string | No | - | Driver's phone |
| `vehicle_id` | string | No | - | Assigned vehicle ID |
| `status` | enum | No | `signed-out` | Values: `signed-in`, `signed-out`, `on-ride`, `on-break` |
| `shift_start` | datetime | No | - | When driver signed in |
| `shift_end` | datetime | No | - | When driver signed out |
| `last_location_lat` | number | No | - | Last known latitude |
| `last_location_lng` | number | No | - | Last known longitude |
| `total_rides_today` | number | No | `0` | Rides completed today |

**RLS Rules:**
- **Create:** Admins or self (matching email)
- **Read:** Admins, Dispatchers, or self
- **Update:** Admins, Dispatchers, or self
- **Delete:** Admins only

---

### 5. Rating
**Description:** Guest feedback and ratings

| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| `ride_id` | string | **Yes** | - | Associated ride ID |
| `driver_id` | string | No | - | Driver being rated |
| `vehicle_id` | string | No | - | Vehicle used |
| `guest_phone` | string | No | - | Guest contact |
| `rating` | number | **Yes** | 1-5 | Overall star rating |
| `service_quality` | number | No | 1-5 | Service quality rating |
| `punctuality` | number | No | 1-5 | Punctuality rating |
| `vehicle_condition` | number | No | 1-5 | Vehicle condition rating |
| `would_recommend` | boolean | No | - | Would recommend service |
| `comments` | string | No | - | Feedback comments |
| `flagged_for_review` | boolean | No | `false` | Flagged for management |
| `reviewed_by` | string | No | - | Reviewer email |
| `reviewed_at` | datetime | No | - | When reviewed |

**RLS Rules:**
- **Read:** Admins, Dispatchers
- **Write:** Anyone (public submissions)

---

### 6. EmergencyAlert
**Description:** Emergency alerts and incidents

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `alert_type` | enum | **Yes** | - | Values: `driver-emergency`, `vehicle-breakdown`, `medical`, `security`, `weather`, `general` |
| `driver_id` | string | No | - | Driver who triggered |
| `vehicle_id` | string | No | - | Vehicle involved |
| `location_lat` | number | No | - | Emergency latitude |
| `location_lng` | number | No | - | Emergency longitude |
| `message` | string | **Yes** | - | Emergency details |
| `status` | enum | No | `active` | Values: `active`, `acknowledged`, `resolved` |
| `priority` | enum | No | `high` | Values: `low`, `medium`, `high`, `critical` |
| `acknowledged_by` | string | No | - | Dispatcher who acknowledged |
| `resolved_time` | datetime | No | - | When resolved |

**RLS Rules:**
- **Create:** Admins, Dispatchers, or creator
- **Read:** Admins, Dispatchers, or creator
- **Update:** Admins, Dispatchers
- **Delete:** Admins only

---

### 7. MaintenanceLog
**Description:** Vehicle inspection records

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicle_id` | string | **Yes** | Vehicle being inspected |
| `driver_id` | string | **Yes** | Driver performing inspection |
| `inspection_type` | enum | **Yes** | Values: `pre-trip`, `post-trip`, `scheduled`, `emergency` |
| `mileage` | number | No | Odometer reading |
| `fuel_level` | enum | No | Values: `full`, `3/4`, `1/2`, `1/4`, `low` |
| `lights_ok` | boolean | No | Lights functioning |
| `brakes_ok` | boolean | No | Brakes working |
| `tires_ok` | boolean | No | Tires condition |
| `interior_clean` | boolean | No | Interior presentable |
| `emergency_equipment` | boolean | No | Equipment accessible |
| `communication_ok` | boolean | No | Comms working |
| `notes` | string | No | Additional notes |
| `passed` | boolean | No | Inspection passed |

**RLS Rules:**
- **Read/Write:** Admins, Dispatchers, or creator (drivers)

---

### 8. Webhook
**Description:** External webhook subscriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | **Yes** | - | Webhook endpoint URL |
| `events` | array[enum] | **Yes** | - | Subscribed events (see below) |
| `secret` | string | **Yes** | - | HMAC signature secret |
| `is_active` | boolean | No | `true` | Whether active |
| `description` | string | No | - | Webhook description |
| `last_triggered_at` | datetime | No | - | Last successful trigger |
| `last_error` | string | No | - | Last error message |
| `failure_count` | number | No | `0` | Consecutive failures |
| `total_deliveries` | number | No | `0` | Total successful deliveries |

**Supported Events:**
```
ride.created, ride.assigned, ride.in_progress, ride.completed, ride.cancelled,
vehicle.status_changed, vehicle.location_updated,
alert.created, alert.resolved,
driver.signed_in, driver.signed_out,
rating.submitted
```

**RLS Rules:** Open (no restrictions)

---

### 9. FeatureFlag
**Description:** Feature toggle management

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `feature_key` | string | **Yes** | - | Unique identifier |
| `feature_name` | string | **Yes** | - | Display name |
| `description` | string | No | - | Feature description |
| `is_enabled` | boolean | **Yes** | `true` | Whether enabled |
| `is_advanced` | boolean | No | `false` | Premium feature flag |
| `category` | enum | No | - | Values: `ai`, `integrations`, `communication`, `analytics`, `operations` |

**RLS Rules:**
- **Read:** Anyone
- **Write:** System owners only

---

### 10. AuditLog
**Description:** System audit trail

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_email` | string | **Yes** | User who performed action |
| `user_name` | string | No | User's name |
| `action` | string | **Yes** | Action type |
| `entity_type` | string | **Yes** | Entity affected |
| `entity_id` | string | No | Entity ID |
| `details` | string | No | Action details |
| `timestamp` | datetime | No | When occurred |

**RLS Rules:**
- **Read:** Admins only
- **Write:** Anyone (system writes)

---

### 11. SimulationState
**Description:** Demo/simulation mode state

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `is_running` | boolean | No | `false` | Simulation active |
| `started_at` | datetime | No | - | Start time |
| `stopped_at` | datetime | No | - | Stop time |
| `rides_created` | number | No | `0` | Rides generated |
| `ratings_created` | number | No | `0` | Ratings generated |
| `alerts_created` | number | No | `0` | Alerts generated |

**RLS Rules:**
- **Read/Write:** Admins, Dispatchers

---

## Pages {#pages}

| Page | File | Description | Access |
|------|------|-------------|--------|
| **Dashboard** | `pages/Dashboard.js` | Main analytics and overview | Admin |
| **Admin** | `pages/Admin.js` | User, vehicle, webhook, feature management | Admin |
| **DispatcherControl** | `pages/DispatcherControl.js` | Real-time fleet management, ride assignment | Admin, Dispatcher |
| **DriverDashboard** | `pages/DriverDashboard.js` | Driver shift management, ride acceptance | Driver |
| **GuestPortal** | `pages/GuestPortal.js` | Guest ride booking interface | Public |
| **TVMonitor** | `pages/TVMonitor.js` | Large screen display for lobby | Admin, Dispatcher |
| **PublicRideDetails** | `pages/PublicRideDetails.js` | Public ride tracking page | Public (with token) |
| **Help** | `pages/Help.js` | Documentation and help | All roles |
| **Documentation** | `pages/Documentation.js` | API integration guide | Admin |

---

## Components {#components}

### Admin Components
| Component | Path | Description |
|-----------|------|-------------|
| CustomerOnboarding | `components/admin/CustomerOnboarding.js` | Bulk user/vehicle import via CSV |
| FeatureManagement | `components/admin/FeatureManagement.js` | Feature flag toggles |
| RolesManagement | `components/admin/RolesManagement.js` | User role assignment |
| VehicleManagement | `components/admin/VehicleManagement.js` | Fleet CRUD operations |

### Dispatcher Components
| Component | Path | Description |
|-----------|------|-------------|
| CreateRideRequest | `components/dispatcher/CreateRideRequest.js` | Manual ride creation modal |
| FleetMap | `components/dispatcher/FleetMap.js` | Real-time fleet map |
| RideManagement | `components/dispatcher/RideManagement.js` | Ride queue and assignment |
| DriverStatus | `components/dispatcher/DriverStatus.js` | Driver availability board |
| EmergencyPanel | `components/dispatcher/EmergencyPanel.js` | Emergency alert management |
| AnalyticsDashboard | `components/dispatcher/AnalyticsDashboard.js` | Performance charts |
| SimulationControl | `components/dispatcher/SimulationControl.js` | Demo mode controls |

### Driver Components
| Component | Path | Description |
|-----------|------|-------------|
| DriverLogin | `components/driver/DriverLogin.js` | Driver shift login |
| VehicleInspection | `components/driver/VehicleInspection.js` | Pre-trip inspection form |
| RideRequests | `components/driver/RideRequests.js` | Available ride queue |
| DriverStats | `components/driver/DriverStats.js` | Driver performance stats |
| DriverAlerts | `components/driver/DriverAlerts.js` | Emergency alert triggers |
| DriverRideHistory | `components/driver/DriverRideHistory.js` | Completed rides |
| LocationTracker | `components/driver/LocationTracker.js` | GPS location updates |

### Guest Components
| Component | Path | Description |
|-----------|------|-------------|
| GuestLogin | `components/guest/GuestLogin.js` | Guest identification form |
| RideTracker | `components/guest/RideTracker.js` | Real-time ride tracking |
| RatingForm | `components/guest/RatingForm.js` | Post-ride feedback |
| GuestChat | `components/guest/GuestChat.js` | AI chat interface |

### Map Components
| Component | Path | Description |
|-----------|------|-------------|
| TomTomMap | `components/maps/TomTomMap.js` | Leaflet-based fleet map |
| RouteMap | `components/maps/RouteMap.js` | Route visualization |

### Common Components
| Component | Path | Description |
|-----------|------|-------------|
| WebhookTrigger | `components/common/WebhookTrigger.js` | Webhook dispatch utility |
| LocationData | `components/common/LocationData.js` | Location ID mappings |
| TimeSince | `components/common/TimeSince.js` | Relative time display |
| ConsentBanner | `components/common/ConsentBanner.js` | TCPA SMS consent |

### Context Providers
| Component | Path | Description |
|-----------|------|-------------|
| SimulationContext | `components/contexts/SimulationContext.js` | Simulation state provider |
| FeatureFlagsContext | `components/contexts/FeatureFlagsContext.js` | Feature flags provider |

---

## Backend Functions {#backend-functions}

### 1. externalRideRequest
**Purpose:** Public API endpoint to create ride requests from external applications

**Method:** `POST`

**Authentication:**
1. Bearer Token (Recommended): `Authorization: Bearer <EXTERNAL_API_KEY>`
2. Body: `{ "api_key": "<EXTERNAL_API_KEY>", ... }`
3. Query: `?api_key=<EXTERNAL_API_KEY>`

**Request Body:**
```json
{
  "guest_name": "John Doe",        // Required
  "guest_room": "123",             // Optional
  "guest_phone": "+18881234567",   // Optional
  "pickup_location": "hotel-lobby", // Required
  "destination": "museum-fine-arts", // Required
  "special_requests": "Wheelchair", // Optional
  "priority": "normal"             // Optional: normal|high|emergency
}
```

**Response:**
```json
{
  "success": true,
  "ride": {
    "id": "uuid",
    "ride_code": "ABC123",
    "status": "pending",
    "tracking_url": "https://your-app-url.com/PublicRideDetails?token=..."
  }
}
```

**Validation Rules:**
- Pickup and destination cannot be the same
- Non-hotel pickups must have `hotel-lobby` as destination

---

### 2. getRideStatus
**Purpose:** Get current ride status and driver location

**Method:** `GET`

**Authentication Options:**
- Guest: `?token=<public_access_token>`
- Backend: `Authorization: Bearer <EXTERNAL_API_KEY>` + `?ride_code=ABC123`

**Response:**
```json
{
  "success": true,
  "ride": {
    "ride_code": "ABC123",
    "status": "assigned",
    "guest_name": "John Doe",
    "driver_location": {
      "lat": 29.7074,
      "lng": -95.3981,
      "accuracy": 10,
      "updated_at": "2025-01-15T10:30:00Z"
    },
    "eta": "5 minutes"
  }
}
```

---

### 3. submitRating
**Purpose:** Submit guest feedback for completed rides

**Method:** `POST`

**Authentication:**
- Guest: `{ "token": "<public_access_token>", ... }`
- Backend: Bearer token + `{ "ride_code": "ABC123", ... }`

**Request Body:**
```json
{
  "token": "public-access-token",
  "rating": 5,
  "service_quality": 5,
  "punctuality": 5,
  "vehicle_condition": 5,
  "would_recommend": true,
  "comments": "Great service!"
}
```

**Validation:**
- Ride must be in `completed` status
- Rating must be 1-5
- Cannot rate same ride twice

---

### 4. sendRideSMS
**Purpose:** Send SMS notifications via Twilio

**Method:** `POST` (Internal use only)

**Required Secrets:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

**Request Body:**
```json
{
  "phone": "+18881234567",
  "message": "Your ride is on the way!",
  "rideLink": "https://...",
  "rideId": "uuid",
  "messageType": "notification" // or "consent"
}
```

**TCPA Compliance:**
- Checks `sms_consent_status` before sending notifications
- Consent request messages bypass this check

---

### 5. twilioWebhook
**Purpose:** Handle incoming SMS replies (STOP/START/HELP)

**Method:** `POST` (Twilio callback)

**Handles:**
- `STOP`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT` → Opt-out
- `START`, `UNSTOP`, `YES`, `Y` → Opt-in
- `HELP`, `INFO` → Help message

**Security:** Validates Twilio signature

---

### 6. voiceHandler
**Purpose:** AI-powered voice calls for ride booking

**Method:** `POST` (Twilio callback)

**Required Secrets:**
- `TWILIO_AUTH_TOKEN`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY` (optional, fallback to OpenAI TTS)

**Features:**
- Speech-to-text input
- LLM-powered conversation
- Text-to-speech responses
- Automatic ride creation

---

### 7. registerWebhook
**Purpose:** Webhook CRUD management

**Method:** `POST`

**Actions:**
- `list` - List all webhooks
- `create` - Register new webhook
- `update` - Update webhook settings
- `delete` - Remove webhook
- `test` - Send test payload

**Request (Create):**
```json
{
  "action": "create",
  "url": "https://your-app.com/webhook",
  "events": ["ride.created", "ride.completed"],
  "description": "Production webhook"
}
```

---

### 8. triggerWebhooks
**Purpose:** Internal webhook dispatcher

**Method:** `POST` (Internal use)

**Payload:**
```json
{
  "event": "ride.created",
  "data": { ... }
}
```

**Features:**
- HMAC-SHA256 signature generation
- 10-second timeout
- Auto-disable after 10 consecutive failures

---

### 9. runSimulation
**Purpose:** Demo/simulation mode controller

**Method:** `POST`

**Actions:**
- `start` - Start simulation
- `stop` - Stop simulation
- `tick` - Progress simulation state

**Features:**
- Creates realistic ride data
- Moves vehicle locations
- Generates ratings and alerts
- Auto-stops after 1 hour

---

### 10. createUser
**Purpose:** Create new users

**Method:** `POST`

**Request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "roles": ["driver"]
}
```

---

### 11. updateUserPassword
**Purpose:** Update user password

**Method:** `POST`

---

## API Endpoints Summary {#api-endpoints}

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/functions/externalRideRequest` | POST | API Key | Create ride from external app |
| `/functions/getRideStatus` | GET | Token or API Key | Get ride status |
| `/functions/submitRating` | POST | Token or API Key | Submit rating |
| `/functions/registerWebhook` | POST | Admin session | Webhook management |

### API Key Header Format
```
Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx
Content-Type: application/json
```

---

## AI Agents {#ai-agents}

### ride_request_agent
**Purpose:** Conversational AI for booking shuttle rides

**Capabilities:**
- Create rides
- Read ride status

**Policies Enforced:**
1. Non-hotel pickups must go to hotel-lobby
2. Pickup and destination must be different

**Available Locations (23 total):**

| Category | Location IDs |
|----------|--------------|
| Hotel | `hotel-lobby` |
| Rice Village | `starbucks-rice`, `damicos-rice`, `black-walnut-rice`, `banana-republic-rice` |
| Museum District | `museum-natural-science`, `museum-fine-arts`, `health-museum`, `hermann-park`, `houston-zoo`, `holocaust-museum` |
| Churches | `palmer-memorial`, `christ-the-king`, `st-vincent` |
| Medical District | `medical-center-main`, `medical-center-north`, `medical-center-south`, `medical-center-east`, `medical-center-west` |

---

## Environment Variables {#environment-variables}

Before using the API, you must set the following environment variables in your application settings:

| Secret Name | Purpose | Required |
|-------------|---------|----------|
| `EXTERNAL_API_KEY` | API authentication for external integrations | Yes (for API) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes (for SMS) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes (for SMS) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164 format) | Yes (for SMS) |
| `OPENAI_API_KEY` | OpenAI API key for LLM | Yes (for voice AI) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (optional) | No |
| `TOMTOM_API_KEY` | TomTom Maps API | No |
| `WEBHOOK_INTERNAL_KEY` | Internal webhook security | Yes (for webhooks) |
| `RHI_WEBHOOK_URL` | External webhook endpoint | No |
| `SUPABASE_URL` | Supabase URL (if applicable) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase key (if applicable) | No |

---

## Webhooks {#webhooks}

### Payload Structure
```json
{
  "event": "ride.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "ride_id": "uuid",
    "ride_code": "ABC123",
    "guest_name": "John Doe",
    "status": "pending",
    ...
  }
}
```

### Headers
| Header | Description |
|--------|-------------|
| `X-Shuttle-Signature` | HMAC-SHA256 signature (`sha256=...`) |
| `X-Shuttle-Event` | Event name |
| `X-Shuttle-Delivery-ID` | Unique delivery ID |
| `Content-Type` | `application/json` |

### Signature Verification (Node.js)
```javascript
const crypto = require('crypto');
const signature = req.headers['x-shuttle-signature'];
const expectedSig = 'sha256=' + crypto
  .createHmac('sha256', YOUR_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature === expectedSig) {
  // Valid webhook
}
```

---

## Security Notes

1. **API Keys:** Never expose `EXTERNAL_API_KEY` in client-side code
2. **Webhook Secrets:** Store securely, rotate periodically
3. **TCPA Compliance:** SMS requires explicit consent
4. **RLS Rules:** Entity-level access control enforced by backend
5. **Twilio Signatures:** Always validate in production

---

*End of Documentation*