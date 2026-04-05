// ========== app.js (Leonard - AI Yacht Concierge) ==========
import "./styles.css";
import i18next from "i18next";
import i18nextHttpBackend from "i18next-http-backend";
import { renderServiceSelectionModal } from "./desktop/DesktopUI.js";
import { authFetch, getCurrentUser } from "./auth/firebase.js";
import { initAuthUI, showAuthModal, closeAuthModal, createUserMenu, initUserMenu } from "./auth/auth-ui.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Free message counter - allow 3 messages before requiring login
const FREE_MESSAGE_LIMIT = 3;
let messageCount = parseInt(sessionStorage.getItem("leonard_msg_count") || "0");

function incrementMessageCount() {
  messageCount++;
  sessionStorage.setItem("leonard_msg_count", String(messageCount));
}

function needsAuth() {
  return !getCurrentUser() && messageCount >= FREE_MESSAGE_LIMIT;
}

// Smart fetch: uses authFetch if logged in, plain fetch otherwise
async function apiFetch(url, options = {}) {
  const user = getCurrentUser();
  if (user) {
    return authFetch(url, options);
  }
  return fetch(url, {
    ...options,
    headers: { ...options.headers, "Content-Type": "application/json" },
  });
}

// --- Helper functions ---
// Sanitize HTML to prevent XSS from AI responses or user input
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Simple markdown-like formatting for AI messages
function formatMessage(text) {
  let safe = sanitize(text);
  // Bold: **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Bullet lists: lines starting with - or •
  safe = safe.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  // Wrap consecutive <li> in <ul>
  safe = safe.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/g, '<ul class="list-disc space-y-1 my-2">$1</ul>');
  // Line breaks
  safe = safe.replace(/\n/g, '<br>');
  return safe;
}

// Hide suggested prompts on first message
function hideSuggestedPrompts() {
  document.getElementById("suggested-prompts")?.remove();
}

function addMessageToChat(message, isUser = false) {
  hideSuggestedPrompts();
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;
  const msgId = `msg-${Date.now()}`;
  const messageDiv = document.createElement("div");
  if (isUser) {
    messageDiv.className = "flex items-end justify-end space-x-2 animate-fade-in";
    messageDiv.innerHTML = `<div class="flex-1 flex justify-end"><div class="chat-bubble-user"><p class="text-white">${sanitize(message)}</p></div></div>`;
  } else {
    messageDiv.className = "flex items-end space-x-2 animate-fade-in group";
    messageDiv.innerHTML = `
      <div class="flex-shrink-0"><img src="/images/leonard-avatar.jpg" alt="Leonard AI concierge" class="w-10 h-10 rounded-full object-cover border-2 border-blue-300 shadow-lg"/></div>
      <div class="flex-1"><div class="chat-bubble-ai">
        <div class="text-gray-800 text-sm leading-relaxed">${formatMessage(message)}</div>
        <div class="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="navigator.clipboard.writeText(document.getElementById('${msgId}')?.dataset.raw||'')" class="text-xs text-gray-400 hover:text-ocean-blue transition-colors" title="Copy">
            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy
          </button>
        </div>
      </div></div>`;
    messageDiv.id = msgId;
    messageDiv.dataset.raw = message;
  }
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
  if (!isUser) document.getElementById("notification-sound")?.play().catch(() => {});
}

function addTypingIndicator() {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages || document.getElementById("typing-indicator")) return;
  const typingDiv = document.createElement("div");
  typingDiv.id = "typing-indicator";
  typingDiv.className = "flex items-end space-x-2";
  typingDiv.setAttribute("aria-live", "polite");
  typingDiv.setAttribute("aria-label", "Leonard is typing");
  typingDiv.innerHTML = `<div class="flex-shrink-0"><img src="/images/leonard-avatar.jpg" alt="Leonard" class="w-10 h-10 rounded-full object-cover border-2 border-blue-300"/></div><div class="flex-1"><div class="chat-bubble-ai"><div class="flex items-center space-x-1"><div class="w-2 h-2 bg-ocean-blue rounded-full animate-bounce"></div><div class="w-2 h-2 bg-ocean-blue rounded-full animate-bounce" style="animation-delay:0.1s"></div><div class="w-2 h-2 bg-ocean-blue rounded-full animate-bounce" style="animation-delay:0.2s"></div></div></div></div>`;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
}

const removeTypingIndicator = () => document.getElementById("typing-indicator")?.remove();

// Safe accessor — handles obj.key, obj as string, or fallback
function s(val, fallback = "") {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "object") return val.location || val.name || val.city || JSON.stringify(val);
  return String(val);
}

// Render trip plan (defensive against any AI response shape)
function renderTripPlan(plan) {
  const planSection = document.getElementById("yacht-plan-output");
  const planContainer = document.getElementById("plan-container");
  if (!planSection || !planContainer) return;

  console.log("renderTripPlan received:", JSON.stringify(plan, null, 2));

  const departure = typeof plan.departure === "object" ? (plan.departure.location || plan.departure.name || plan.departure.city || "") : s(plan.departure);
  const destination = typeof plan.destination === "object" ? (plan.destination.location || plan.destination.name || plan.destination.city || "") : s(plan.destination);

  let dailyItineraryHTML = "";
  const itinerary = plan.daily_itinerary || plan.dailyItinerary || plan.itinerary || [];
  if (Array.isArray(itinerary)) {
    dailyItineraryHTML = itinerary
      .map(
        (day) => `
      <div class="mb-8 bg-white rounded-3xl p-8 shadow-xl border-l-4 border-ocean-blue">
        <h3 class="text-3xl font-bold text-ocean-blue mb-4">Day ${s(day.day, "")}: ${s(day.title, s(day.name, ""))}</h3>
        ${
          day.navigation
            ? `<div class="mb-6 bg-blue-50 rounded-2xl p-6">
            <h4 class="text-xl font-bold text-gray-800 mb-3">Navigation Plan</h4>
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div><strong>From:</strong> ${s(day.navigation.departure_point, s(day.navigation.from, ""))}</div>
              <div><strong>To:</strong> ${s(day.navigation.arrival_point, s(day.navigation.to, ""))}</div>
              <div><strong>Distance:</strong> ${s(day.navigation.distance, "")}</div>
              <div><strong>Est. Time:</strong> ${s(day.navigation.estimated_time, s(day.navigation.time, ""))}</div>
            </div>
            ${day.navigation.route_notes ? `<p class="mt-3 text-gray-700"><strong>Notes:</strong> ${s(day.navigation.route_notes)}</p>` : ""}
          </div>`
            : ""
        }
        ${
          day.activities?.length
            ? `<div class="mb-6">
            <h4 class="text-xl font-bold text-gray-800 mb-3">Activities</h4>
            <div class="space-y-3">${day.activities
              .map(
                (a) => `
              <div class="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <div class="font-bold text-ocean-blue min-w-[80px]">${s(a.time, "")}</div>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${s(a.activity, s(a.name, s(a.description, "")))}</div>
                  ${a.location ? `<div class="text-sm text-gray-600">${s(a.location)}</div>` : ""}
                  ${a.notes ? `<div class="text-sm text-gray-500 mt-1">${s(a.notes)}</div>` : ""}
                </div>
              </div>`
              )
              .join("")}</div></div>`
            : ""
        }
        ${
          day.dining
            ? `<div class="mb-4">
            <h4 class="text-xl font-bold text-gray-800 mb-3">Dining</h4>
            <div class="grid md:grid-cols-3 gap-4">
              <div class="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl"><div class="font-bold text-gray-700">Breakfast</div><div class="text-sm text-gray-600">${s(day.dining.breakfast, "On board")}</div></div>
              <div class="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl"><div class="font-bold text-gray-700">Lunch</div><div class="text-sm text-gray-600">${s(day.dining.lunch, "Local restaurant")}</div></div>
              <div class="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl"><div class="font-bold text-gray-700">Dinner</div><div class="text-sm text-gray-600">${s(day.dining.dinner, "Marina dining")}</div></div>
            </div></div>`
            : ""
        }
        ${day.overnight ? `<div class="mt-4 p-4 bg-indigo-50 rounded-xl"><strong class="text-gray-700">Overnight:</strong> <span class="text-gray-600">${s(day.overnight)}</span></div>` : ""}
      </div>`
      )
      .join("");
  }

  const route = plan.route || {};
  const budget = plan.budget_estimate || plan.budget || {};
  const notes = plan.important_notes || plan.notes || [];

  const html = `
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-12 bg-gradient-to-r from-ocean-blue to-ocean-light rounded-3xl p-10 text-white shadow-2xl">
        <h2 class="text-5xl font-bold mb-4">${s(plan.title, "Your Yacht Trip")}</h2>
        <div class="text-2xl opacity-90 mb-6">${s(plan.duration, "")}</div>
        <div class="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6"><div class="text-sm opacity-75 mb-2">Departure</div><div class="text-xl font-bold">${departure || "TBD"}</div></div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6"><div class="text-sm opacity-75 mb-2">Destination</div><div class="text-xl font-bold">${destination || "TBD"}</div></div>
        </div>
      </div>
      ${
        route.total_distance || route.estimated_sailing_time || route.route_description
          ? `<div class="mb-8 bg-white rounded-3xl p-8 shadow-xl">
        <h3 class="text-3xl font-bold text-ocean-blue mb-6">Route Overview</h3>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="text-center p-6 bg-blue-50 rounded-2xl"><div class="text-4xl font-bold text-ocean-blue mb-2">${s(route.total_distance, route.distance || "—")}</div><div class="text-gray-600">Total Distance</div></div>
          <div class="text-center p-6 bg-cyan-50 rounded-2xl"><div class="text-4xl font-bold text-ocean-blue mb-2">${s(route.estimated_sailing_time, route.sailing_time || "—")}</div><div class="text-gray-600">Sailing Time</div></div>
          <div class="text-center p-6 bg-blue-50 rounded-2xl flex items-center justify-center"><div class="text-gray-700">${s(route.route_description, route.description || "")}</div></div>
        </div></div>`
          : ""
      }
      ${dailyItineraryHTML ? `<div class="mb-8"><h3 class="text-4xl font-bold text-ocean-blue mb-8">Daily Itinerary</h3>${dailyItineraryHTML}</div>` : ""}
      ${
        budget.total || budget.marina_fees
          ? `<div class="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-xl border-2 border-green-200">
        <h3 class="text-3xl font-bold text-gray-800 mb-6">Budget Estimate</h3>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          ${budget.marina_fees ? `<div class="flex justify-between p-4 bg-white rounded-xl"><span class="text-gray-700">Marina Fees</span><span class="font-bold">${s(budget.marina_fees)}</span></div>` : ""}
          ${budget.fuel ? `<div class="flex justify-between p-4 bg-white rounded-xl"><span class="text-gray-700">Fuel</span><span class="font-bold">${s(budget.fuel)}</span></div>` : ""}
          ${budget.food_and_beverage || budget.food ? `<div class="flex justify-between p-4 bg-white rounded-xl"><span class="text-gray-700">Food & Beverage</span><span class="font-bold">${s(budget.food_and_beverage || budget.food)}</span></div>` : ""}
          ${budget.activities ? `<div class="flex justify-between p-4 bg-white rounded-xl"><span class="text-gray-700">Activities</span><span class="font-bold">${s(budget.activities)}</span></div>` : ""}
        </div>
        ${budget.total ? `<div class="flex justify-between p-6 bg-gradient-to-r from-ocean-blue to-ocean-light rounded-2xl text-white text-2xl">
          <span class="font-bold">Total Estimate</span><span class="font-bold">${s(budget.total)}</span>
        </div>` : ""}
        </div>`
          : ""
      }
      ${
        notes.length
          ? `<div class="bg-yellow-50 border-2 border-yellow-300 rounded-3xl p-8 shadow-xl">
        <h3 class="text-3xl font-bold text-gray-800 mb-6">Important Notes</h3>
        <ul class="space-y-3">${notes.map((n) => `<li class="flex items-start gap-3"><span class="text-yellow-600 text-xl mt-1">&bull;</span><span class="text-gray-700 flex-1">${s(n)}</span></li>`).join("")}</ul></div>`
          : ""
      }
    </div>`;

  planContainer.innerHTML = html;
  planSection.classList.remove("hidden");
  setTimeout(() => planSection.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
}

async function fetchAndDisplayServices({ query }) {
  if (!query) {
    addMessageToChat("I apologize, there was an issue with the search. Could you please try again?", false);
    return;
  }
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/get-services`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    const services = await response.json();
    if (!services?.length) {
      addMessageToChat("I couldn't find any specific listings for that request. Would you like me to search for something else?", false);
      return;
    }
    renderServiceSelectionModal("results", services, (s) => {
      addMessageToChat(`Excellent choice! I've noted your selection: ${s.name}.\n\nAddress: ${s.address}\nRating: ${s.rating} (${s.ratingsTotal} reviews)\n\nWould you like me to find more services or help you with something else?`, false);
    });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    addMessageToChat("I apologize, but I encountered an issue while searching. Please try again.", false);
  }
}

window.yachtContext = window.yachtContext || {};

async function sendMessage(message) {
  if (!message.trim()) return;

  // Smart conversion: allow messages but gate full results after limit
  const atLimit = needsAuth();
  incrementMessageCount();
  addMessageToChat(message, true);
  addTypingIndicator();

  try {
    const response = await apiFetch(`${API_BASE_URL}/api/generate-plan`, {
      method: "POST",
      body: JSON.stringify({
        prompt: message,
        language: i18next.language || "en-US",
        planContext: window.yachtContext,
      }),
    });

    removeTypingIndicator();
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const aiResponse = await response.json();
    if (aiResponse.message) addMessageToChat(aiResponse.message, false);
    else if (aiResponse.chat_response) addMessageToChat(aiResponse.chat_response, false);

    if (aiResponse.action === "tripPlan" && aiResponse.plan) {
      renderTripPlan(aiResponse.plan);
    } else if (aiResponse.action === "serviceSearch" && aiResponse.parameters?.query) {
      await fetchAndDisplayServices(aiResponse.parameters);
    }

    if (aiResponse.yacht_context) {
      window.yachtContext = { ...window.yachtContext, ...aiResponse.yacht_context };
    }

    // Smart conversion: after showing value, prompt sign-up
    if (atLimit) {
      setTimeout(() => {
        addMessageToChat("You're getting great results! **Sign in for free** to save your trips, get unlimited planning, and unlock PDF exports.", false);
        showAuthModal();
      }, 1500);
    }
  } catch (error) {
    console.error("Failed to get AI response:", error);
    removeTypingIndicator();
    addMessageToChat("I apologize, but I'm having trouble processing your request. Please try again.", false);
  }
}

function showWelcomeMessages() {
  setTimeout(() => {
    addMessageToChat("Hello! I'm Leonard, your AI yacht concierge.", false);
    setTimeout(() => {
      addMessageToChat("I can help you:\n\nPlan complete yacht trips (try: 'Plan a trip from Monaco to Saint-Tropez')\nFind marinas, restaurants, services\nOrganize your perfect voyage\n\nWhat would you like to do today?", false);
    }, 1200);
  }, 500);
}

// Service quick-action functions
window.askAboutMaintenance = () => { document.getElementById("chat-input").value = "I need to find a marine mechanic for boat maintenance"; handleSend(); };
window.askAboutMarina = () => { document.getElementById("chat-input").value = "Find me a good marina with excellent facilities"; handleSend(); };
window.askAboutProvisions = () => { document.getElementById("chat-input").value = "I need provisioning and catering services for my yacht"; handleSend(); };
window.askAboutCrew = () => { document.getElementById("chat-input").value = "Help me find professional crew members"; handleSend(); };
window.askAboutDining = () => { document.getElementById("chat-input").value = "Find waterfront restaurants with yacht docking"; handleSend(); };
window.askAboutExperiences = () => { document.getElementById("chat-input").value = "What water activities are available nearby?"; handleSend(); };
window.askAboutConcierge = () => { document.getElementById("chat-input").value = "I need luxury concierge services"; handleSend(); };
window.askAboutFuel = () => { document.getElementById("chat-input").value = "Where can I find fuel docks nearby?"; handleSend(); };

function handleSend() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (message) {
    sendMessage(message);
    input.value = "";
    input.style.height = "auto";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await i18next.use(i18nextHttpBackend).init({
    lng: "en-US",
    fallbackLng: "en-US",
    backend: { loadPath: "/locales/{{lng}}/translation.json" },
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const target = el.getAttribute("data-i18n-target");
    if (target) el.setAttribute(target, i18next.t(key));
    else el.innerHTML = i18next.t(key);
  });

  const input = document.getElementById("chat-input");
  const button = document.getElementById("send-message-btn");
  button?.addEventListener("click", handleSend);
  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  input?.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang;
      await i18next.changeLanguage(lang);
      document.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        const target = el.getAttribute("data-i18n-target");
        if (target) el.setAttribute(target, i18next.t(key));
        else el.innerHTML = i18next.t(key);
      });
    });
  });

  // Initialize Firebase Auth UI
  initAuthUI();

  // Listen for auth state changes
  window.addEventListener("auth-state-changed", (e) => {
    const { user } = e.detail;
    const authContainer = document.getElementById("auth-container");
    if (authContainer) {
      if (user) {
        authContainer.innerHTML = createUserMenu(user);
        initUserMenu();
        closeAuthModal();
      } else {
        authContainer.innerHTML = `<button id="login-btn" class="btn bg-ocean-blue hover:bg-ocean-light text-white">Sign In</button>`;
        document.getElementById("login-btn")?.addEventListener("click", showAuthModal);
      }
    }
  });

  // Suggested prompt click handlers
  document.querySelectorAll(".prompt-suggestion").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt;
      if (prompt) {
        document.getElementById("chat-input").value = prompt;
        handleSend();
      }
    });
  });

  showWelcomeMessages();
  console.log("Leonard AI Yacht Concierge is ready!");
});
