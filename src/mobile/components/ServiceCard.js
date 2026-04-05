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

const ServiceCard = (service) => {
    const placeholderImage = 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=800&auto=format&fit=crop';
    
    const {
        id = 'default-service-id',
        photoUrl = placeholderImage,
        name = 'Amazing Marine Service',
        category = 'Service',
        rating = 0,
        ratingsTotal = 0,
        address = 'Address not available'
    } = service;

    return `
    <div data-service-id="${id}" class="absolute w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transform transition-transform duration-300 ease-out">
      <div class="relative w-full h-full flex flex-col">
        <div class="w-full h-3/5 flex-shrink-0 bg-gray-200">
          <img 
            data-src="${photoUrl}" 
            src="${placeholderImage}" 
            alt="${name}" 
            class="lazy-image w-full h-full object-cover opacity-0 transition-opacity duration-500"
          >
        </div>
        <div class="p-5 flex-grow flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-ocean-blue uppercase tracking-wide">${category}</span>
            <h3 class="text-2xl font-bold text-gray-800 mt-1 truncate">${name}</h3>
            <div class="flex items-center mt-2">
              <div class="flex">${renderStars(rating)}</div>
              <span class="text-sm text-gray-500 ml-2">(${ratingsTotal} reviews)</span>
            </div>
            <p class="text-sm text-gray-600 mt-3 line-clamp-2">${address}</p>
          </div>
          <div class="flex justify-around items-center pt-4">
            <button class="dislike-btn w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors transform hover:scale-110">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
            <button class="like-btn w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors transform hover:scale-110">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>
            </button>
          </div>
        </div>
        <div data-swipe-overlay="like" class="absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none opacity-0">
          <span class="block border-8 border-green-500 text-green-500 text-5xl font-bold uppercase tracking-widest px-8 py-4 rounded-2xl bg-white/80 transform -rotate-12">Select</span>
        </div>
        <div data-swipe-overlay="dislike" class="absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none opacity-0">
          <span class="block border-8 border-red-500 text-red-500 text-5xl font-bold uppercase tracking-widest px-8 py-4 rounded-2xl bg-white/80 transform rotate-12">Pass</span>
        </div>
      </div>
    </div>
  `;
};

export default ServiceCard;
