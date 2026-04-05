/**
 * ServiceCard Component - Yacht Services
 * 
 * Renders a "Tinder-style" card for yacht service providers (Marina, Mechanic, Chef, etc.)
 * Optimized for mobile yacht concierge experience
 */

const renderStars = (rating) => {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
        stars += '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
    }
    if (halfStar) {
        stars += '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
    }
    return stars;
};

/**
 * Main ServiceCard Component
 * @param {Object} service - Service provider details
 * @returns {string} HTML string for the card
 */
const ServiceCard = (service) => {
    const placeholderImage = 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=800&auto=format&fit=crop';
    
    const {
        id = 'default-service-id',
        photoUrl = placeholderImage,
        name = 'Marine Service Provider',
        category = 'Service',
        rating = 0,
        ratingsTotal = 0,
        address = 'Address not available'
    } = service;

    // Category-specific icons for yacht services
    const categoryIcons = {
        'marina': '⚓',
        'mechanic': '🔧',
        'fuel': '⛽',
        'provisions': '🍽️',
        'crew': '👨‍✈️',
        'restaurant': '🍷',
        'concierge': '🎩',
        'diving': '🤿',
        'water sports': '🏄',
        'captain': '⛵'
    };

    const categoryKey = category.toLowerCase();
    const categoryIcon = categoryIcons[categoryKey] || '🛥️';

    return `
    <div data-service-id="${id}" class="absolute w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transform transition-transform duration-300 ease-out">
      <div class="relative w-full h-full flex flex-col">
        <!-- Service Image -->
        <div class="w-full h-3/5 flex-shrink-0 bg-gradient-to-br from-blue-100 to-cyan-100 relative">
          <img 
            data-src="${photoUrl}" 
            src="${placeholderImage}" 
            alt="${name}" 
            class="lazy-image w-full h-full object-cover opacity-0 transition-opacity duration-500"
          >
          <!-- Category Badge -->
          <div class="absolute top-3 left-3 bg-ocean-blue/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
            <span>${categoryIcon}</span>
            <span>${category}</span>
          </div>
        </div>

        <!-- Service Details -->
        <div class="p-5 flex-grow flex flex-col justify-between bg-white">
          <div>
            <h3 class="text-2xl font-bold text-gray-800 mt-1 mb-2 truncate">${name}</h3>
            
            <!-- Rating -->
            <div class="flex items-center mb-3">
              <div class="flex">${renderStars(rating)}</div>
              <span class="text-sm text-gray-500 ml-2">(${ratingsTotal} reviews)</span>
            </div>
            
            <!-- Address -->
            <div class="flex items-start gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-ocean-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
              <p class="line-clamp-2 flex-1">${address}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-around items-center pt-5 gap-3">
            <button class="dislike-btn flex-1 py-3 px-4 rounded-full bg-white border-2 border-red-400 text-red-500 font-semibold shadow-md hover:bg-red-50 transition-colors transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
              <span class="text-sm">Pass</span>
            </button>

            <button class="like-btn flex-1 py-4 px-5 rounded-full bg-gradient-to-r from-ocean-blue to-ocean-light text-white font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span class="text-base">Select</span>
            </button>
          </div>
        </div>

        <!-- Swipe Overlays -->
        <div data-swipe-overlay="like" class="absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none opacity-0" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0) 0%, rgba(34, 197, 94, 0.3) 100%);">
          <div class="bg-white/95 backdrop-blur-sm border-4 border-green-500 text-green-600 text-5xl font-bold uppercase tracking-widest px-8 py-4 rounded-2xl shadow-2xl transform -rotate-12">
            <span class="flex items-center gap-3">
              <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Select
            </span>
          </div>
        </div>

        <div data-swipe-overlay="dislike" class="absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none opacity-0" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0) 0%, rgba(239, 68, 68, 0.3) 100%);">
          <div class="bg-white/95 backdrop-blur-sm border-4 border-red-500 text-red-600 text-5xl font-bold uppercase tracking-widest px-8 py-4 rounded-2xl shadow-2xl transform rotate-12">
            <span class="flex items-center gap-3">
              <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
              Pass
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default ServiceCard;