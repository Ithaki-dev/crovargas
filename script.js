/**
 * ========================================
 * GALERÍA VERTICAL PREMIUM
 * Carrusel fullscreen con scroll y touch
 * Optimizado para 60fps
 * ========================================
 */

class VerticalGallery {
    constructor() {
        // Configuración inicial
        this.currentIndex = 0;
        this.isAnimating = false;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.scrollTimeout = null;
        this.scrollDirection = null;
        
        // Elementos del DOM
        this.slides = document.querySelectorAll('.gallery-slide');
        this.totalSlides = this.slides.length;
        this.currentSlideElement = document.querySelector('.current-slide');
        this.totalSlidesElement = document.querySelector('.total-slides');
        this.scrollHint = document.querySelector('.scroll-hint');
        
        // Inicialización
        this.init();
    }

    init() {
        // Configurar contador total
        this.totalSlidesElement.textContent = this.formatNumber(this.totalSlides);
        
        // Event listeners
        this.addEventListeners();
        
        // Activar primer slide
        this.updateSlide(0);
        
        // Precargar imágenes
        this.preloadImages();
        
        console.log('✅ Galería inicializada con', this.totalSlides, 'slides');
    }

    /**
     * Agregar todos los event listeners
     */
    addEventListeners() {
        // Scroll del mouse/trackpad
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Touch events para móvil
        window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
        window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Teclado (opcional)
        window.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Resize para optimización
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    }

    /**
     * Manejar evento de scroll del mouse
     */
    handleWheel(event) {
        event.preventDefault();
        
        if (this.isAnimating) return;
        
        // Ocultar hint al primer scroll
        this.hideScrollHint();
        
        const delta = Math.sign(event.deltaY);
        
        if (delta > 0) {
            // Scroll down - siguiente slide
            this.nextSlide();
        } else {
            // Scroll up - slide anterior
            this.prevSlide();
        }
    }

    /**
     * Touch start
     */
    handleTouchStart(event) {
        this.touchStartY = event.touches[0].clientY;
    }

    /**
     * Touch move
     */
    handleTouchMove(event) {
        this.touchEndY = event.touches[0].clientY;
    }

    /**
     * Touch end - detectar dirección del swipe
     */
    handleTouchEnd() {
        if (this.isAnimating) return;
        
        const swipeDistance = this.touchStartY - this.touchEndY;
        const minSwipeDistance = 50; // mínimo 50px para activar
        
        this.hideScrollHint();
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swipe up - siguiente slide
                this.nextSlide();
            } else {
                // Swipe down - slide anterior
                this.prevSlide();
            }
        }
        
        // Reset
        this.touchStartY = 0;
        this.touchEndY = 0;
    }

    /**
     * Navegación con teclado
     */
    handleKeyboard(event) {
        if (this.isAnimating) return;
        
        switch(event.key) {
            case 'ArrowDown':
            case 'PageDown':
                event.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowUp':
            case 'PageUp':
                event.preventDefault();
                this.prevSlide();
                break;
            case 'Home':
                event.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                event.preventDefault();
                this.goToSlide(this.totalSlides - 1);
                break;
        }
    }

    /**
     * Ir al siguiente slide
     */
    nextSlide() {
        if (this.currentIndex < this.totalSlides - 1) {
            this.scrollDirection = 'down';
            this.goToSlide(this.currentIndex + 1);
        }
    }

    /**
     * Ir al slide anterior
     */
    prevSlide() {
        if (this.currentIndex > 0) {
            this.scrollDirection = 'up';
            this.goToSlide(this.currentIndex - 1);
        }
    }

    /**
     * Ir a un slide específico
     */
    goToSlide(index) {
        if (index === this.currentIndex || this.isAnimating) return;
        if (index < 0 || index >= this.totalSlides) return;
        
        this.isAnimating = true;
        
        // Aplicar clases de dirección para parallax
        const currentSlide = this.slides[this.currentIndex];
        const nextSlide = this.slides[index];
        
        if (this.scrollDirection === 'down') {
            currentSlide.classList.add('scrolling-down');
        } else if (this.scrollDirection === 'up') {
            currentSlide.classList.add('scrolling-up');
        }
        
        // Remover clase active del slide actual
        currentSlide.classList.remove('active');
        currentSlide.classList.add('prev');
        
        // Activar nuevo slide
        nextSlide.classList.remove('prev');
        nextSlide.classList.add('active');
        
        // Actualizar índice
        this.currentIndex = index;
        
        // Actualizar UI
        this.updateCounter();
        
        // Limpiar animación
        setTimeout(() => {
            currentSlide.classList.remove('prev', 'scrolling-down', 'scrolling-up');
            this.isAnimating = false;
            this.scrollDirection = null;
        }, 800); // Debe coincidir con var(--transition-speed)
    }

    /**
     * Actualizar slide y contador
     */
    updateSlide(index) {
        this.currentIndex = index;
        this.updateCounter();
    }

    /**
     * Actualizar contador visual
     */
    updateCounter() {
        this.currentSlideElement.textContent = this.formatNumber(this.currentIndex + 1);
    }

    /**
     * Formatear número con cero inicial
     */
    formatNumber(num) {
        return num < 10 ? `0${num}` : `${num}`;
    }

    /**
     * Ocultar hint de scroll
     */
    hideScrollHint() {
        if (this.scrollHint && !this.scrollHint.classList.contains('hidden')) {
            this.scrollHint.classList.add('hidden');
            
            // Remover del DOM después de la animación
            setTimeout(() => {
                this.scrollHint.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Precargar imágenes para mejor performance
     */
    preloadImages() {
        const images = document.querySelectorAll('.gallery-image[loading="lazy"]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src; // Forzar carga
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px' // Cargar cuando esté cerca del viewport
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Handle resize
     */
    handleResize() {
        // Reajustar si es necesario
        console.log('Ventana redimensionada');
    }

    /**
     * Debounce helper
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

/**
 * ========================================
 * INICIALIZACIÓN
 * ========================================
 */

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
} else {
    initGallery();
}

function initGallery() {
    // Crear instancia de la galería
    const gallery = new VerticalGallery();
    
    // Exponer globalmente para debugging (opcional)
    window.gallery = gallery;
}

/**
 * ========================================
 * OPTIMIZACIONES ADICIONALES
 * ========================================
 */

// Prevenir scroll por defecto en todo el documento
document.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });

// Performance monitoring (desarrollo)
if (window.performance && window.performance.mark) {
    window.performance.mark('gallery-init-start');
    
    window.addEventListener('load', () => {
        window.performance.mark('gallery-init-end');
        window.performance.measure('gallery-init', 'gallery-init-start', 'gallery-init-end');
        
        const measure = window.performance.getEntriesByName('gallery-init')[0];
        console.log(`⚡ Galería cargada en ${measure.duration.toFixed(2)}ms`);
    });
}