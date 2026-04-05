export async function onRequestPost(context) {
  const { request, env } = context;

  const API_KEY = env.GOOGLE_PLACES_API_KEY || env.GOOGLE_API_KEY;
  if (!API_KEY) {
    return Response.json({ error: "Server configuration error: API key not found." }, { status: 500 });
  }

  const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

  try {
    const { query } = await request.json();
    if (!query) {
      return Response.json({ error: 'Missing required parameter: "query".' }, { status: 400 });
    }

    const searchParams = new URLSearchParams({ query, key: API_KEY });
    const placesResponse = await fetch(`${PLACES_API_URL}?${searchParams.toString()}`);
    const placesData = await placesResponse.json();

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      throw new Error(placesData.error_message || `Google Places API returned: ${placesData.status}`);
    }

    const services = (placesData.results || []).map((place) => {
      let photoUrl = null;
      if (place.photos?.length > 0) {
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}`;
      }
      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || 0,
        ratingsTotal: place.user_ratings_total || 0,
        photoUrl,
      };
    });

    return Response.json(services.slice(0, 10));
  } catch (error) {
    console.error("get-services error:", error);
    return Response.json({ error: "Failed to fetch service information.", details: error.message }, { status: 500 });
  }
}
