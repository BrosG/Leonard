import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server configuration error: API key not found." }, { status: 500 });
  }

  const body = await request.json();
  const { prompt, language = "en-US", planContext = {} } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return Response.json({ error: "A non-empty prompt is required." }, { status: 400 });
  }

  const SYSTEM_PROMPT = `You are Leonard, an expert AI yacht concierge. You are PROACTIVE, CONTEXT-AWARE, and DECISIVE.

# MOST IMPORTANT RULE
IF USER MENTIONS TWO LOCATIONS, IT IS A TRIP REQUEST! Create the trip plan IMMEDIATELY.

# CONTEXT AWARENESS
Current Context: ${JSON.stringify(planContext, null, 2)}

# DECISION TREE

## RULE #1: TRIP PLANNING (two locations detected)
Generate action: "tripPlan" with full itinerary including navigation, dining, activities, budget.

## RULE #2: SERVICE SEARCH
Triggers: "find [service] in [location]", "where can I get...", "I need [service]"
Generate action: "serviceSearch" with parameters.query

## RULE #3: GREETING/INTRODUCTION
Generate action: "message" with friendly yacht concierge response.

## RULE #4: GENERAL CONVERSATION
Generate action: "message" with helpful response guiding toward action.

Response must be valid JSON with: action, message/chat_response, and optionally plan/parameters/yacht_context.

For tripPlan, include: title, duration, departure, destination, route, daily_itinerary (with navigation, activities, dining, overnight), provisioning, activities_suggestions, budget_estimate, important_notes.`;

  const LANG = { "en-US": "Respond in English.", fr: "Réponds en français.", es: "Responde en español." };
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${LANG[language] || LANG["en-US"]}\n\nUser's Message: "${prompt}"`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { response_mime_type: "application/json", temperature: 0.8, maxOutputTokens: 4000 },
    });

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    const cleanedText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    const responseJson = JSON.parse(cleanedText);

    const { action, parameters, chat_response, message, plan } = responseJson;
    let isValid =
      (action === "tripPlan" && plan?.title) ||
      (action === "serviceSearch" && parameters?.query) ||
      (action === "message" && (chat_response || message));

    if (isValid) {
      return Response.json(responseJson);
    }
    throw new Error("AI response validation failed.");
  } catch (error) {
    console.error("generate-plan error:", error);
    return Response.json(
      { action: "error", message: "I apologize, but I encountered an issue. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}
