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

// CORS whitelist
const ALLOWED_ORIGINS = [
  'https://leonardaccess.com',
  'https://www.leonardaccess.com',
  'https://leonardaccess-233f8.web.app',
  'https://leonardaccess-233f8.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// ========== UTILITY SERVICES ==========

// Fetch weather for a location (OpenWeatherMap free tier)
async function getWeather(location) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${key}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (!geoData?.[0]) return null;
    const { lat, lon } = geoData[0];
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=8&appid=${key}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    if (weatherData.cod !== '200') return null;
    return {
      location,
      current: {
        temp: Math.round(weatherData.list[0].main.temp),
        feels_like: Math.round(weatherData.list[0].main.feels_like),
        description: weatherData.list[0].weather[0].description,
        wind_speed: Math.round(weatherData.list[0].wind.speed * 1.944), // m/s to knots
        wind_dir: weatherData.list[0].wind.deg,
        humidity: weatherData.list[0].main.humidity,
      },
      forecast: weatherData.list.slice(0, 5).map(f => ({
        time: f.dt_txt,
        temp: Math.round(f.main.temp),
        description: f.weather[0].description,
        wind_knots: Math.round(f.wind.speed * 1.944),
      })),
    };
  } catch (e) {
    console.warn('Weather fetch failed:', e.message);
    return null;
  }
}

// Fetch real marinas/services near a location via Google Places
async function getPlacesNear(location, type = 'marina') {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return [];
  try {
    const query = `${type} near ${location}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return data.results.slice(0, 3).map(p => ({
      name: p.name,
      address: p.formatted_address,
      rating: p.rating || 0,
      reviews: p.user_ratings_total || 0,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
    }));
  } catch (e) {
    console.warn('Places fetch failed:', e.message);
    return [];
  }
}

// Get user's yacht profile for AI context
async function getUserYachtProfile(uid) {
  if (!uid) return null;
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
    if (!user || (!user.yachtName && !user.yachtType)) return null;
    return {
      name: user.yachtName,
      type: user.yachtType,
      length: user.yachtLength,
      homePort: user.homePort,
    };
  } catch (e) { return null; }
}

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'leonard-api', timestamp: new Date().toISOString() });
});

// ========== WEATHER ENDPOINT ==========
app.get('/api/weather', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'Location required' });
  const weather = await getWeather(location);
  if (!weather) return res.status(404).json({ error: 'Weather data unavailable' });
  res.json(weather);
});

// Auth middleware - optional for generate-plan/get-services, required for user/trips
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

// Optional auth - attaches user if token present, continues either way
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
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
    } catch (e) { /* continue without auth */ }
  }
  next();
}

// AI endpoints: optional auth (allow 3 free messages from frontend)
app.use('/api/generate-plan', optionalAuth);
app.use('/api/get-services', optionalAuth);
// User/trips: require auth
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

  // Gather real-world data to enrich AI context
  const locations = prompt.match(/\b(?:Monaco|Cannes|Nice|Saint-Tropez|Ibiza|Miami|Bahamas|St\.?\s*Barth|Capri|Sardinia|Mykonos|Santorini|Dubrovnik|Antibes|Marbella|Palma|Mallorca|Corsica|Amalfi|Naples|Barcelona|Marseille|Malta|Montenegro|Split|Hvar|Key West|Nassau|Bimini|Turks|Virgin Islands|Anguilla|St\.?\s*Martin|Gustavia)\b/gi) || [];

  // Fetch weather + nearby marinas in parallel for detected locations
  const uniqueLocations = [...new Set(locations.map(l => l.trim()))].slice(0, 3);
  const [weatherData, marinasData, yachtProfile] = await Promise.all([
    Promise.all(uniqueLocations.map(loc => getWeather(loc))),
    Promise.all(uniqueLocations.map(loc => getPlacesNear(loc, 'marina'))),
    getUserYachtProfile(req.user?.uid),
  ]);

  const weatherContext = weatherData.filter(Boolean).map(w =>
    `${w.location}: ${w.current.temp}°C, ${w.current.description}, wind ${w.current.wind_speed}kt`
  ).join('\n');

  const marinasContext = marinasData.flat().slice(0, 6).map(m =>
    `${m.name} (${m.rating}/5, ${m.reviews} reviews) - ${m.address}`
  ).join('\n');

  const yachtContext = yachtProfile
    ? `User's yacht: ${yachtProfile.name || 'unnamed'}, Type: ${yachtProfile.type || 'unknown'}, Length: ${yachtProfile.length || 'unknown'}, Home port: ${yachtProfile.homePort || 'unknown'}`
    : '';

  const SYSTEM_PROMPT = `You are Leonard, an expert AI yacht concierge. You are PROACTIVE, CONTEXT-AWARE, and DECISIVE.

# MOST IMPORTANT RULE
IF USER MENTIONS TWO LOCATIONS, IT IS A TRIP REQUEST! Create the trip plan IMMEDIATELY.

Current Context: ${JSON.stringify(planContext, null, 2)}
${yachtContext ? `\n# USER'S YACHT\n${yachtContext}\nAdapt your recommendations to this yacht (draft, beam, fuel consumption, speed).` : ''}
${weatherContext ? `\n# REAL-TIME WEATHER DATA\n${weatherContext}\nUse this real weather data in your response. Warn about strong winds (>20kt) or bad conditions.` : ''}
${marinasContext ? `\n# REAL MARINAS & SERVICES NEARBY (from Google Places)\n${marinasContext}\nRecommend these REAL places by name in your itinerary. Include their ratings.` : ''}

# DECISION TREE

## RULE #1: TRIP PLANNING (two locations detected)
Generate action: "tripPlan" with a "plan" object. The plan MUST follow this EXACT structure:
{
  "action": "tripPlan",
  "message": "Short confirmation message",
  "plan": {
    "title": "Trip Title",
    "duration": "X Days",
    "departure": { "location": "City, Country" },
    "destination": { "location": "City, Country" },
    "route": {
      "total_distance": "XX nautical miles",
      "estimated_sailing_time": "XX hours",
      "route_description": "Brief route description"
    },
    "daily_itinerary": [
      {
        "day": 1,
        "title": "Day title",
        "navigation": {
          "departure_point": "From location",
          "arrival_point": "To location",
          "distance": "XX NM",
          "estimated_time": "XX hours",
          "route_notes": "Notes"
        },
        "activities": [
          { "time": "09:00", "activity": "Description", "location": "Place", "notes": "Optional" }
        ],
        "dining": {
          "breakfast": "Description",
          "lunch": "Description",
          "dinner": "Description"
        },
        "overnight": "Marina or anchorage name"
      }
    ],
    "budget_estimate": {
      "marina_fees": "€XXX",
      "fuel": "€XXX",
      "food_and_beverage": "€XXX",
      "activities": "€XXX",
      "total": "€X,XXX"
    },
    "important_notes": ["Note 1", "Note 2"]
  }
}

## RULE #2: SERVICE SEARCH (find X in Y)
Generate action: "serviceSearch" with parameters.query
{
  "action": "serviceSearch",
  "message": "Searching for...",
  "parameters": { "query": "search query string" }
}

## RULE #3: GREETING
Generate action: "message" with friendly yacht concierge response.

## RULE #4: GENERAL CONVERSATION
Generate action: "message" with helpful response.
{
  "action": "message",
  "chat_response": "Your response text"
}

CRITICAL: For tripPlan, every field shown above is REQUIRED. Use the EXACT key names. Do NOT use null or omit fields — provide real estimated values.`;

  const LANG = { 'en-US': 'Respond in English.', fr: 'Réponds en français.', es: 'Responde en español.' };
  // Sanitize user input to prevent prompt injection
  const sanitized = prompt.slice(0, 2000).replace(/[`${}\\]/g, '');
  const validLang = ['en-US', 'fr', 'es'].includes(language) ? language : 'en-US';
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${LANG[validLang]}\n\nUser Message:\n\`\`\`\n${sanitized}\n\`\`\``;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { response_mime_type: 'application/json', temperature: 0.8, maxOutputTokens: 4000 },
    });

    // Add timeout to Gemini API call
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), 30000));
    const result = await Promise.race([model.generateContent(fullPrompt), timeoutPromise]);
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

    // Enrich response with real-world data
    if (action === 'tripPlan') {
      responseJson.realData = {
        weather: weatherData.filter(Boolean),
        marinas: marinasData.flat().slice(0, 6),
        yacht: yachtProfile,
      };
    }

    res.json(responseJson);
  } catch (error) {
    console.error('generate-plan error:', error);
    res.status(500).json({ action: 'error', message: 'I encountered an issue. Please try again.' });
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
      // Use proxy URL to avoid exposing API key to client
      photoUrl: place.photos?.[0] ? `/api/place-photo/${place.photos[0].photo_reference}` : null,
    }));

    res.json(services.slice(0, 10));
  } catch (error) {
    console.error('get-services error:', error);
    res.status(500).json({ error: 'Failed to fetch service information.' });
  }
});

// ========== PLACE PHOTO PROXY (avoids exposing API key to client) ==========
app.get('/api/place-photo/:ref', async (req, res) => {
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) return res.status(500).end();
  try {
    const photoRef = req.params.ref.replace(/[^a-zA-Z0-9_-]/g, '');
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${API_KEY}`
    );
    if (!response.ok) return res.status(404).end();
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (e) {
    res.status(500).end();
  }
});

// Start server with graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Leonard API running on port ${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Connections closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
