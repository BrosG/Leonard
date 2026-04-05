// D:\myyacht\src\desktop\DesktopUI.js
import './DesktopUI.css';
import { initializeLazyImageObserver } from '../components/LazyImage.js';
import { ASSETS } from '../config/constants.js';

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

let currentServices = [];
let currentServiceIndex = 0;
let activeDesktopCard = null;
let isDraggingDesktop = false;
let startPointDesktop = { x: 0, y: 0 };
let onSelectCallback = null;
let mouseHandlersAttached = false;

function renderServiceCard(service, index) {
    return `
    <div class="desktop-service-card" data-service-id="${service.id}" data-card-index="${index}" style="z-index: ${1000 - index};">
        <div class="card-inner relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing">
            <div class="relative w-full h-full flex flex-col">
                <div class="w-full h-3/5 flex-shrink-0 bg-gray-200">
                    <img 
                        src="${service.photoUrl || ASSETS.PLACEHOLDER_IMAGE}" 
                        alt="${service.name}" 
                        class="w-full h-full object-cover"
                    />
                </div>
                <div class="p-6 flex-grow flex flex-col justify-between">
                    <div>
                        <span class="text-xs font-semibold text-ocean-blue uppercase tracking-wide">${service.category || 'Service'}</span>
                        <h3 class="text-2xl font-bold text-gray-800 mt-1 truncate">${service.name}</h3>
                        <div class="flex items-center mt-2">
                            <div class="flex">${renderStars(service.rating)}</div>
                            <span class="text-sm text-gray-500 ml-2">(${service.ratingsTotal} reviews)</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-3 line-clamp-2">${service.address}</p>
                    </div>
                    <div class="flex justify-around items-center pt-6 gap-4">
                        <button class="desktop-dislike-btn flex-1 py-3 px-6 rounded-full bg-white border-2 border-red-400 text-red-500 font-semibold shadow-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                            <span>Pass</span>
                        </button>
                        <button class="desktop-like-btn flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-ocean-blue to-ocean-light text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>
                            <span>Select</span>
                        </button>
                    </div>
                </div>
                <div data-swipe-overlay="like" class="absolute inset-0 flex items-center justify-center pointer-events-none" style="background-color: rgba(34, 197, 94, 0); opacity: 0; transition: opacity 0.2s ease-in-out;">
                    <span class="text-6xl font-bold text-white border-4 border-white rounded-2xl px-8 py-4 transform -rotate-12 shadow-2xl">SELECT</span>
                </div>
                <div data-swipe-overlay="dislike" class="absolute inset-0 flex items-center justify-center pointer-events-none" style="background-color: rgba(239, 68, 68, 0); opacity: 0; transition: opacity 0.2s ease-in-out;">
                    <span class="text-6xl font-bold text-white border-4 border-white rounded-2xl px-8 py-4 transform rotate-12 shadow-2xl">PASS</span>
                </div>
            </div>
        </div>
    </div>
    `;
}

function cleanupEventListeners() {
    if (mouseHandlersAttached) {
        document.removeEventListener('mousemove', globalMouseMove);
        document.removeEventListener('mouseup', globalMouseUp);
        mouseHandlersAttached = false;
    }
}

let globalMouseMove = null;
let globalMouseUp = null;

function setupDesktopCardInteractions() {
    const cards = document.querySelectorAll('.desktop-service-card');
    if (cards.length === 0) return;

    cleanupEventListeners();

    const topCard = cards[0];
    const cardElement = topCard.querySelector('.card-inner');
    
    if (!cardElement) return;
    activeDesktopCard = cardElement;

    activeDesktopCard.style.transform = '';
    
    const likeOverlay = activeDesktopCard.querySelector('[data-swipe-overlay="like"]');
    const dislikeOverlay = activeDesktopCard.querySelector('[data-swipe-overlay="dislike"]');
    if (likeOverlay) {
        likeOverlay.style.opacity = '0';
        likeOverlay.style.backgroundColor = 'rgba(34, 197, 94, 0)';
    }
    if (dislikeOverlay) {
        dislikeOverlay.style.opacity = '0';
        dislikeOverlay.style.backgroundColor = 'rgba(239, 68, 68, 0)';
    }

    const onMouseDown = (e) => {
        if (e.target.closest('.desktop-like-btn') || e.target.closest('.desktop-dislike-btn')) {
            return;
        }
        
        isDraggingDesktop = true;
        startPointDesktop = { x: e.clientX, y: e.clientY };
        activeDesktopCard.style.transition = 'none';
        activeDesktopCard.style.cursor = 'grabbing';
        e.preventDefault();
    };

    globalMouseMove = (e) => {
        if (!isDraggingDesktop || !activeDesktopCard) return;
        
        const currentPoint = { x: e.clientX, y: e.clientY };
        const deltaX = currentPoint.x - startPointDesktop.x;
        const deltaY = currentPoint.y - startPointDesktop.y;
        const rotation = deltaX * 0.08;

        activeDesktopCard.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;

        const likeOverlay = activeDesktopCard.querySelector('[data-swipe-overlay="like"]');
        const dislikeOverlay = activeDesktopCard.querySelector('[data-swipe-overlay="dislike"]');
        const opacity = Math.min(Math.abs(deltaX) / 150, 0.9);

        if (deltaX > 20) {
            if (likeOverlay) {
                likeOverlay.style.opacity = opacity;
                likeOverlay.style.backgroundColor = `rgba(34, 197, 94, ${opacity * 0.3})`;
            }
            if (dislikeOverlay) {
                dislikeOverlay.style.opacity = '0';
                dislikeOverlay.style.backgroundColor = 'rgba(239, 68, 68, 0)';
            }
        } else if (deltaX < -20) {
            if (dislikeOverlay) {
                dislikeOverlay.style.opacity = opacity;
                dislikeOverlay.style.backgroundColor = `rgba(239, 68, 68, ${opacity * 0.3})`;
            }
            if (likeOverlay) {
                likeOverlay.style.opacity = '0';
                likeOverlay.style.backgroundColor = 'rgba(34, 197, 94, 0)';
            }
        } else {
            if (likeOverlay) {
                likeOverlay.style.opacity = '0';
                likeOverlay.style.backgroundColor = 'rgba(34, 197, 94, 0)';
            }
            if (dislikeOverlay) {
                dislikeOverlay.style.opacity = '0';
                dislikeOverlay.style.backgroundColor = 'rgba(239, 68, 68, 0)';
            }
        }
    };

    globalMouseUp = (e) => {
        if (!isDraggingDesktop || !activeDesktopCard) return;
        isDraggingDesktop = false;

        const deltaX = e.clientX - startPointDesktop.x;
        const threshold = 120;

        activeDesktopCard.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        activeDesktopCard.style.cursor = 'grab';

        if (Math.abs(deltaX) > threshold) {
            processDesktopChoice(deltaX > 0);
        } else {
            activeDesktopCard.style.transform = '';
            
            const likeOverlay = activeDesktopCard.querySelector('[data-swipe-overlay="like"]');
            const dislikeOverlay = activeDesktopCard.querySelector('[data-swipe-overlay="dislike"]');
            if (likeOverlay) {
                likeOverlay.style.opacity = '0';
                likeOverlay.style.backgroundColor = 'rgba(34, 197, 94, 0)';
            }
            if (dislikeOverlay) {
                dislikeOverlay.style.opacity = '0';
                dislikeOverlay.style.backgroundColor = 'rgba(239, 68, 68, 0)';
            }
        }
    };

    cardElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', globalMouseMove);
    document.addEventListener('mouseup', globalMouseUp);
    mouseHandlersAttached = true;

    cardElement._mouseDownHandler = onMouseDown;

    const likeBtn = topCard.querySelector('.desktop-like-btn');
    const dislikeBtn = topCard.querySelector('.desktop-dislike-btn');

    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            processDesktopChoice(true);
        });
    }

    if (dislikeBtn) {
        dislikeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            processDesktopChoice(false);
        });
    }

    const onKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            processDesktopChoice(false);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            processDesktopChoice(true);
        }
    };
    document.addEventListener('keydown', onKeyDown);
    topCard._keyHandler = onKeyDown;
}

function processDesktopChoice(isLike) {
    if (!activeDesktopCard || currentServiceIndex >= currentServices.length) return;

    const service = currentServices[currentServiceIndex];
    const topCard = document.querySelector('.desktop-service-card');
    
    if (!topCard) return;

    if (activeDesktopCard._mouseDownHandler) {
        activeDesktopCard.removeEventListener('mousedown', activeDesktopCard._mouseDownHandler);
    }
    
    cleanupEventListeners();
    
    if (topCard._keyHandler) {
        document.removeEventListener('keydown', topCard._keyHandler);
    }

    const flyoutX = (isLike ? 1 : -1) * (window.innerWidth);
    const rotation = (isLike ? 1 : -1) * 30;
    activeDesktopCard.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
    activeDesktopCard.style.transform = `translate(${flyoutX}px, 0) rotate(${rotation}deg)`;
    activeDesktopCard.style.opacity = '0';

    if (isLike && onSelectCallback) {
        onSelectCallback(service);
    }

    currentServiceIndex++;

    setTimeout(() => {
        if (topCard && topCard.parentElement) {
            topCard.remove();
        }
        activeDesktopCard = null;

        if (currentServiceIndex < currentServices.length) {
            renderNextDesktopCard();
        } else {
            closeDesktopServiceModal();
        }
    }, 400);
}

function renderNextDesktopCard() {
    const stack = document.getElementById('desktop-service-card-stack');
    if (!stack) return;

    const cardWrapper = document.createElement('div');
    cardWrapper.innerHTML = renderServiceCard(currentServices[currentServiceIndex], currentServiceIndex);
    stack.appendChild(cardWrapper.firstElementChild);

    const progressEl = document.getElementById('current-card-number');
    if (progressEl) {
        progressEl.textContent = currentServiceIndex + 1;
    }

    initializeLazyImageObserver(stack);
    setupDesktopCardInteractions();
}

function closeDesktopServiceModal() {
    const modal = document.getElementById('service-selection-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        cleanupEventListeners();
        currentServices = [];
        currentServiceIndex = 0;
        activeDesktopCard = null;
        onSelectCallback = null;
    }
}

export function renderServiceSelectionModal(category, services, onSelect) {
    const modalId = 'service-selection-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'desktop-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 99999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        `;
        document.body.appendChild(modal);
    }

    currentServices = services || [];
    currentServiceIndex = 0;
    onSelectCallback = onSelect;

    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    
    if (!services || services.length === 0) {
        modal.innerHTML = `
            <div class="desktop-modal-content" style="background-color: white; margin: 5% auto; padding: 40px; border-radius: 24px; width: 90%; max-width: 600px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative;">
                <span class="desktop-modal-close" style="position: absolute; top: 20px; right: 30px; font-size: 36px; font-weight: bold; cursor: pointer; color: #888;">&times;</span>
                <div class="text-center py-12">
                    <div class="text-6xl mb-6">😔</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">No ${categoryTitle}s Found</h2>
                    <p class="text-gray-600 text-lg mb-6">Sorry, I couldn't find any ${category}s in that area. Would you like to try a different location?</p>
                    <button class="desktop-modal-close px-8 py-3 bg-ocean-blue text-white rounded-full font-semibold hover:bg-ocean-light transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="desktop-modal-content" style="background-color: white; margin: 3% auto; padding: 40px; border-radius: 24px; width: 90%; max-width: 900px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative;">
                <span class="desktop-modal-close" style="position: absolute; top: 20px; right: 30px; font-size: 36px; font-weight: bold; cursor: pointer; color: #888; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;">&times;</span>
                
                <div class="text-center mb-8">
                    <h2 class="text-4xl font-bold text-gray-800 mb-3">Find Your Perfect ${categoryTitle}</h2>
                    <p class="text-gray-600 text-lg">Swipe right to select, left to pass</p>
                    <p class="text-sm text-gray-500 mt-2">💡 You can also use keyboard arrows or click the buttons</p>
                    <div class="mt-4 text-sm text-gray-600">
                        <span class="font-semibold text-ocean-blue">${services.length}</span> ${categoryTitle}${services.length !== 1 ? 's' : ''} found
                    </div>
                </div>

                <div id="desktop-service-card-stack" class="relative w-full mx-auto" style="height: 600px; max-width: 500px; perspective: 1200px;">
                    ${renderServiceCard(services[0], 0)}
                </div>

                <div class="mt-6 text-center">
                    <div class="inline-flex items-center gap-2 text-sm text-gray-600">
                        <span class="font-semibold" id="current-card-number">1</span>
                        <span>/</span>
                        <span>${services.length}</span>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const stack = document.getElementById('desktop-service-card-stack');
            if (stack) {
                initializeLazyImageObserver(stack);
                setupDesktopCardInteractions();
            }
        }, 0);
    }

    modal.style.display = 'block';

    document.body.style.overflow = 'hidden';

    const closeButtons = modal.querySelectorAll('.desktop-modal-close');
    closeButtons.forEach(btn => {
        const closeHandler = () => {
            closeDesktopServiceModal();
        };
        
        btn.addEventListener('click', closeHandler);
        
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = '#f3f4f6';
            btn.style.transform = 'rotate(90deg)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = 'transparent';
            btn.style.transform = 'rotate(0deg)';
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDesktopServiceModal();
        }
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeDesktopServiceModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

export function renderDesktopServicesUI(services, category) {
    console.warn('renderDesktopServicesUI is deprecated. Use renderServiceSelectionModal instead.');
}

export function renderDesktopChatUI() {
  return '';
}

export function renderDesktopWidgetUI() {
  return `
    <div id="fixed-chat-widget" class="hidden fixed bottom-5 right-5 w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 z-50 animate-fade-in">
      <div id="widget-header" class="flex items-center justify-between p-3 bg-gradient-to-r from-ocean-blue to-ocean-light text-white rounded-t-2xl cursor-pointer flex-shrink-0">
        <div class="flex items-center">
          <img src="${ASSETS.LEONARD_AVATAR}" alt="Leonard" class="w-8 h-8 rounded-full object-cover border-2 border-white" loading="lazy" width="32" height="32"/>
          <h4 class="ml-3 font-semibold" data-i18n="chat.widgetTitle">Chat with Leonard</h4>
        </div>
        <button id="minimize-chat-btn" class="p-1 hover:bg-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white" aria-label="Toggle Chat Widget">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <div id="widget-chat-messages" class="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
      </div>

      <div class="p-3 border-t border-gray-200 flex-shrink-0">
        <div class="relative">
          <input 
            type="text" 
            id="widget-chat-input" 
            data-i18n="chat.widgetInputPlaceholder"
            data-i18n-target="placeholder"
            placeholder="Ask a question..." 
            class="w-full py-2 px-4 pr-12 text-sm text-gray-700 bg-gray-100 rounded-full focus:ring-2 focus:ring-ocean-blue focus:outline-none"
          >
          <button 
            id="widget-send-btn" 
            class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-ocean-blue text-white rounded-full flex items-center justify-center hover:bg-ocean-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue"
            aria-label="Send Message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div id="floating-chat-button" title="Scroll to Chat">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.837 8.837 0 01-4.43-1.252l-1.936.912a.5.5 0 01-.63-.63l.912-1.936A8.837 8.837 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.415 13.878a7.001 7.001 0 0010.334-2.15 1 1 0 011.531 1.296A8.966 8.966 0 0110 18c-3.957 0-7.298-2.6-8.447-6.025a1 1 0 011.862-.697z" clip-rule="evenodd" />
      </svg>
    </div>
  `;
}