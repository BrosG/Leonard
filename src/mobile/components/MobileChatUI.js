import i18next from 'i18next';
import { ASSETS } from '../../config/constants.js';

/**
 * MobileChatUI Component
 * 
 * Complete mobile chat interface for yacht concierge application
 * Includes loading modal, service selection overlay, yacht profile view, and chat interface
 */
const MobileChatUI = () => {
  return `
    <!-- Loading Modal -->
    <div id="loading-modal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] transition-opacity duration-300 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div class="bg-white p-8 rounded-3xl shadow-2xl text-center transform transition-all animate-fade-in max-w-sm mx-4">
        <div class="relative w-20 h-20 mx-auto mb-6">
          <div class="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-t-ocean-blue rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center text-2xl">⚓</div>
        </div>
        <p class="text-xl font-bold text-gray-800 mb-2" data-i18n="loading.title">Creating Your Perfect Yacht Itinerary ⚓</p>
        <p class="text-sm text-gray-500" data-i18n="loading.subtitle">Leonard is charting your course...</p>
      </div>
    </div>

    <!-- Notification Sound -->
    <audio id="notification-sound" preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BhGAg+ltryxHMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXyzn0vBSF1xe/glEILElyx6OyrWBYKPJjb88p5KwUme8rxzn8yBx1tv+7mnEoODlWq5O+0YxoIM5DT8st7LwUjfMrx0IY1Bx5owO7kmkkODlOo4/C2ZBsIN47T8sx8MAUhdsXv3ZJBCxNbq+fvrVgXCjqV2PHFeSkFKH3M8tuLOwcZZrrs4p5PEApMo+HxtWMcBTSL0/POfy4EI3fH8N6SQQoUXbLp66hVFApFneDxwGwhBTCG0PPTgjMGHW/A7+OYRw0PVqzl77FiGQc7ldnxx3UoBSh9y/HaiDkGGWW57OWgURILTKPh8bVjHAU0itPyz4AvBSJ2x+/ekUILE12y6eurWBUJQ5vd8cBsIAQvh9Dz1IIzBh1vwO/jl0YMEMFE" type="audio/wav">
    </audio>

    <!-- Service Selection Overlay (Tinder-style swipe interface) -->
    <div id="service-selection-overlay" class="hidden fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-900/95 backdrop-blur-lg z-50 flex flex-col items-center justify-end transition-opacity duration-300 animate-fade-in">
      <!-- Header -->
      <div class="absolute top-0 left-0 right-0 pt-16 pb-8 px-6 text-center text-white bg-gradient-to-b from-gray-900/80 to-transparent">
          <div class="mb-3">
            <span class="text-5xl">⚓</span>
          </div>
          <h2 class="text-3xl font-bold tracking-tight mb-2" data-i18n="mobile.servicePrompt.title">Let's Find Your Marine Services!</h2>
          <p class="text-lg opacity-90" data-i18n="mobile.servicePrompt.subtitle">Swipe to find the best services for your yacht. ⚓</p>
          <div class="mt-4 flex items-center justify-center gap-6 text-sm opacity-75">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span>Swipe Left to Pass</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span>Swipe Right to Select</span>
            </div>
          </div>
      </div>

      <!-- Card Stack Container -->
      <div id="service-card-stack" class="relative w-full h-[75vh] max-w-md max-h-[650px] mb-12 px-4">
          <div class="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl flex items-center justify-center text-white/40 border-2 border-white/10 backdrop-blur-sm">
              <div class="text-center">
                <div class="text-4xl mb-3">🔍</div>
                <p class="text-lg font-semibold">Loading services...</p>
              </div>
          </div>
      </div>

      <!-- Close Button -->
      <button id="service-selection-close-btn" class="absolute top-5 right-5 text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white z-10 backdrop-blur-sm">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span class="sr-only">Close selection</span>
      </button>
    </div>

    <!-- Yacht Itinerary View -->
    <div id="yacht-itinerary-view" class="hidden bg-gradient-to-br from-blue-50 to-cyan-50 w-full h-full flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-ocean-blue to-ocean-light text-white p-4 shadow-xl flex items-center justify-between flex-shrink-0">
        <button id="back-to-chat-btn" class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 class="text-xl font-bold flex-1 text-center flex items-center justify-center gap-2">
          <span>⚓</span>
          <span>Yacht Itinerary</span>
        </h2>
        <div class="w-10"></div>
      </div>

      <!-- Scrollable Content -->
      <div id="yacht-itinerary-content" class="flex-1 overflow-y-auto p-4">
        <!-- Content injected dynamically -->
      </div>
    </div>
  
    <!-- Main Chat Wrapper -->
    <div id="chat-wrapper" class="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 w-full h-full flex flex-col">
      <!-- Profile Header (Leonard's Info) -->
      <div id="mobile-profile-header" class="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200 cursor-pointer shadow-md active:bg-blue-100 transition-colors">
        <div class="flex items-center space-x-3">
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <img 
              src="${ASSETS.LEONARD_AVATAR}" 
              alt="Leonard - Your AI Yacht Concierge" 
              class="w-14 h-14 rounded-full object-cover border-3 border-ocean-blue shadow-xl ring-2 ring-blue-200"
              loading="eager"
              width="56"
              height="56"
            />
            <span class="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 border-2 border-white shadow-lg"></span>
          </div>

          <!-- Info -->
          <div class="flex-grow min-w-0">
            <h2 class="text-lg font-bold text-ocean-blue flex items-center gap-2" data-i18n="mobile.profile.name">
              <span>Leonard</span>
              <span class="text-base">⚓</span>
            </h2>
            <p class="text-sm text-gray-600 font-medium" data-i18n="mobile.profile.role">Your AI Yacht Concierge</p>
            <p class="text-xs text-green-600 font-semibold flex items-center gap-1" data-i18n="mobile.profile.status">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online & ready to assist!
            </p>
          </div>

          <!-- Toggle Icon -->
          <button id="profile-toggle-btn" class="p-2 rounded-full hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200 flex-shrink-0">
            <svg id="profile-toggle-icon" class="w-6 h-6 text-ocean-blue transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Profile Details (Collapsible) -->
      <div id="mobile-profile-details" class="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 overflow-hidden transition-all duration-500 ease-in-out border-b border-blue-200" style="max-height: 0px;">
        <div class="py-4">
          <h3 class="font-bold text-ocean-blue mb-2 flex items-center gap-2" data-i18n="mobile.profile.detailsTitle">
            <span>📋</span>
            <span>About Leonard</span>
          </h3>
          <p class="text-sm text-gray-700 leading-relaxed mb-4" data-i18n="mobile.profile.detailsContent">
            I'm your dedicated AI yacht concierge, trained on thousands of successful voyages. My goal is to make your maritime planning process smooth and enjoyable. Let's create your perfect voyage together!
          </p>
          
          <h3 class="font-bold text-ocean-blue mt-4 mb-3 flex items-center gap-2" data-i18n="mobile.profile.statsTitle">
            <span>📊</span>
            <span>Concierge Stats</span>
          </h3>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-white rounded-xl p-3 shadow-sm">
              <p class="text-2xl font-bold gradient-text">5,000+</p>
              <p class="text-xs text-gray-600 mt-1" data-i18n="mobile.profile.ownersHelped">Owners Helped</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm">
              <p class="text-2xl font-bold gradient-text">10,000+</p>
              <p class="text-xs text-gray-600 mt-1" data-i18n="mobile.profile.tripsPlanned">Trips Planned</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm">
              <p class="text-2xl font-bold gradient-text">4.9/5</p>
              <p class="text-xs text-gray-600 mt-1" data-i18n="mobile.profile.avgRating">Avg. Rating</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div id="chat-messages" class="flex-1 min-h-0 p-4 space-y-6 overflow-y-auto bg-white/40 overscroll-behavior-contain">
        <!-- Messages dynamically inserted here -->
      </div>

      <!-- Chat Input Container -->
      <div id="chat-input-container" class="p-4 bg-white border-t-2 border-blue-200 shadow-lg">
        <div class="relative flex items-center">
          <textarea
            id="chat-input"
            class="w-full p-4 pr-16 text-base text-gray-800 bg-gray-100 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-ocean-blue transition-all duration-200 resize-none"
            placeholder="Ask about marinas, routes, services..."
            data-i18n="chat.placeholder"
            data-i18n-target="placeholder"
            rows="1"
          ></textarea>
          <button id="send-message-btn" class="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-gradient-to-r from-ocean-blue to-ocean-light text-white shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <span class="sr-only" data-i18n="chat.send">Send</span>
          </button>
        </div>
        <p class="text-center text-xs text-gray-500 mt-2 flex items-center justify-center gap-1" data-i18n="chat.example">
          <span>💡</span>
          <span>Try: 'Find marinas in Monaco' or 'Plan a 3-day trip'</span>
        </p>
      </div>
    </div>
  `;
};

export default MobileChatUI;