/**
 * Core Website Functionality - Optimized & Secure
 * Handles essential features: header, navigation, language, accessibility
 */

// Utility functions
const utils = {
  // Debounce function for performance
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle
    return function () {
      const args = arguments
      
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  // Safe DOM element creation
  createElement(tag, className, attributes = {}) {
    const element = document.createElement(tag)
    if (className) element.className = className
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    return element
  },

  // Sanitize strings for XSS prevention
  sanitizeString(str) {
    if (typeof str !== "string") return ""
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim()
      .substring(0, 500)
  },
}

// Enhanced Header Controller
class HeaderController {
  constructor() {
    this.header = null
    this.lastScrollY = 0
    this.scrollThreshold = 50
    this.hideThreshold = 200
    this.isScrolling = false
    this.isInitialized = false

    // Try to initialize immediately, but don't fail if element doesn't exist
    this.init()
  }

  reinit() {
    // Reinitialize if header wasn't found before
    if (!this.isInitialized) {
      this.init()
    }
  }

  init() {
    // Find header element
    this.header = document.querySelector("header")
    
    if (!this.header) {
      // Header not found yet, will be initialized later
      return
    }

    // Use throttled scroll handler for better performance
    const throttledUpdate = utils.throttle(() => this.updateHeader(), 16) // ~60fps

    window.addEventListener("scroll", throttledUpdate, { passive: true })
    this.updateHeader() // Initial state
    this.isInitialized = true
  }

  updateHeader() {
    if (!this.header) return
    
    const currentScrollY = window.scrollY
    const scrollDifference = Math.abs(currentScrollY - this.lastScrollY)

    // Only update if scroll difference is significant
    if (scrollDifference < 5) return

    const scrollDirection = currentScrollY > this.lastScrollY ? "down" : "up"

    // Apply scrolled state
    this.header.classList.toggle("scrolled", currentScrollY > this.scrollThreshold)

    // Handle header visibility
    if (currentScrollY > this.hideThreshold) {
      if (scrollDirection === "down" && currentScrollY > this.lastScrollY + 10) {
        this.header.classList.add("scrolled-hidden")
        this.header.classList.remove("scrolled-visible")
      } else if (scrollDirection === "up" && currentScrollY < this.lastScrollY - 10) {
        this.header.classList.remove("scrolled-hidden")
        this.header.classList.add("scrolled-visible")
      }
    } else {
      this.header.classList.remove("scrolled-hidden")
      this.header.classList.add("scrolled-visible")
    }

    this.lastScrollY = currentScrollY
  }

  forceUpdate() {
    this.updateHeader()
  }
}

// Language Management System
class LanguageManager {
  constructor() {
    this.currentLanguage = "en"
    this.translations = window.translations || {}
    this.selectors = []
    this.storageKey = "selectedLanguage"
    this.isInitialized = false

    this.init()
  }

  init() {
    // Load saved language or detect from browser
    const savedLanguage = localStorage.getItem(this.storageKey)
    const browserLanguage = navigator.language.slice(0, 2)

    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage
    } else if (this.translations[browserLanguage]) {
      this.currentLanguage = browserLanguage
    }

    // Find selectors (may not exist yet)
    this.updateSelectors()
    this.applyTranslations()
    this.isInitialized = true
  }

  updateSelectors() {
    // Re-query selectors in case they were loaded dynamically
    const newSelectors = document.querySelectorAll(".language-select")
    
    // Remove old event listeners and add new ones
    this.selectors.forEach((selector) => {
      const newSelector = Array.from(newSelectors).find(s => s === selector)
      if (!newSelector) {
        // Selector was removed, create a new listener
        selector.removeEventListener("change", this._boundChangeHandler)
      }
    })

    this.selectors = Array.from(newSelectors)
    
    // Create bound handler if it doesn't exist
    if (!this._boundChangeHandler) {
      this._boundChangeHandler = (e) => this.changeLanguage(e.target.value)
    }

    // Set up event listeners for all selectors
    this.selectors.forEach((selector) => {
      selector.value = this.currentLanguage
      // Remove existing listener if any, then add new one
      selector.removeEventListener("change", this._boundChangeHandler)
      selector.addEventListener("change", this._boundChangeHandler)
    })
  }

  reinit() {
    // Reinitialize to pick up new selectors
    this.updateSelectors()
    this.applyTranslations()
  }

  changeLanguage(language) {
    if (!this.translations[language]) {
      console.warn(`Language ${language} not available`)
      return
    }

    this.currentLanguage = language
    localStorage.setItem(this.storageKey, language)

    // Update all selectors
    this.selectors.forEach((selector) => {
      selector.value = language
    })

    this.applyTranslations()

    // Dispatch event for other components
    document.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: { language },
      }),
    )

  }

  applyTranslations() {
    const elements = document.querySelectorAll("[data-key]")

    elements.forEach((element) => {
      const key = element.getAttribute("data-key")
      const translation = this.getTranslation(key)

      if (translation) {
        if (element.tagName === "INPUT" && element.type === "submit") {
          element.value = translation
        } else if (element.tagName === "INPUT" && element.placeholder !== undefined) {
          element.placeholder = translation
        } else {
          // Use innerHTML if translation contains HTML tags, otherwise use textContent for security
          if (translation.includes("<br>") || translation.includes("<br/>") || translation.includes("<br />")) {
            element.innerHTML = translation
          } else {
            element.textContent = translation
          }
        }
      }
    })
  }

  getTranslation(key) {
    const languageData = this.translations[this.currentLanguage]
    return languageData ? languageData[key] : null
  }

  getCurrentLanguage() {
    return this.currentLanguage
  }
}

// Mobile Menu Handler
class MobileMenuHandler {
  constructor() {
    this.menuBtn = null
    this.nav = null
    this.navItems = []
    this.isOpen = false
    this.isInitialized = false

    // Try to initialize immediately, but don't fail if elements don't exist
    this.init()
  }

  reinit() {
    // Reinitialize if elements weren't found before
    if (!this.isInitialized) {
      this.init()
    }
  }

  init() {
    // Find elements
    this.menuBtn = document.querySelector(".mobile-menu-btn")
    this.nav = document.querySelector("nav")
    
    if (!this.menuBtn || !this.nav) {
      // Elements not found yet, will be initialized later
      return
    }

    // Get nav items
    this.navItems = document.querySelectorAll("nav a")

    // Menu toggle
    this.menuBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.toggleMenu()
    })

    // Close menu when clicking nav items
    this.navItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (this.isOpen && window.innerWidth <= 768) {
          this.closeMenu()
        }
      })
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.nav.contains(e.target) && !this.menuBtn.contains(e.target)) {
        this.closeMenu()
      }
    })

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeMenu()
      }
    })

    // Close menu when window is resized to desktop
    window.addEventListener(
      "resize",
      utils.debounce(() => {
        if (window.innerWidth > 768 && this.isOpen) {
          this.closeMenu()
        }
      }, 250),
    )

    this.isInitialized = true
  }

  toggleMenu() {
    this.isOpen ? this.closeMenu() : this.openMenu()
  }

  openMenu() {
    this.nav.classList.add("active")
    this.menuBtn.setAttribute("aria-expanded", "true")
    this.menuBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>'
    this.isOpen = true
    document.body.style.overflow = "hidden"
  }

  closeMenu() {
    this.nav.classList.remove("active")
    this.menuBtn.setAttribute("aria-expanded", "false")
    this.menuBtn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>'
    this.isOpen = false
    document.body.style.overflow = ""
  }
}

// Smooth Scroll Handler
class SmoothScrollHandler {
  constructor() {
    this.initializedAnchors = new WeakSet()
    this.init()
  }

  init() {
    // Initialize existing anchors
    this.setupAnchors()
    
    // Use MutationObserver to handle dynamically added anchors
    if (window.MutationObserver) {
      const observer = new MutationObserver(() => {
        this.setupAnchors()
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    }
  }

  setupAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      // Skip if already initialized
      if (this.initializedAnchors.has(anchor)) {
        return
      }

      anchor.addEventListener("click", (e) => {
        const href = anchor.getAttribute("href")
        if (href === "#") return

        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          this.scrollToElement(target)
        }
      })

      this.initializedAnchors.add(anchor)
    })
  }

  scrollToElement(element) {
    const header = document.querySelector("header")
    const headerHeight = header ? header.offsetHeight : 0
    const targetPosition = element.offsetTop - headerHeight - 20

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    })
  }
}

// Accessibility Enhancements
class AccessibilityEnhancer {
  constructor() {
    this.init()
  }

  init() {
    this.addSkipLink()
    this.enhanceFocusManagement()
    this.improveKeyboardNavigation()
    this.setupAriaLiveRegions()
  }

  addSkipLink() {
    const skipLink = utils.createElement("a", "skip-link", {
      href: "#main",
      "aria-label": "Skip to main content",
    })

    skipLink.textContent = "Skip to main content"
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
      transition: top 0.3s ease;
    `

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px"
    })

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px"
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  enhanceFocusManagement() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation")
      }
    })

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-navigation")
    })
  }

  improveKeyboardNavigation() {
    document.querySelectorAll("[onclick], .clickable").forEach((element) => {
      if (!element.hasAttribute("tabindex")) {
        element.setAttribute("tabindex", "0")
      }

      element.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          element.click()
        }
      })
    })
  }

  setupAriaLiveRegions() {
    const liveRegion = utils.createElement("div", "sr-only", {
      "aria-live": "polite",
      "aria-atomic": "true",
      id: "live-region",
    })

    document.body.appendChild(liveRegion)

    // Global function to announce messages
    window.announceToScreenReader = (message) => {
      liveRegion.textContent = message
      setTimeout(() => {
        liveRegion.textContent = ""
      }, 1000)
    }
  }
}

// Scroll Animation Handler
class ScrollAnimator {
  constructor() {
    this.observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15,
    }
    this.init()
  }

  init() {
    // Add animation classes to major sections if they don't have them
    const sections = document.querySelectorAll("section, .hero-content, .project-intro, .timeline-item, .streamer-card, .team-member, .value")

    sections.forEach((section, index) => {
      section.classList.add("animate-on-scroll")
      // Add staggered delays for items in the same container
      if (section.classList.contains("timeline-item") || section.classList.contains("team-member") || section.classList.contains("value")) {
        const delay = (index % 3) * 100 + 100
        section.style.transitionDelay = `${delay}ms`
      }
    })

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          this.observer.unobserve(entry.target) // Only animate once
        }
      })
    }, this.observerOptions)

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      this.observer.observe(el)
    })
  }
}

// Error Handler
class ErrorHandler {
  constructor() {
    this.init()
  }

  init() {
    window.addEventListener("error", (e) => {
      this.logError(e.error, "Global Error")
    })

    window.addEventListener("unhandledrejection", (e) => {
      this.logError(e.reason, "Promise Rejection")
    })
  }

  logError(error, type) {
    const errorInfo = {
      type,
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    console.group(`❌ ${type}`)
    console.error(errorInfo)
    console.groupEnd()

    // In production, send to error tracking service
    // analytics.track('error', errorInfo);
  }
}

// Global utility functions
window.scrollToProject = () => {
  const projectSection = document.getElementById("the-project")
  if (projectSection) {
    const header = document.querySelector("header")
    const headerHeight = header ? header.offsetHeight : 0
    const targetPosition = projectSection.offsetTop - headerHeight - 20

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    })
  }
}

// Initialize core functionality
const initializeCoreComponents = () => {
  try {
    // Initialize core components (some may not find elements yet)
    if (!window.headerController) {
      window.headerController = new HeaderController()
    } else {
      window.headerController.reinit()
    }

    if (!window.languageManager) {
      window.languageManager = new LanguageManager()
    } else {
      window.languageManager.reinit()
    }

    if (!window.mobileMenuHandler) {
      window.mobileMenuHandler = new MobileMenuHandler()
    } else {
      window.mobileMenuHandler.reinit()
    }

    if (!window.smoothScrollHandler) {
      window.smoothScrollHandler = new SmoothScrollHandler()
    }

    if (!window.accessibilityEnhancer) {
      window.accessibilityEnhancer = new AccessibilityEnhancer()
    }

    if (!window.scrollAnimator) {
      window.scrollAnimator = new ScrollAnimator()
    }

    if (!window.errorHandler) {
      window.errorHandler = new ErrorHandler()
    }

    // Expose language manager globally
    window.changeLanguage = (language) => {
      if (window.languageManager) {
        window.languageManager.changeLanguage(language)
      }
    }

  } catch (error) {
    console.error("❌ Error during core initialization:", error)
  }
}

// Initialize immediately on DOMContentLoaded
document.addEventListener("DOMContentLoaded", initializeCoreComponents)

// Expose initialization function for components.js to call after components load
window.initializeCoreComponents = initializeCoreComponents

// Development debug helpers
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  window.debug = {
    header: () => window.headerController,
    language: () => window.languageManager,
    menu: () => window.mobileMenuHandler,
    forceHeaderUpdate: () => window.headerController?.forceUpdate(),
    getCurrentLanguage: () => window.languageManager?.getCurrentLanguage(),
  }

}
