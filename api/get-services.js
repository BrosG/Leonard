import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
    if (!API_KEY) {
        console.error("FATAL: [/api/get-services] API key not found.");
        return res.status(500).json({ error: "Server configuration error: API key not found." });
    }
    
    const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

    try {
        // GURU'S NOTE: We no longer expect 'category' or 'location'. We expect a single, pre-constructed 'query'.
        const { query } = req.body;

        if (!query) {
            console.warn('[/api/get-services] Bad Request: Missing query parameter.');
            return res.status(400).json({ error: 'Missing required parameter: a "query" string is required.' });
        }
        
        console.log(`[/api/get-services] Executing Google Places search with AI-generated query: "${query}"`);

        const searchParams = new URLSearchParams({
            query: query, // The AI-generated query is used directly.
            key: API_KEY,
        });

        const apiUrl = `${PLACES_API_URL}?${searchParams.toString()}`;
        const placesResponse = await fetch(apiUrl);
        const placesData = await placesResponse.json();

        if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
            console.error('[/api/get-services] Google Places API Error:', placesData.error_message || placesData.status);
            throw new Error(placesData.error_message || `Google Places API returned status: ${placesData.status}`);
        }

        const services = (placesData.results || []).map(place => {
            let photoUrl = null;
            if (place.photos && place.photos.length > 0) {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}`;
            }
            return {
                id: place.place_id, name: place.name, address: place.formatted_address,
                rating: place.rating || 0, ratingsTotal: place.user_ratings_total || 0,
                photoUrl: photoUrl
            };
        });

        res.status(200).json(services.slice(0, 10));

    } catch (error) {
        console.error('[/api/get-services] An error occurred in the handler:', error);
        res.status(500).json({ error: 'Failed to fetch service information.', details: error.message });
    }
}