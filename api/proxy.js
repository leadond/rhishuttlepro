import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (Singleton)
if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
        console.error('❌ [Proxy] FIREBASE_SERVICE_ACCOUNT env var is missing!');
    } else {
        const serviceAccount = JSON.parse(serviceAccountStr);
        console.log(`🔥 [Proxy] Initializing Firebase Admin for Project: ${serviceAccount.project_id}`);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ [Proxy] Firebase Admin Initialized');
    }
  } catch (error) {
    console.error('❌ [Proxy] Firebase Admin Init Failed:', error);
  }
}

// Connect to the specific named database
const DATABASE_ID = 'shuttleprorhi'; 
console.log(`🗄️ [Proxy] Connecting to Firestore Database: ${DATABASE_ID}`);
const db = getFirestore(admin.app(), DATABASE_ID);

export default async function handler(req, res) {
  // 1. CORS Handling
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Auth Verification
  const authHeader = req.headers.authorization;
  let decodedToken;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log(`👤 [Proxy] Authenticated User: ${decodedToken.uid} (${decodedToken.email})`);
    } catch (error) {
      console.error('❌ [Proxy] Token Verification Failed:', error);
    }
  }

  // Health Check & Diagnosis
  if (req.method === 'GET') {
      const { diagnose } = req.query;
      if (diagnose === 'true') {
          try {
              const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
              const projectId = serviceAccount.project_id;
              
              // Try to read a non-existent doc to test connection
              let dbStatus = 'unknown';
              let dbError = null;
              try {
                  await db.collection('_health_check').doc('ping').get();
                  dbStatus = 'connected';
              } catch (e) {
                  dbStatus = 'failed';
                  dbError = e.message;
              }

              return res.status(200).json({
                  status: 'diagnosis',
                  projectId: projectId,
                  adminInitialized: admin.apps.length > 0,
                  dbStatus,
                  dbError,
                  envServiceAccountPresent: !!process.env.FIREBASE_SERVICE_ACCOUNT
              });
          } catch (e) {
              return res.status(500).json({ error: 'Diagnosis failed: ' + e.message });
          }
      }
      return res.status(200).json({ status: 'ok', message: 'Firebase Proxy Running (Firestore Mode)' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { entity, method, params } = req.body;

    if (!entity || !method) {
      return res.status(400).json({ error: 'Missing entity or method' });
    }

    console.log(`🚀 [Proxy] Request: ${entity}.${method}`);

    // Use entity name directly for collection (e.g., "Vehicle", "Ride")
    const collectionRef = db.collection(entity);

    let resultData;

    switch (method) {
      case 'list':
      case 'filter':
        let query = collectionRef;
        if (params) {
          Object.keys(params).forEach(key => {
            if (key === 'limit') {
                query = query.limit(Number(params[key]));
            } else if (key === 'orderBy') {
                // Handle descending order syntax (e.g. "-created_date")
                let field = params[key];
                let direction = 'asc';
                if (field && typeof field === 'string' && field.startsWith('-')) {
                    field = field.substring(1);
                    direction = 'desc';
                }
                query = query.orderBy(field, direction);
            } else if (params[key] !== undefined && params[key] !== '') {
                 // Default to equality filter
                 query = query.where(key, '==', params[key]);
            }
          });
        }
        const snapshot = await query.get();
        resultData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;

      case 'get':
        if (!params || !params.id) throw new Error('Missing ID');
        const doc = await collectionRef.doc(params.id).get();
        if (!doc.exists) throw new Error('Not found');
        resultData = { id: doc.id, ...doc.data() };
        break;

      case 'create':
        const createData = {
            ...params,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            created_by: decodedToken ? decodedToken.email : 'system'
        };
        
        let docRef;
        if (params.id) {
            // If ID provided (e.g. User), set it
            docRef = collectionRef.doc(params.id);
            await docRef.set(createData);
        } else {
            // Auto-gen ID
            docRef = await collectionRef.add(createData);
        }
        
        const newDoc = await docRef.get();
        resultData = { id: newDoc.id, ...newDoc.data() };
        break;

      case 'update':
        if (!params || !params.id) throw new Error('Missing ID');
        const updateData = {
            ...params,
            updated_date: new Date().toISOString()
        };
        delete updateData.id; // Ensure ID is not overwritten
        
        await collectionRef.doc(params.id).update(updateData);
        
        const updatedDoc = await collectionRef.doc(params.id).get();
        resultData = { id: updatedDoc.id, ...updatedDoc.data() };
        break;

      case 'delete':
        if (!params || !params.id) throw new Error('Missing ID');
        await collectionRef.doc(params.id).delete();
        resultData = { success: true, id: params.id };
        break;

      case 'fixPermissions':
        if (!decodedToken) throw new Error('Unauthorized');
        // Update User document in Firestore
        await db.collection('User').doc(decodedToken.uid).set({
            email: decodedToken.email,
            roles: ['admin'],
            updated_date: new Date().toISOString()
        }, { merge: true });
        resultData = { message: 'Permissions fixed (Firebase)' };
        break;
        
      case 'setupDatabase':
        if (!decodedToken) throw new Error('Unauthorized');
        
        console.log('🏗️ [Proxy] Initializing Database Structure...');

        // 1. Ensure Admin User Exists
        await db.collection('User').doc(decodedToken.uid).set({
            email: decodedToken.email,
            full_name: decodedToken.name || 'Admin',
            roles: ['admin'],
            status: 'active',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        }, { merge: true });

        // 2. Initialize Collections with Schema Info (Optional but helpful for visibility)
        const collections = ['Vehicle', 'Ride', 'Driver', 'Rating', 'EmergencyAlert', 'FeatureFlag', 'AuditLog', 'Branding', 'Webhook'];
        
        for (const col of collections) {
            await db.collection(col).doc('_schema_info').set({
                _info: 'This document reserves the collection. Do not delete.',
                created_at: new Date().toISOString(),
                entity_name: col
            });
        }

        // 3. Create Default Feature Flags
        const defaultFlags = [
            { key: 'ai_voice_enabled', name: 'AI Voice Assistant', enabled: true },
            { key: 'sms_notifications', name: 'SMS Notifications', enabled: true },
            { key: 'dark_mode', name: 'Dark Mode', enabled: true }
        ];

        for (const flag of defaultFlags) {
            await db.collection('FeatureFlag').doc(flag.key).set({
                feature_key: flag.key,
                feature_name: flag.name,
                is_enabled: flag.enabled,
                category: 'system',
                updated_date: new Date().toISOString()
            }, { merge: true });
        }

        resultData = { 
            success: true, 
            message: 'Database structure and default data initialized successfully.',
            collections_created: collections 
        };
        break;

      case 'createUser':
         const { email, password, full_name, roles } = params;
         console.log('👤 [Proxy] Creating User:', email);
         
         let userRecord;
         try {
             userRecord = await admin.auth().createUser({
                  email,
                  password,
                  displayName: full_name,
                  emailVerified: true
             });
         } catch (e) {
             if (e.code === 'auth/email-already-exists') {
                 userRecord = await admin.auth().getUserByEmail(email);
             } else {
                 throw e;
             }
         }

         if (roles) await admin.auth().setCustomUserClaims(userRecord.uid, { roles });

         // Create/Update User entity in Firestore
         await db.collection('User').doc(userRecord.uid).set({
             email,
             full_name,
             roles,
             created_date: new Date().toISOString(),
             updated_date: new Date().toISOString(),
             status: 'active'
         }, { merge: true });

         resultData = { user: userRecord, message: 'User created successfully' };
         break;

      case 'registerWebhook':
        if (!decodedToken) throw new Error('Unauthorized');
        const { action, url, events, description, webhookId, is_active } = params;
        const webhookCol = db.collection('Webhook');

        if (action === 'list') {
            const snapshot = await webhookCol.get();
            const webhooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            resultData = { success: true, webhooks };
        } else if (action === 'create') {
            if (!url || !events) throw new Error('Missing URL or events');
            const secret = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
            const newWebhook = {
                url,
                events,
                description,
                secret,
                is_active: true,
                created_by: decodedToken.email,
                created_at: new Date().toISOString(),
                failure_count: 0,
                total_deliveries: 0
            };
            const ref = await webhookCol.add(newWebhook);
            resultData = { success: true, webhook: { id: ref.id, ...newWebhook } };
        } else if (action === 'update') {
            if (!webhookId) throw new Error('Missing webhookId');
            await webhookCol.doc(webhookId).update({ is_active, updated_at: new Date().toISOString() });
            resultData = { success: true, message: 'Webhook updated' };
        } else if (action === 'delete') {
            if (!webhookId) throw new Error('Missing webhookId');
            await webhookCol.doc(webhookId).delete();
            resultData = { success: true, message: 'Webhook deleted' };
        } else if (action === 'test') {
             // Mock test
             resultData = { success: true, status_code: 200, message: 'Test payload sent' };
        } else {
            throw new Error('Invalid action');
        }
        break;

      case 'triggerWebhooks':
        // This endpoint is called by the frontend to broadcast events
        // In a real production app, this should be done via Firestore Triggers (Cloud Functions)
        // But for this "Lift and Shift", we do it here.
        const { event, data } = params;
        if (!event) throw new Error('Missing event');

        console.log(`🔔 [Proxy] Triggering Webhooks for event: ${event}`);

        const webhookQuery = await db.collection('Webhook')
            .where('is_active', '==', true)
            .where('events', 'array-contains', event)
            .get();

        if (webhookQuery.empty) {
            console.log('🔕 No active webhooks found for this event.');
            resultData = { success: true, delivered_count: 0 };
            break;
        }

        const deliveryPromises = webhookQuery.docs.map(async (doc) => {
            const hook = doc.data();
            try {
                const response = await fetch(hook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shuttle-Event': event,
                        'X-Shuttle-Signature': hook.secret ? `sha256=${hook.secret}` : 'none' // Simplified signature
                    },
                    body: JSON.stringify({
                        event,
                        created_at: new Date().toISOString(),
                        data
                    })
                });

                const success = response.ok;
                
                // Update stats (fire and forget update to avoid slowing down response too much)
                await db.collection('Webhook').doc(doc.id).update({
                    last_triggered_at: new Date().toISOString(),
                    total_deliveries: admin.firestore.FieldValue.increment(1),
                    failure_count: success ? hook.failure_count : admin.firestore.FieldValue.increment(1),
                    last_error: success ? null : `HTTP ${response.status}`
                });

                return { id: doc.id, success, status: response.status };
            } catch (err) {
                console.error(`❌ Webhook delivery failed to ${hook.url}:`, err);
                await db.collection('Webhook').doc(doc.id).update({
                    last_triggered_at: new Date().toISOString(),
                    failure_count: admin.firestore.FieldValue.increment(1),
                    last_error: err.message
                });
                return { id: doc.id, success: false, error: err.message };
            }
        });

        const deliveryResults = await Promise.all(deliveryPromises);
        resultData = { 
            success: true, 
            delivered_count: deliveryResults.filter(r => r.success).length,
            results: deliveryResults 
        };
        break;

      case 'updateUserPassword':
        if (!decodedToken) throw new Error('Unauthorized');
        const { userId, newPassword } = params;
        if (!userId || !newPassword) throw new Error('Missing userId or newPassword');
        
        await admin.auth().updateUser(userId, {
            password: newPassword
        });
        resultData = { success: true, message: 'Password updated successfully' };
        break;

      case 'submitRating':
        const { ride_id, rating, comment } = params;
        if (!ride_id || !rating) throw new Error('Missing ride_id or rating');
        
        await db.collection('Rating').add({
            ride_id,
            rating,
            comment,
            created_at: new Date().toISOString(),
            flagged_for_review: rating <= 3
        });
        resultData = { success: true, message: 'Rating submitted' };
        break;

      case 'runSimulation':
        // Mock simulation for now
        console.log('🎮 [Proxy] Simulation requested (Mock)');
        resultData = { success: true, message: 'Simulation started (Mock)' };
        break;

      case 'sendRideSMS':
      case 'voiceHandler':
      case 'twilioWebhook':
      case 'externalRideRequest':
      case 'getRideStatus':
         console.log(`⚠️ [Proxy] Mocking missing function: ${method}`);
         resultData = { success: true, message: 'Function mocked' };
         break;

      default:
        // Fallback for custom functions? 
        // For now, throw error as we are moving away from legacy functions
        throw new Error(`Unknown method: ${method}`);
    }

    return res.status(200).json({ success: true, data: resultData });

  } catch (error) {
    console.error('❌ [Proxy] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
