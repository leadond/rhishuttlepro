
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Users, Shield, Truck, Phone, FileText, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SimulationControl from "../components/dispatcher/SimulationControl";

// Helper function to parse bold markdown within text segments
const parseBold = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  const parts = text.split('**');
  return parts.map((part, j) =>
    // Every other part (odd indices) is considered bold
    j % 2 === 1 ? <strong key={j} className="font-semibold text-slate-900">{part}</strong> : part
  );
};

const helpContent = {
  gettingStarted: {
    title: "Getting Started",
    icon: BookOpen,
    color: "text-blue-600",
    articles: [
      {
        title: "Welcome to Shuttle Pro",
        role: "all",
        content: `Shuttle Pro is a comprehensive fleet management system designed for hotels, resorts, and event venues. It provides real-time coordination between guests, drivers, and dispatchers.

**Key Features:**
• Real-time GPS tracking
• Automated ride assignments
• Guest rating system
• Emergency alert broadcasts
• Performance analytics
• Multi-channel booking (form, AI chat, voice)

**User Roles:**
• **Guests:** Request rides, track shuttles, rate service
• **Drivers:** Accept rides, navigate routes, perform vehicle inspections
• **Dispatchers:** Manage fleet, assign drivers, handle emergencies
• **Admins:** Configure users, view analytics, manage system settings`
      },
      {
        title: "First Time Setup",
        role: "admin",
        content: `**Step 1: User Management**
1. Go to Admin Panel from the dashboard
2. Click "Invite User" (in the main project dashboard)
3. Assign appropriate roles: Admin, Dispatcher, or Driver
4. Users receive email invitations to join

**Step 2: Vehicle Setup**
1. Go to Dashboard → Data → Vehicle
2. Add your fleet vehicles with:
   - Shuttle number (e.g., "S001")
   - Capacity (passenger count)
   - Initial fuel level
3. Set status to "offline" initially

**Step 3: Configure Communications**
1. Set up Twilio credentials in app secrets for SMS
2. Configure TomTom API key for maps
3. Test emergency alert system

**Step 4: Test Workflow**
1. Have a driver sign in and complete vehicle inspection
2. Create a test ride request as a guest
3. Assign the ride from Dispatcher Control
4. Complete the ride and submit a rating`
      }
    ]
  },
  
  adminGuide: {
    title: "Administrator Guide",
    icon: Shield,
    color: "text-red-600",
    articles: [
      {
        title: "Managing Users and Roles",
        role: "admin",
        content: `**Adding New Users:**
1. Navigate to the Admin Panel
2. New users must be invited through the main project dashboard (outside the app preview)
3. Once invited, assign roles in the Admin Panel

**Available Roles:**
• **Admin:** Full system access, user management, analytics
• **Dispatcher:** Fleet management, ride assignments, emergency handling
• **Driver:** Vehicle operations, ride acceptance, customer service

**Assigning Multiple Roles:**
Users can have multiple roles. For example:
• An admin who also drives can have both Admin and Driver roles
• A dispatcher supervisor can have Admin and Dispatcher roles

**Removing Users:**
1. Go to Admin Panel
2. Click the trash icon next to the user
3. Confirm removal - this immediately revokes all access

**Best Practices:**
• Assign minimum necessary permissions
• Regularly audit user access
• Remove inactive users promptly
• Keep at least 2 admins for redundancy`
      },
      {
        title: "Analytics and Reporting",
        role: "admin",
        content: `**Accessing Analytics:**
Navigate to Dispatcher Control → Analytics Tab

**Key Metrics:**
• **Total Rides:** Overall service volume
• **Completion Rate:** Percentage of successful rides
• **Average Rating:** Customer satisfaction score
• **Vehicle Utilization:** Which shuttles are most active

**Understanding the Charts:**

**1. Daily Ride Volume:**
Shows ride trends over the last 7 days
• Blue bars = Total rides
• Green line = Completed rides
Use this to identify busy periods

**2. Popular Routes:**
Top 5 most requested pickup/destination combinations
• Helps with fleet positioning
• Informs staffing decisions

**3. Rating Distribution:**
Customer satisfaction breakdown by star rating
• Flag low ratings for review
• Identify service improvement areas

**4. Vehicle Performance:**
Compare shuttle utilization and efficiency
• Identify underutilized vehicles
• Plan maintenance schedules

**5. Category Ratings:**
Detailed scores for:
• Service Quality
• Punctuality
• Vehicle Condition

**Exporting Data:**
Currently, analytics are view-only. For custom reports, contact support or export entity data from the Dashboard → Data section.`
      },
      {
        title: "System Configuration",
        role: "admin",
        content: `**Required Secrets (Environment Variables):**

Go to your project dashboard → Settings → Secrets to configure:

**1. TWILIO_ACCOUNT_SID**
• Your Twilio account identifier
• Get from: https://console.twilio.com

**2. TWILIO_AUTH_TOKEN**
• Twilio authentication token
• Get from: https://console.twilio.com

**3. TWILIO_PHONE_NUMBER**
• Verified Twilio phone number
• Format: +1XXXXXXXXXX

**4. TOMTOM_API_KEY**
• Required for maps and routing
• Get from: https://developer.tomtom.com

**5. OPENAI_API_KEY** (Optional)
• Powers AI chat assistant
• Get from: https://platform.openai.com

**6. ELEVENLABS_API_KEY** (Optional)
• Voice calling functionality
• Get from: https://elevenlabs.io

**Testing Configuration:**
1. SMS: Create a test ride with your phone number
2. Maps: Check if vehicles appear on Dispatcher map
3. AI Chat: Try booking via AI assistant on Guest Portal

**Troubleshooting:**
• 401 Errors → Check API credentials
• SMS not sending → Verify Twilio phone is verified
• Maps not loading → Check TomTom API key validity`
      }
    ]
  },

  dispatcherGuide: {
    title: "Dispatcher Guide",
    icon: Shield,
    color: "text-indigo-600",
    articles: [
      {
        title: "Managing the Fleet",
        role: "dispatcher",
        content: `**Dispatcher Control Overview:**

Navigate to: Dispatcher Control from main menu

**Main Tabs:**
• **Fleet Overview:** Live map with all vehicles
• **Ride Management:** Assign and manage rides
• **Alert Center:** Handle emergencies
• **Analytics:** Performance metrics

**Reading the Status Board:**
• **Active Drivers:** Vehicles online and available
• **Pending Rides:** Waiting for assignment
• **Rides In-Service:** Currently active
• **Active Alerts:** Emergencies requiring attention

**Fleet Map Features:**
• 🚐 Blue markers = Available vehicles
• 🚨 Red markers = In-use vehicles
• 📍 Green pins = Pickup locations
• 📍 Blue pins = Destinations
• Real-time GPS updates every 30 seconds

**Quick Actions:**
• Click "Create Ride" to manually book for walk-up guests
• Click "Broadcast Alert" for emergency notifications
• Use "Refresh" if data seems stale`
      },
      {
        title: "Assigning Rides to Drivers",
        role: "dispatcher",
        content: `**Assigning Pending Rides:**

1. **Review Pending Queue:**
   • Check guest name and room number
   • Note special requests (wheelchair, luggage, etc.)
   • Verify pickup and destination locations
   • Check how long ride has been pending

2. **Select Best Driver:**
   Consider:
   • Driver proximity to pickup location
   • Vehicle capacity for passenger needs
   • Driver ratings and experience
   • Special equipment requirements

3. **Make Assignment:**
   • Click "Assign Vehicle" dropdown
   • Select driver from available list
   • System shows: Vehicle # (Driver Name)
   • Click "Assign Driver"

4. **Confirmation:**
   • Ride moves from Pending to Active
   • Driver receives notification
   • Guest receives SMS with tracking link
   • Vehicle status changes to "in-use"

**Reassigning Active Rides:**

If you need to change drivers mid-ride:
1. Go to Active Rides section
2. Click "Reassign" on the ride
3. Select new vehicle from dropdown
4. Original vehicle becomes available
5. New driver receives assignment

**Unassigning Rides:**

To return a ride to pending:
1. Click "Unassign" on active ride
2. Ride returns to pending queue
3. Vehicle becomes available
4. Guest notified of delay

**Best Practices:**
• Assign rides within 2 minutes
• Balance workload among drivers
• Consider traffic and distance
• Communicate delays to guests`
      },
      {
        title: "Taking Drivers Offline",
        role: "dispatcher",
        content: `**When to Take Drivers Offline:**
• End of shift
• Vehicle maintenance needed
• Driver break time
• Emergency situations
• Performance issues

**How to Take Driver Offline:**

**Method 1: Via Driver Status Panel**
1. Go to Fleet Overview tab
2. Find driver in Driver Status list
3. Click "Take Offline" button
4. Vehicle status changes to "offline"
5. Driver can no longer accept rides

**Method 2: Via Ride Unassignment**
1. If driver has an active ride, unassign it first
2. This frees the vehicle
3. Vehicle automatically becomes available
4. Use Driver Status panel to fully offline them

**What Happens:**
• Driver's app shows they're offline
• Vehicle disappears from available pool
• Any active rides must be completed first
• Driver can sign back in later

**Bringing Drivers Online:**
Drivers must sign in themselves:
1. Driver logs into Driver Dashboard
2. Selects vehicle
3. Completes pre-trip inspection
4. System sets them to "available"

**Emergency Offline:**
For immediate removal:
1. Unassign all active rides
2. Take vehicle offline
3. Contact driver directly
4. Document reason in maintenance log

**Best Practices:**
• Give drivers advance notice of offline time
• Don't offline during active rides unless emergency
• Verify replacement coverage before offlining
• Log reason for offline status`
      },
      {
        title: "Emergency Alert System",
        role: "dispatcher",
        content: `**Types of Emergencies:**

**Driver-Initiated:**
• Driver presses emergency button in their app
• Automatically creates alert with GPS location
• Priority: Critical
• Requires immediate response

**System Alerts:**
• Weather warnings
• Security incidents
• Vehicle breakdowns
• Medical emergencies
• Traffic disruptions

**Handling Alerts:**

1. **Acknowledge Immediately:**
   • Click alert in Alert Center
   • Your name logged as handler
   • Alert status → "Acknowledged"

2. **Assess Situation:**
   • Review alert details
   • Check GPS location if available
   • Contact driver/vehicle directly
   • Determine severity

3. **Take Action:**
   • Dispatch help if needed
   • Contact emergency services (911)
   • Notify management
   • Reassign affected rides
   • Update alert with notes

4. **Resolve:**
   • Click "Resolve Alert"
   • Add resolution notes
   • Confirm all parties safe
   • Alert status → "Resolved"

**Broadcasting Alerts:**

Use "Broadcast Alert" for:
• Weather warnings
• Security threats
• Operational changes
• System-wide notifications

**Steps:**
1. Click "Broadcast Alert" button
2. Select alert type
3. Enter clear message
4. All online drivers receive immediately
5. Alert logged in system

**Example Messages:**
• "Severe weather approaching - return to base"
• "Security incident at Main Entrance - avoid area"
• "All vehicles: Complete current rides, then return"
• "System maintenance in 15 minutes"

**Best Practices:**
• Respond to driver emergencies within 30 seconds
• Keep alert messages clear and actionable
• Follow up with verbal contact
• Document all actions taken
• Debrief after major incidents`
      },
      {
        title: "Creating Manual Ride Requests",
        role: "dispatcher",
        content: `**When to Create Manual Rides:**
• Walk-up guests without smartphones
• VIP reservations
• Corporate bookings
• Guests with accessibility needs
• Phone-in requests

**How to Create:**

1. Click "Create Ride Request" button (top right)

2. **Enter Guest Information:**
   • Full Name (required)
   • Room/Booking Number (required)
   • Phone Number (required for SMS)
   
3. **Select Locations:**
   • Pickup Location (dropdown)
   • Destination (dropdown)
   
4. **Set Priority:**
   • Normal: Standard service
   • High: VIP or urgent
   • Emergency: Medical or safety

5. **Add Special Requests:**
   • Wheelchair accessible
   • Extra luggage space
   • Child seats
   • Multiple passengers
   • Any special instructions

6. **Submit:**
   • Click "Create Ride Request"
   • Ride appears in pending queue
   • Assign driver immediately or let system queue

**SMS Notifications:**
If phone number provided:
• Guest receives confirmation SMS
• Includes ride code for reference
• Tracking link when driver assigned
• Updates on ride status

**Pro Tips:**
• Get accurate phone numbers for SMS
• Ask about special needs upfront
• Note VIP guests in special requests
• Create advance reservations
• Confirm pickup location precisely

**Common Scenarios:**

**Hotel Concierge:**
"Guest at front desk requests airport ride"
• Name, room, phone
• Pickup: Hotel Lobby
• Destination: Airport
• Priority: Normal
• Special: "2 large suitcases"

**VIP Service:**
"Executive needs downtown transport"
• Name, company, phone
• Pickup: Conference Hall A
• Destination: Downtown
• Priority: High
• Special: "VIP - punctual service required"

**Accessibility:**
"Guest needs wheelchair accessible vehicle"
• Name, room, phone
• Locations as needed
• Priority: Normal
• Special: "Wheelchair accessible required"`
      }
    ]
  },

  driverGuide: {
    title: "Driver Guide",
    icon: Truck,
    color: "text-green-600",
    articles: [
      {
        title: "Starting Your Shift",
        role: "driver",
        content: `**Step 1: Sign In**
1. Open Driver Dashboard
2. Enter your Driver ID (e.g., "DRV001")
3. Enter your full name
4. Select your assigned vehicle from dropdown
5. Click "Sign In & Continue to Inspection"

**Step 2: Pre-Trip Vehicle Inspection**

**Required Information:**
• Current odometer reading
• Fuel level (Full, 3/4, 1/2, 1/4, Low)

**Safety Checklist:**
✓ All lights functioning properly
✓ Brakes responsive and working
✓ Tires in good condition
✓ Interior clean and presentable
✓ Emergency equipment present
✓ Communication system working

**Important:**
• Complete ALL safety checks before going online
• If any item fails, report to dispatcher
• Do not operate unsafe vehicles
• Add notes about any issues

**Step 3: Go Online**
• Click "Complete Inspection & Go Online"
• Your status changes to "Available"
• You'll see pending ride requests
• GPS tracking activates automatically

**Your Dashboard Shows:**
• Current vehicle information
• Ride requests you can accept
• Your performance stats
• Real-time map with your location`
      },
      {
        title: "Accepting and Completing Rides",
        role: "driver",
        content: `**Viewing Ride Requests:**

Each request shows:
• Guest name and room number
• Pickup location
• Destination
• Phone number (if provided)
• Special requests
• • How long it's been pending

**Accepting a Ride:**
1. Review ride details carefully
2. Note any special requests
3. Check pickup/destination locations
4. Click "Accept Ride Request"
5. Ride moves to "Current Assignment" section

**Starting the Journey:**

1. **Navigate to Pickup:**
   • Drive to pickup location shown
   • Call guest if you have questions
   • Map shows your current location

2. **Meet the Guest:**
   • Greet guest professionally
   • Confirm destination
   • Assist with luggage if needed
   • Verify any special accommodations

3. **Start the Ride:**
   • Click "Pick Up & Start Journey"
   • Status changes to "In Progress"
   • Guest can track your location
   • GPS updates automatically

4. **During Transit:**
   • Follow safe driving practices
   • Take optimal route
   • Communicate with guest
   • Handle any requests courteously

5. **Complete the Ride:**
   • Arrive at destination safely
   • Assist guest with luggage
   • Ensure guest has belongings
   • Click "Complete Ride"
   • Guest receives rating request

**Communication:**
• "Call Guest" button connects directly
• SMS sends to guest's phone
• All communications logged
• Use for ETA updates or issues

**Best Practices:**
• Accept rides promptly (within 30 seconds)
• Call if running late
• Keep vehicle clean and comfortable
• Be professional and courteous
• Update dispatch on any issues`
      },
      {
        title: "Using the Emergency Button",
        role: "driver",
        content: `**When to Use Emergency Button:**

**Immediate Danger:**
• Medical emergency
• Accident or collision
• Security threat
• Vehicle breakdown in unsafe location
• Guest behavior concerns

**How Emergency System Works:**

1. **Press Emergency Button:**
   • Red button always visible in your dashboard
   • One click activates alert

2. **What Happens:**
   • Dispatch receives CRITICAL alert
   • Your GPS location sent automatically
   • Dispatcher contacts you immediately
   • Help dispatched if needed
   • Alert logged in system

3. **After Pressing:**
   • Wait for dispatcher to contact you
   • Explain situation clearly
   • Follow dispatcher instructions
   • Stay on line if needed
   • Keep passengers informed and calm

**False Alarms:**
If pressed accidentally:
• Immediately contact dispatcher
• Explain it was unintentional
• Dispatcher will clear alert
• No penalty for honest mistakes

**Real Emergencies:**

**Medical:**
• Press emergency button
• Call 911 if severe
• Provide first aid if trained
• Wait for emergency services
• Document incident

**Accident:**
• Ensure everyone is safe
• Press emergency button
• Call 911 if injuries
• Exchange information
• Take photos
• File report

**Security Threat:**
• Press emergency button
• Drive to safe public location
• Lock doors if necessary
• Call 911 if immediate danger
• Wait for help

**Vehicle Breakdown:**
• Press emergency button
• Move to safe location if possible
• Turn on hazard lights
• Stay with vehicle
• Dispatch sends replacement

**Important:**
• Never hesitate to use in real emergencies
• Your safety and passengers' safety first
• System is monitored 24/7
• Immediate response guaranteed
• All actions supported by management`
      },
      {
        title: "End of Shift Procedure",
        role: "driver",
        content: `**Before Going Offline:**

1. **Complete All Active Rides:**
   • Finish current assignments
   • Don't accept new rides near shift end
   • Allow time for final ride completion

2. **Return to Base:**
   • Drive back to designated parking
   • Park in assigned spot
   • Secure vehicle properly

3. **Post-Trip Inspection:**
   • Check for guest items left behind
   • Note any new damage
   • Report maintenance needs
   • Clean interior if needed

4. **Fuel Check:**
   • Refuel if below 1/4 tank
   • Keep receipts for reimbursement
   • Note final fuel level

5. **Final Odometer Reading:**
   • Record ending mileage
   • Calculate distance driven
   • Report unusual readings

6. **Go Offline:**
   • Click "Go Offline" button in dashboard
   • Confirm end of shift
   • Vehicle status changes to "offline"
   • You're logged out automatically

**What to Report:**

**Maintenance Issues:**
• Dashboard warning lights
• Strange noises or vibrations
• Brake concerns
• Tire problems
• Fluid leaks

**Guest Items:**
• Lost and found items
• Document what was found
• Turn in to dispatch/lost & found
• Note in system

**Incidents:**
• Any accidents (even minor)
• Guest complaints or concerns
• Unusual events
• Security issues

**End of Shift Checklist:**
□ All rides completed
□ Vehicle returned to base
□ Interior cleaned
□ Lost items reported
□ Maintenance issues logged
□ Fuel level acceptable
□ Odometer reading recorded
□ Logged out of system
□ Vehicle secured

**Next Shift:**
Your vehicle and login persist, so next shift:
• Just sign back in
• Select same vehicle (if available)
• Complete new inspection
• Go online and start driving`
      }
    ]
  },

  guestGuide: {
    title: "Guest Guide",
    icon: Users,
    color: "text-purple-600",
    articles: [
      {
        title: "Booking Your Ride",
        role: "guest",
        content: `**Three Ways to Book:**

**1. Guest Portal (Web):**
• Visit: [Your App URL]/GuestPortal
• Enter room number OR booking number
• Enter last name
• Provide phone number for SMS updates
• Choose booking method: AI Chat or Classic Form

**2. AI Chat Assistant:**
• Chat with friendly AI bot
• Tell it where you want to go
• Bot asks for necessary details
• Confirms and books ride
• Fastest for simple requests

**3. Classic Form:**
• Fill out traditional booking form
• Select pickup location from dropdown
• Select destination from dropdown
• Add special requests if needed
• Submit request

**4. Phone Call (Voice AI):
• Call the shuttle hotline
• Follow voice prompts
• Speak naturally to AI
• Ride booked automatically

**What You'll Need:**
• Room number OR booking confirmation
• Last name on reservation
• Phone number (for SMS notifications)
• Pickup location
• Destination
• Any special requirements

**Special Requests Examples:**
• "Wheelchair accessible vehicle needed"
• "3 large suitcases"
• "Child seat required"
• "Running late - please wait"
• "VIP service requested"`
      },
      {
        title: "Tracking Your Shuttle",
        role: "guest",
        content: `**Real-Time Tracking:**

**Via SMS Link:**
1. After booking, you receive SMS
2. Click tracking link in message
3. Opens live tracking page
4. No account needed
5. Works on any device

**What You'll See:**

**Ride Status:**
• **Pending:** Finding you a driver
• **Assigned:** Driver on the way
• **In Progress:** Ride underway
• **Completed:** Destination reached

**Driver Information:**
• Driver name
• Vehicle number
• Estimated arrival time
• Current location on map

**Live Map:**
• Shows driver approaching
• Your pickup and destination marked
• Updates in real-time
• GPS powered

**Communication:**
• "Call Driver" button
• Direct phone connection
• All calls logged
• Use for questions or updates

**Example Timeline:**

**00:00 - Ride Requested**
"We are finding you a driver. Please wait..."

**00:02 - Driver Assigned**
"Your driver is John in vehicle S001. ETA: 5 minutes"
[Map shows driver approaching]

**00:07 - Driver Arrived**
"Your driver has arrived at [pickup location]"

**00:10 - Journey Started**
"Your ride is in progress"
[Map shows route to destination]

**00:25 - Arrived**
"You have arrived at your destination"
[Rating request appears]

**Pro Tips:**
• Save tracking link for reference
• Call driver if you can't find them
• Check ETA before going to pickup
• Link expires 5 minutes after completion`
      },
      {
        title: "Rating Your Experience",
        role: "guest",
        content: `**After Your Ride:**

You'll receive a rating request:
• Via SMS tracking link
• After ride completion
• Takes 1-2 minutes
• Helps improve service

**Rating Categories:**

**1. Overall Experience (1-5 stars)**
Your general satisfaction with the ride

**2. Service Quality (1-5 stars)**
• Driver professionalism
• Customer service
• Communication
• Helpfulness

**3. Punctuality (1-5 stars)**
• Arrived on time?
• Efficient route?
• Dropped off promptly?

**4. Vehicle Condition (1-5 stars)**
• Cleanliness
• Comfort
• Maintenance
• Safety equipment

**5. Would You Recommend?**
• Yes or No
• Helps us track satisfaction

**6. Additional Comments (optional)**
• Specific feedback
• Compliments
• Suggestions
• Concerns

**Your Feedback Matters:**

**5 Stars:**
• Driver receives recognition
• Helps with promotions
• Improves team morale

**1-2 Stars:**
• Management reviews immediately
• Driver may be contacted
• Issues addressed
• Helps prevent future problems

**3-4 Stars:**
• Used for training opportunities
• Identifies improvement areas
• Helps service consistency

**What to Include in Comments:**

**Positive:**
• "John was so helpful with my luggage!"
• "Vehicle was spotless and comfortable"
• "Driver went above and beyond"
• "Very professional and friendly"

**Constructive:**
• "Arrived 10 minutes late"
• "Vehicle interior needs cleaning"
• "Driver seemed distracted"
• "Route took longer than expected"

**Privacy:**
• Your feedback is confidential
• Only management sees detailed reviews
• Used solely for service improvement
• Never shared publicly

**Rating Link:**
• Expires 1 hour after ride
• One rating per ride
• Cannot edit after submission
• Skip if you prefer (but we appreciate it!)`
      }
    ]
  },

  privacyAndMonitoring: {
    title: "Privacy & Monitoring",
    icon: Shield,
    color: "text-red-600",
    articles: [
      {
        title: "Employee Monitoring Notice",
        role: "all",
        content: `**IMPORTANT: All employees are monitored while using this system.**

**What Is Monitored:**

**GPS Location Tracking:**
• Your vehicle location is tracked in real-time while signed in
• Location data is stored permanently
• Used for dispatch, safety, and performance evaluation
• No expectation of privacy while on duty

**Communications:**
• All system messages and notifications
• Phone calls made through the system
• Guest interactions and feedback
• Emergency button usage

**Activity Logs:**
• Login/logout times
• Ride assignments and completions
• Vehicle inspections
• Status changes
• All system actions with timestamps

**Performance Data:**
• Number of rides completed
• Customer ratings
• On-time performance
• Route efficiency
• Fuel consumption

**Purpose of Monitoring:**
• Operational efficiency
• Employee safety
• Customer service quality
• Performance evaluation
• Compliance and legal requirements
• Incident investigation

**Data Access:**
• Management has full access to all data
• Dispatchers can view operational data
• Data may be used in disciplinary actions
• Records are retained indefinitely

**Your Rights:**
• You may request access to your data
• You can discuss concerns with management
• Continued employment requires consent
• Declining monitoring may result in termination

**No Expectation of Privacy:**
By using this system and company vehicles, you acknowledge you have NO expectation of privacy. All activities may be monitored, recorded, and reviewed without further notice.`
      },
      {
        title: "Data Retention Policy",
        role: "admin",
        content: `**Data Retention Guidelines:**

**Permanent Records:**
• All ride records
• GPS location history
• User activity logs
• Performance metrics
• Customer ratings and feedback
• Emergency incidents
• Audit logs of system changes

**Why We Keep Data:**
• Legal compliance requirements
• Insurance and liability protection
• Performance trend analysis
• Training and quality improvement
• Incident investigation
• Regulatory audits

**Data Security:**
• All data encrypted in transit and at rest
• Access controls by role
• Regular security audits
• Backup and disaster recovery
• Compliance with data protection laws

**Access Requests:**
Employees may request their data by:
1. Submitting written request to HR
2. Specify time period and data type
3. Response within 30 days
4. May include redactions for privacy of others

**Data Sharing:**
Data may be shared with:
• Law enforcement (with valid warrant)
• Insurance companies (for claims)
• Legal counsel (for litigation)
• Regulatory agencies (for compliance)
• Third-party auditors (with NDA)

**Employee Obligations:**
• Do not attempt to tamper with monitoring systems
• Report system malfunctions immediately
• Do not share login credentials
• Follow all company policies regarding data use`
      }
    ]
  },

  troubleshooting: {
    title: "Troubleshooting",
    icon: Phone,
    color: "text-orange-600",
    articles: [
      {
        title: "Common Issues and Solutions",
        role: "all",
        content: `**"System Busy" Errors:**

**Cause:** Too many API requests in short time
**Solution:**
• Wait 2-3 minutes without refreshing
• Close extra browser tabs
• Don't rapidly switch between pages
• Allow 10 seconds between page loads

**Maps Not Loading:**

**Cause:** TomTom API key issue
**Solutions:**
• Check if TOMTOM_API_KEY is set (admins)
• Verify API key is valid
• Check API quota hasn't exceeded
• Wait and refresh page

**SMS Not Sending:**

**Causes & Solutions:**
• **Twilio not configured:** Admin must add credentials
• **Invalid phone number:** Use format +1XXXXXXXXXX
• **Unverified number:** Verify in Twilio console
• **No SMS credits:** Add credits to Twilio account

**Driver Can't See Rides:**

**Check:**
1. Are you signed in and online?
2. Did you complete vehicle inspection?
3. Is vehicle status "available"?
4. Are there actually pending rides?
5. Refresh the page

**Dispatcher Can't Assign:**

**Check:**
1. Is driver actually online?
2. Is vehicle available (not in-use)?
3. Try refreshing data
4. Check for error messages
5. Try unassigning and reassigning

**Guest Can't Track Ride:**

**Check:**
1. Was phone number provided when booking?
2. Check spam folder for SMS
3. Try clicking link again
4. Link expires after ride completion
5. Request new ride if needed

**Login Issues:**

**Drivers:**
• Check Driver ID format
• Verify name spelling
• Ensure vehicle is available
• Ask dispatcher for verification

**Guests:**
• Verify room/booking number
• Check last name spelling
• Try alternate booking method
• Contact front desk for help

**Performance Issues:**

**Slow Loading:**
• Too many browser tabs open
• Clear browser cache
• Check internet connection
• Try different browser
• Close unnecessary apps

**App Crashes:**
• Clear browser cache and cookies
• Update browser to latest version
• Try incognito/private mode
• Report to administrator

**Data Not Updating:**

**Check:**
• Click refresh buttons
• Wait 30 seconds for auto-refresh
• Close and reopen page
• Check internet connection
• Verify not hitting rate limits

**GPS Location Wrong:**

**Drivers:**
• Enable location permissions
• Check device GPS is on
• Go outside if indoors
• Wait for GPS to lock (30 seconds)
• Restart browser if needed

**Emergency Button Not Working:**

1. Try clicking again
2. Check internet connection
3. Call dispatch directly: [phone number]
4. Use vehicle radio if available
5. Call 911 if immediate danger

**Need More Help?**

**Contact Support:**
• Email: [support email]
• Phone: [support phone]
• Available: 24/7
• Response time: Within 1 hour

**For Emergencies:**
• Always call 911 first
• Then contact dispatch
• Use emergency button
• Document everything`
      },
      {
        title: "Browser Compatibility",
        role: "all",
        content: `**Recommended Browsers:**

**Desktop:**
• ✅ Chrome 90+ (Best experience)
• ✅ Firefox 88+
• ✅ Safari 14+
• ✅ Edge 90+

**Mobile:**
• ✅ Chrome for Android
• ✅ Safari for iOS
• ✅ Samsung Internet

**Known Issues:**

**Internet Explorer:**
❌ Not supported - please upgrade

**Older Browsers:**
• May have display issues
• GPS might not work
• Update recommended

**Mobile Considerations:**

**Drivers:**
• Use phone in landscape for better map view
• Enable location "always" for background tracking
• Keep app open during shifts
• Consider phone mount for vehicle

**Guests:**
• Any modern phone browser works
• SMS links open automatically
• No app download needed
• Works on tablets too

**Permissions Required:**

**Location:**
• Drivers: Always allow
• Dispatchers: Not required
• Guests: Not required

**Notifications:**
• Optional but recommended
• Helps with ride alerts
• Can enable in browser settings

**Cookies:**
• Required for login
• Stores your session
• Enable in browser settings

**JavaScript:**
• Must be enabled
• Required for app functionality
• Usually on by default`
      }
    ]
  }
};

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const allArticles = useMemo(() => {
    const articles = [];
    Object.entries(helpContent).forEach(([categoryKey, category]) => {
      category.articles.forEach(article => {
        articles.push({
          ...article,
          category: category.title,
          categoryKey,
          icon: category.icon,
          color: category.color
        });
      });
    });
    return articles;
  }, []);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return allArticles;
    
    const query = searchQuery.toLowerCase();
    return allArticles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allArticles]);

  const categoryArticles = selectedCategory 
    ? helpContent[selectedCategory].articles.map(article => ({
        ...article,
        category: helpContent[selectedCategory].title,
        categoryKey: selectedCategory,
        icon: helpContent[selectedCategory].icon,
        color: helpContent[selectedCategory].color
      }))
    : null;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Help & Documentation</h1>
            <p className="text-slate-600 mt-1">Complete guide to using Shuttle Pro</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search documentation... (e.g., 'how to assign driver', 'emergency button', 'rating system')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg border-slate-300 shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Demo Simulation Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-600" />
            Live Demo Simulation
          </h2>
          <SimulationControl />
        </div>

        {/* Category Grid or Search Results */}
        {!selectedCategory && !searchQuery && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Documentation Categories</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(helpContent).map(([key, category]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-blue-300"
                  onClick={() => setSelectedCategory(key)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 ${category.color.replace('text', 'bg')}/10 rounded-lg flex items-center justify-center`}>
                        <category.icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </div>
                    <p className="text-slate-600 text-sm">{category.articles.length} articles</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Search Results ({filteredArticles.length})
              </h2>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>

            {filteredArticles.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-slate-600 text-lg">No articles found matching "{searchQuery}"</p>
                <p className="text-slate-500 mt-2">Try different keywords or browse categories above</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <article.icon className={`w-5 h-5 ${article.color}`} />
                          <div>
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <Badge variant="outline" className="mt-2">
                              {article.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-slate max-w-none">
                        {article.content.split('\n\n').slice(0, 2).map((section, i) => {
                          if (section.startsWith('**') && section.endsWith('**')) {
                            // Render as a bold paragraph, consistent with other text snippets
                            return (
                              <p key={i} className="text-slate-700 mb-2">
                                {parseBold(section.replace(/\*\*/g, ''))}
                              </p>
                            );
                          } else if (section.startsWith('• ') || section.startsWith('✓ ') || section.startsWith('❌ ') || section.startsWith('✅ ') || section.startsWith('□ ')) {
                            // For search results, just show as a regular paragraph
                            return (
                              <p key={i} className="text-slate-700 mb-2">
                                {parseBold(section.substring(0, 200))}...
                              </p>
                            );
                          } else if (section.match(/^\d+\./)) {
                            // For search results, just show as a regular paragraph
                            return (
                              <p key={i} className="text-slate-700 mb-2">
                                {parseBold(section.substring(0, 200))}...
                              </p>
                            );
                          } else {
                            return (
                              <p key={i} className="text-slate-700 mb-2">
                                {parseBold(section.substring(0, 200))}...
                              </p>
                            );
                          }
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Articles */}
        {selectedCategory && !searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {React.createElement(helpContent[selectedCategory].icon, {
                  className: `w-8 h-8 ${helpContent[selectedCategory].color}`
                })}
                <h2 className="text-3xl font-bold text-slate-900">
                  {helpContent[selectedCategory].title}
                </h2>
              </div>
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                ← Back to Categories
              </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {categoryArticles.map((article, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 text-left">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-slate-900">
                        {article.title}
                      </div>
                      {article.role !== 'all' && (
                        <Badge variant="outline" className="capitalize">
                          {article.role}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-slate-50">
                    <div className="prose prose-slate max-w-none">
                      {article.content.split('\n\n').map((section, i) => {
                        if (section.startsWith('**') && section.endsWith('**')) {
                          return (
                            <h3 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-3">
                              {section.replace(/\*\*/g, '')}
                            </h3>
                          );
                        } else if (section.startsWith('• ') || section.startsWith('✓ ') || section.startsWith('❌ ') || section.startsWith('✅ ') || section.startsWith('□ ')) {
                          const items = section.split('\n');
                          return (
                            <ul key={i} className="list-none space-y-2 my-4">
                              {items.map((item, j) => (
                                <li key={j} className="flex items-start gap-2 text-slate-700">
                                  <span className="mt-1">{item.substring(0, 2)}</span>
                                  <span>{parseBold(item.substring(2))}</span> {/* Apply parseBold here */}
                                </li>
                              ))}
                            </ul>
                          );
                        } else if (section.match(/^\d+\./)) {
                          const items = section.split('\n');
                          return (
                            <ol key={i} className="list-decimal list-inside space-y-2 my-4">
                              {items.map((item, j) => (
                                <li key={j} className="text-slate-700">
                                  {parseBold(item.replace(/^\d+\.\s*/, ''))} {/* Apply parseBold here */}
                                </li>
                              ))}
                            </ol>
                          );
                        } else {
                          return (
                            <p key={i} className="text-slate-700 leading-relaxed my-4">
                              {parseBold(section)} {/* Apply parseBold here */}
                            </p>
                          );
                        }
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Quick Links Footer */}
        {!selectedCategory && !searchQuery && (
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Need Immediate Assistance?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="text-sm">Emergency</Badge>
                <span className="text-slate-700">Call 911 for immediate danger or medical emergencies</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-sm">Dispatch</Badge>
                <span className="text-slate-700">Use Emergency Button in driver dashboard or contact your dispatcher</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-slate-600 text-sm">Support</Badge>
                <span className="text-slate-700">Email: support@shuttlepro.com | Phone: 1-800-SHUTTLE</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
