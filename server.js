import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'leonardaccess-233f8',
  });
}

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true }));
app.use(express.json());

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'leonard-api', timestamp: new Date().toISOString() });
});

// Auth middleware
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      phone: decoded.phone_number || null,
      name: decoded.name || null,
      picture: decoded.picture || null,
      provider: decoded.firebase?.sign_in_provider || 'unknown',
    };
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Apply auth to all /api routes except health
app.use('/api/generate-plan', authMiddleware);
app.use('/api/get-services', authMiddleware);
app.use('/api/user', authMiddleware);
app.use('/api/trips', authMiddleware);

// ========== USER PROFILE ==========
app.get('/api/user', async (req, res) => {
  try {
    let user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: req.user.uid,
          email: req.user.email,
          phone: req.user.phone,
          displayName: req.user.name,
          photoUrl: req.user.picture,
          provider: req.user.provider,
        },
      });
      return res.json({ user, isNew: true });
    }
    res.json({ user, isNew: false });
  } catch (error) {
    console.error('User API error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/user', async (req, res) => {
  try {
    const { displayName, yachtName, yachtType, yachtLength, homePort, preferences } = req.body;
    const user = await prisma.user.update({
      where: { firebaseUid: req.user.uid },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(yachtName !== undefined && { yachtName }),
        ...(yachtType !== undefined && { yachtType }),
        ...(yachtLength !== undefined && { yachtLength }),
        ...(homePort !== undefined && { homePort }),
        ...(preferences !== undefined && { preferences }),
      },
    });
    res.json({ user });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// ========== TRIPS ==========
app.get('/api/trips', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.json({ trips: [] });
    const trips = await prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ trips });
  } catch (error) {
    console.error('Trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// ========== AI GENERATE PLAN ==========
app.post('/api/generate-plan', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error: API key not found.' });

  const { prompt, language = 'en-US', planContext = {} } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'A non-empty prompt is required.' });

  const SYSTEM_PROMPT = `You are Leonard, an expert AI yacht concierge. You are PROACTIVE, CONTEXT-AWARE, and DECISIVE.

# MOST IMPORTANT RULE
IF USER MENTIONS TWO LOCATIONS, IT IS A TRIP REQUEST! Create the trip plan IMMEDIATELY.

Current Context: ${JSON.stringify(planContext, null, 2)}

# DECISION TREE
## RULE #1: TRIP PLANNING (two locations detected)
Generate action: "tripPlan" with full itinerary.
## RULE #2: SERVICE SEARCH (find X in Y)
Generate action: "serviceSearch" with parameters.query
## RULE #3: GREETING
Generate action: "message" with friendly yacht concierge response.
## RULE #4: GENERAL
Generate action: "message" with helpful response.

Response: valid JSON with action, message/chat_response, optionally plan/parameters/yacht_context.
For tripPlan include: title, duration, departure, destination, route, daily_itinerary, provisioning, activities_suggestions, budget_estimate, important_notes.`;

  const LANG = { 'en-US': 'Respond in English.', fr: 'Réponds en français.', es: 'Responde en español.' };
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${LANG[language] || LANG['en-US']}\n\nUser: "${prompt}"`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { response_mime_type: 'application/json', temperature: 0.8, maxOutputTokens: 4000 },
    });

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const responseJson = JSON.parse(cleanedText);

    const { action, parameters, chat_response, message, plan } = responseJson;
    const isValid = (action === 'tripPlan' && plan?.title) || (action === 'serviceSearch' && parameters?.query) || (action === 'message' && (chat_response || message));

    if (!isValid) throw new Error('AI response validation failed.');

    // Save trip if it's a plan
    if (action === 'tripPlan' && plan) {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
        if (user) {
          await prisma.trip.create({
            data: {
              userId: user.id,
              title: plan.title,
              departure: plan.departure?.location || '',
              destination: plan.destination?.location || '',
              duration: plan.duration,
              distance: plan.route?.total_distance,
              planData: plan,
            },
          });
        }
      } catch (e) {
        console.warn('Failed to save trip:', e.message);
      }
    }

    res.json(responseJson);
  } catch (error) {
    console.error('generate-plan error:', error);
    res.status(500).json({ action: 'error', message: 'I encountered an issue. Please try again.', error: error.message });
  }
});

// ========== GET SERVICES ==========
app.post('/api/get-services', async (req, res) => {
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Server configuration error: API key not found.' });

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing required parameter: "query".' });

    const searchParams = new URLSearchParams({ query, key: API_KEY });
    const placesResponse = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams}`);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      throw new Error(placesData.error_message || `Google Places API returned: ${placesData.status}`);
    }

    const services = (placesData.results || []).map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || 0,
      ratingsTotal: place.user_ratings_total || 0,
      photoUrl: place.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}` : null,
    }));

    res.json(services.slice(0, 10));
  } catch (error) {
    console.error('get-services error:', error);
    res.status(500).json({ error: 'Failed to fetch service information.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Leonard API running on port ${PORT}`);
});
