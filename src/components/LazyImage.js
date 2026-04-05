/**
 * Lazy Image Observer
 *
 * This module provides a reusable function to handle the logic for lazy-loading images
 * using the IntersectionObserver API. It is designed to be imported and used in any
 * part of the application where images need to be loaded on demand to improve performance.
 */

/**
 * Initializes an IntersectionObserver to watch for all elements with the `.lazy-image` class
 * within a given container. When an image enters the viewport, it replaces its `src`
 * with the URL from the `data-src` attribute, triggering the image download.
 *
 * The corresponding CSS should handle the initial state (e.g., `opacity-0`) and the
 * transition to the loaded state (e.g., `opacity-100`).
 *
 * @param {HTMLElement} [container=document] - The parent element to search for lazy images.
 *        Defaults to the entire document, but can be scoped to a specific container like a modal.
 */
export function initializeLazyImageObserver(container = document) {
    const lazyImages = container.querySelectorAll('img.lazy-image');

    // Fallback for older browsers that don't support IntersectionObserver.
    // Immediately loads all images.
    if (!("IntersectionObserver" in window)) {
        console.warn("IntersectionObserver not supported. Loading all images immediately.");
        lazyImages.forEach(image => {
            if (image.dataset.src) {
                image.src = image.dataset.src;
            }
            image.classList.remove('lazy-image', 'opacity-0');
            image.classList.add('opacity-100');
        });
        return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                
                // Set the src from data-src to trigger the download
                image.src = image.dataset.src;

                // Add a 'load' event listener to fade the image in once it's fully downloaded.
                image.onload = () => {
                    image.classList.remove('lazy-image', 'opacity-0');
                    image.classList.add('opacity-100');
                };

                // Handle cases where the image fails to load.
                image.onerror = () => {
                    console.error(`Failed to load image: ${image.dataset.src}`);
                    // Remove classes to stop observing and potentially show a broken image state.
                    image.classList.remove('lazy-image', 'opacity-0');
                };

                // Stop observing the image once it has been triggered.
                observer.unobserve(image);
            }
        });
    }, {
        // Start loading images 200px before they enter the viewport.
        // This provides a smoother experience as images are often loaded before the user sees the placeholder.
        rootMargin: "0px 0px 200px 0px"
    });

    lazyImages.forEach(image => {
        imageObserver.observe(image);
    });
}