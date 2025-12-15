// ===================================
// Hotel Ortus - Interactive JavaScript
// ===================================

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  initNavigation();
  initHeroCarousel();
  initTestimonialsCarousel();
  initScrollAnimations();
  initContactForm();
  initStatCounters();
  initMobileMenu();
  initGalleryCarousel();
  initDiningCarousel();
  initAuth();
  loadSiteSettings(); // Load settings for dynamic content
});

// ===================================
// Navigation Functions
// ===================================
function initNavigation() {
  const navbar = document.getElementById("navbar");
  const navLinks = document.querySelectorAll(".nav-link");

  // Navbar scroll effect
  window.addEventListener("scroll", function () {
    if (window.scrollY > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Smooth scroll for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");

      // Only intercept internal anchor links
      if (targetId.startsWith("#")) {
        e.preventDefault();

        // Remove active class from all links
        navLinks.forEach((l) => l.classList.remove("active"));

        // Add active class to clicked link
        this.classList.add("active");

        // Get target section
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          targetSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Update active nav link on scroll
  window.addEventListener("scroll", function () {
    let current = "";
    const sections = document.querySelectorAll("section");

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

// ===================================
// Hero Carousel
// ===================================
function initHeroCarousel() {
  const carouselItems = document.querySelectorAll(".carousel-item");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  const indicators = document.querySelectorAll(".indicator");

  let currentSlide = 0;
  let autoPlayInterval;

  // Show slide function
  function showSlide(index) {
    carouselItems.forEach((item, i) => {
      item.classList.remove("active", "prev");
      if (i === index) {
        item.classList.add("active");
      } else if (i < index) {
        item.classList.add("prev");
      }
    });

    indicators.forEach((indicator, i) => {
      indicator.classList.remove("active");
      if (i === index) {
        indicator.classList.add("active");
      }
    });

    currentSlide = index;
  }

  // Next slide
  function nextSlide() {
    currentSlide = (currentSlide + 1) % carouselItems.length;
    showSlide(currentSlide);
  }

  // Previous slide
  function prevSlide() {
    currentSlide =
      (currentSlide - 1 + carouselItems.length) % carouselItems.length;
    showSlide(currentSlide);
  }

  // Auto-play
  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      stopAutoPlay();
      startAutoPlay(); // Restart auto-play
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      stopAutoPlay();
      startAutoPlay(); // Restart auto-play
    });
  }

  // Indicator clicks
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      showSlide(index);
      stopAutoPlay();
      startAutoPlay(); // Restart auto-play
    });
  });

  // Pause on hover
  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    heroSection.addEventListener("mouseenter", stopAutoPlay);
    heroSection.addEventListener("mouseleave", startAutoPlay);
  }

  // Start auto-play on page load
  startAutoPlay();
}

// ===================================
// Testimonials Carousel - Enhanced
// ===================================
function initTestimonialsCarousel() {
  const testimonialCards = document.querySelectorAll(".testimonial-card");
  const prevBtn = document.getElementById("testimonialPrev");
  const nextBtn = document.getElementById("testimonialNext");
  const dots = document.querySelectorAll(".testimonial-dots .dot");

  let currentTestimonial = 0;
  let autoPlayInterval;

  function showTestimonial(index) {
    // Remove active class from all cards and dots
    testimonialCards.forEach((card) => {
      card.classList.remove("active");
    });

    dots.forEach((dot) => {
      dot.classList.remove("active");
    });

    // Add active class to current card and dot
    if (testimonialCards[index]) {
      testimonialCards[index].classList.add("active");
    }

    if (dots[index]) {
      dots[index].classList.add("active");
    }

    currentTestimonial = index;
  }

  // Previous button
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentTestimonial =
        (currentTestimonial - 1 + testimonialCards.length) %
        testimonialCards.length;
      showTestimonial(currentTestimonial);
      restartAutoPlay();
    });
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
      showTestimonial(currentTestimonial);
      restartAutoPlay();
    });
  }

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showTestimonial(index);
      restartAutoPlay();
    });
  });

  // Auto-play functionality
  function startAutoPlay() {
    autoPlayInterval = setInterval(() => {
      currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
      showTestimonial(currentTestimonial);
    }, 8000); // Change every 8 seconds
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
  }

  function restartAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // Pause on hover
  const testimonialsSection = document.querySelector(".testimonials");
  if (testimonialsSection) {
    testimonialsSection.addEventListener("mouseenter", stopAutoPlay);
    testimonialsSection.addEventListener("mouseleave", startAutoPlay);
  }

  // Start auto-play
  startAutoPlay();
}

// ===================================
// Scroll Animations
// ===================================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Animate service cards
  const serviceCards = document.querySelectorAll(".service-card");
  serviceCards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${
      index * 0.1
    }s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });

  // Animate room cards
  const roomCards = document.querySelectorAll(".room-card");
  roomCards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${
      index * 0.1
    }s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });

  // Animate stat cards
  const statCards = document.querySelectorAll(".stat-card");
  statCards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${
      index * 0.15
    }s, transform 0.6s ease ${index * 0.15}s`;
    observer.observe(card);
  });
}

// ===================================
// Stat Counters Animation
// ===================================
function initStatCounters() {
  const statNumbers = document.querySelectorAll(".stat-number");

  const observerOptions = {
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
        entry.target.classList.add("counted");
        animateCounter(entry.target);
      }
    });
  }, observerOptions);

  statNumbers.forEach((stat) => observer.observe(stat));

  function animateCounter(element) {
    const target = parseInt(element.getAttribute("data-count"));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }
    }, 16);
  }
}

// ===================================
// Contact Form
// ===================================
function initContactForm() {
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Get form data
      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value || '',
        subject: document.getElementById("checkin")?.value || 'General Inquiry',
        message: document.getElementById("message").value,
      };

      // Basic validation
      if (!formData.name || !formData.email || !formData.message) {
        showFormMessage("Please fill in all required fields.", "error");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showFormMessage("Please enter a valid email address.", "error");
        return;
      }

      // Submit to API
      try {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const response = await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          showFormMessage(data.message, "success");
          contactForm.reset();
        } else {
          showFormMessage(data.message || "Failed to send message. Please try again.", "error");
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      } catch (error) {
        console.error('Contact form error:', error);
        showFormMessage("Failed to send message. Please try again later.", "error");
      }
    });
  }
}

function showFormMessage(message, type) {
  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;

  // Add base class and type class
  messageDiv.className = `form-message-popup ${type}`;

  // Remove inline styles as they are now in CSS
  // messageDiv.style.cssText = ... (removed)

  document.body.appendChild(messageDiv);

  // Remove message after 4 seconds
  setTimeout(() => {
    messageDiv.style.animation = "slideUp 0.3s ease forwards";
    setTimeout(() => messageDiv.remove(), 300);
  }, 4000);
}

// ===================================
// Mobile Menu - Rewritten for Better Performance
// ===================================
function initMobileMenu() {
  const hamburger = document.getElementById("mobileMenuToggle");
  const menu = document.getElementById("navMenu");
  const menuLinks = document.querySelectorAll(".nav-link");

  // Verify elements exist
  if (!hamburger || !menu) {
    console.error("Hamburger menu elements not found");
    return;
  }

  // Toggle menu function
  const toggleMenu = (forceClose = false) => {
    const isActive = menu.classList.contains("active");

    if (forceClose || isActive) {
      hamburger.classList.remove("active");
      menu.classList.remove("active");
      document.body.style.overflow = "";
    } else {
      hamburger.classList.add("active");
      menu.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  };

  // Hamburger click handler
  hamburger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking on nav links
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggleMenu(true);
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      menu.classList.contains("active") &&
      !menu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      toggleMenu(true);
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("active")) {
      toggleMenu(true);
    }
  });

  // Close menu on window resize (if opened on mobile and resized to desktop)
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && menu.classList.contains("active")) {
      toggleMenu(true);
    }
  });
}

// ===================================
// Additional Animations (CSS Keyframes in JS)
// ===================================
// ===================================
// Additional Animations (CSS Keyframes in JS)
// ===================================
// Styles are now handled in styles.css to avoid conflicts

// ===================================
// Utility Functions
// ===================================

// Smooth scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Add scroll to top button (optional)
window.addEventListener("scroll", function () {
  const scrollBtn = document.getElementById("scrollToTop");
  if (scrollBtn) {
    if (window.scrollY > 500) {
      scrollBtn.style.display = "flex";
    } else {
      scrollBtn.style.display = "none";
    }
  }
});

// Log initialization
console.log("Hotel Ortus website initialized successfully! ✨");

// ===================================
// Authentication Modal Functions
// ===================================

// Current user state
let currentUser = null;

// Google Client ID
const GOOGLE_CLIENT_ID = '603456067130-ojleafibdq0eab4g36amcf5t9qah3jvf.apps.googleusercontent.com';

// Initialize authentication
function initAuth() {
  const signInBtn = document.getElementById("signInBtn");
  const mobileSignInBtn = document.getElementById("mobileSignInBtn");
  const mobileSignInIcon = document.getElementById("mobileSignInIcon");
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");

  // Check if user is already logged in
  checkAuthStatus();

  // Initialize Google Sign-In
  initGoogleSignIn();

  // Open sign-in modal when button clicked
  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      if (currentUser) {
        showUserMenu();
      } else {
        openModal("signInModal");
      }
    });
  }

  // Open sign-in modal when mobile icon clicked (navbar icon)
  if (mobileSignInIcon) {
    mobileSignInIcon.addEventListener("click", () => {
      if (currentUser) {
        showUserMenu();
      } else {
        openModal("signInModal");
      }
    });
  }

  // Open sign-in modal when mobile button clicked (also close menu)
  if (mobileSignInBtn) {
    mobileSignInBtn.addEventListener("click", () => {
      // Close mobile menu first
      const menu = document.getElementById("navMenu");
      const hamburger = document.getElementById("mobileMenuToggle");
      if (menu) menu.classList.remove("active");
      if (hamburger) hamburger.classList.remove("active");
      document.body.style.overflow = "";

      if (currentUser) {
        showUserMenu();
      } else {
        openModal("signInModal");
      }
    });
  }

  // Handle sign-in form submission
  if (signInForm) {
    signInForm.addEventListener("submit", handleSignIn);
  }

  // Handle sign-up form submission
  if (signUpForm) {
    signUpForm.addEventListener("submit", handleSignUp);
  }

  // Close modals on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal("signInModal");
      closeModal("signUpModal");
      closeUserMenu();
    }
  });
}

// Initialize Google Sign-In
function initGoogleSignIn() {
  // Add click handlers to Google buttons
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const googleSignUpBtn = document.getElementById("googleSignUpBtn");

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", handleGoogleAuth);
  }

  if (googleSignUpBtn) {
    googleSignUpBtn.addEventListener("click", handleGoogleAuth);
  }
}

// Handle Google Authentication via popup
function handleGoogleAuth() {
  // Build the Google OAuth URL
  const redirectUri = encodeURIComponent(window.location.origin + '/api/auth/google/callback');
  const scope = encodeURIComponent('email profile');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent`;
  
  // Open popup window
  const width = 500;
  const height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  
  const popup = window.open(
    authUrl,
    'Google Sign In',
    `width=${width},height=${height},left=${left},top=${top}`
  );
  
  // Check if popup was blocked
  if (!popup) {
    showAuthMessage("Please allow popups for this site", "error");
    return;
  }
  
  // Listen for messages from popup
  window.addEventListener('message', function handleMessage(event) {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      currentUser = event.data.user;
      showAuthMessage(event.data.message, "success");
      updateUIForLoggedInUser();
      
      setTimeout(() => {
        closeModal("signInModal");
        closeModal("signUpModal");
      }, 1000);
      
      window.removeEventListener('message', handleMessage);
    } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
      showAuthMessage(event.data.message || "Google sign-in failed", "error");
      window.removeEventListener('message', handleMessage);
    }
  });
}

// Handle Google Sign-In callback (for ID token flow - backup)
async function handleGoogleSignIn(response) {
  try {
    showAuthMessage("Signing in with Google...", "success");
    
    const result = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ credential: response.credential })
    });

    const data = await result.json();

    if (data.success) {
      currentUser = data.user;
      showAuthMessage(data.message, "success");
      updateUIForLoggedInUser();

      // Close modals
      setTimeout(() => {
        closeModal("signInModal");
        closeModal("signUpModal");
      }, 1000);
    } else {
      showAuthMessage(data.message || "Google sign-in failed", "error");
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    showAuthMessage("Connection error. Please try again.", "error");
  }
}

// Check authentication status on page load
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/auth/check", {
      credentials: "include"
    });
    const data = await response.json();
    
    if (data.loggedIn && data.user) {
      currentUser = data.user;
      updateUIForLoggedInUser();
    }
  } catch (error) {
    console.log("Auth check failed:", error.message);
  }
}

// Update UI to show logged-in state
function updateUIForLoggedInUser() {
  const signInBtn = document.getElementById("signInBtn");
  const mobileSignInBtn = document.getElementById("mobileSignInBtn");
  const adminLink = document.getElementById("adminLink");
  
  if (signInBtn && currentUser) {
    signInBtn.innerHTML = `
      <i class="fas fa-user-check"></i>
      <span>${currentUser.name.split(' ')[0]}</span>
    `;
    signInBtn.classList.add("logged-in");
  }
  
  if (mobileSignInBtn && currentUser) {
    mobileSignInBtn.innerHTML = `
      <i class="fas fa-user-check"></i>
      <span>${currentUser.name.split(' ')[0]}</span>
    `;
  }
  
  // Check if user is admin and show admin button
  if (adminLink) {
    checkAdminStatus().then(isAdmin => {
      adminLink.style.display = isAdmin ? 'flex' : 'none';
    });
  }
}

// Check if current user is admin
async function checkAdminStatus() {
  try {
    const response = await fetch('/api/admin/check', {
      credentials: 'include'
    });
    const data = await response.json();
    return data.isAdmin || false;
  } catch (error) {
    return false;
  }
}

// Update UI to show logged-out state
function updateUIForLoggedOutUser() {
  const signInBtn = document.getElementById("signInBtn");
  const mobileSignInBtn = document.getElementById("mobileSignInBtn");
  const adminLink = document.getElementById("adminLink");
  
  if (signInBtn) {
    signInBtn.innerHTML = `
      <i class="fas fa-user"></i>
      <span>Sign In</span>
    `;
    signInBtn.classList.remove("logged-in");
  }
  
  if (mobileSignInBtn) {
    mobileSignInBtn.innerHTML = `
      <i class="fas fa-user"></i>
      <span>Sign In</span>
    `;
  }
  
  // Hide admin button
  if (adminLink) {
    adminLink.style.display = 'none';
  }
  
  currentUser = null;
}

// Show user menu dropdown
function showUserMenu() {
  // Remove existing menu if any
  closeUserMenu();
  
  const menuHTML = `
    <div class="user-menu-overlay" onclick="closeUserMenu()"></div>
    <div class="user-menu">
      <div class="user-menu-header">
        <i class="fas fa-user-circle"></i>
        <div class="user-info">
          <span class="user-name">${currentUser.name}</span>
          <span class="user-email">${currentUser.email}</span>
        </div>
      </div>
      <div class="user-menu-divider"></div>
      <button class="user-menu-item" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt"></i>
        <span>Sign Out</span>
      </button>
    </div>
  `;
  
  document.body.insertAdjacentHTML("beforeend", menuHTML);
}

// Close user menu
function closeUserMenu() {
  const overlay = document.querySelector(".user-menu-overlay");
  const menu = document.querySelector(".user-menu");
  if (overlay) overlay.remove();
  if (menu) menu.remove();
}

// Open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = ""; // Restore scrolling
  }
}

// Switch between modals
function switchModal(fromModalId, toModalId) {
  closeModal(fromModalId);
  setTimeout(() => openModal(toModalId), 300); // Delay for smooth transition
}

// Handle sign-in
async function handleSignIn(e) {
  e.preventDefault();

  const email = document.getElementById("signInEmail").value;
  const password = document.getElementById("signInPassword").value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Basic validation
  if (!email || !password) {
    showAuthMessage("Please fill in all fields", "error");
    return;
  }

  // Disable button during request
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      showAuthMessage(data.message, "success");
      updateUIForLoggedInUser();

      // Close modal after successful sign-in
      setTimeout(() => {
        closeModal("signInModal");
        document.getElementById("signInForm").reset();
      }, 1500);
    } else {
      showAuthMessage(data.message || "Sign in failed", "error");
    }
  } catch (error) {
    console.error("Sign in error:", error);
    showAuthMessage("Connection error. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
  }
}

// Handle sign-up
async function handleSignUp(e) {
  e.preventDefault();

  const name = document.getElementById("signUpName").value;
  const email = document.getElementById("signUpEmail").value;
  const phone = document.getElementById("signUpPhone").value;
  const password = document.getElementById("signUpPassword").value;
  const confirmPassword = document.getElementById("signUpConfirmPassword").value;
  const acceptTerms = document.getElementById("acceptTerms").checked;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Validation
  if (!name || !email || !phone || !password || !confirmPassword) {
    showAuthMessage("Please fill in all fields", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage("Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showAuthMessage("Password must be at least 6 characters", "error");
    return;
  }

  if (!acceptTerms) {
    showAuthMessage("Please accept the terms and conditions", "error");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAuthMessage("Please enter a valid email address", "error");
    return;
  }

  // Disable button during request
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      showAuthMessage(data.message, "success");
      updateUIForLoggedInUser();

      // Close modal after successful registration
      setTimeout(() => {
        closeModal("signUpModal");
        document.getElementById("signUpForm").reset();
      }, 1500);
    } else {
      showAuthMessage(data.message || "Registration failed", "error");
    }
  } catch (error) {
    console.error("Sign up error:", error);
    showAuthMessage("Connection error. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Create Account <i class="fas fa-arrow-right"></i>';
  }
}

// Handle logout
async function handleLogout() {
  closeUserMenu();
  
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    const data = await response.json();

    if (data.success) {
      updateUIForLoggedOutUser();
      showAuthMessage("Logged out successfully", "success");
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Even if request fails, clear local state
    updateUIForLoggedOutUser();
  }
}

// Show authentication message
function showAuthMessage(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 20000;
        animation: slideDown 0.3s ease;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

  if (type === "success") {
    messageDiv.style.background = "linear-gradient(135deg, #4caf50, #45a049)";
    messageDiv.style.color = "#ffffff";
  } else {
    messageDiv.style.background = "linear-gradient(135deg, #f44336, #e53935)";
    messageDiv.style.color = "#ffffff";
  }

  document.body.appendChild(messageDiv);

  // Remove message after 3 seconds
  setTimeout(() => {
    messageDiv.style.animation = "slideUp 0.3s ease";
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// ===================================
// Gallery Carousel
// ===================================
function initGalleryCarousel() {
  const carousel = document.getElementById("galleryCarousel");
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".gallery-dot");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));

    currentSlide = index;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;

    slides[currentSlide].classList.add("active");
    dots[currentSlide].classList.add("active");
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startSlideShow() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }

  function stopSlideShow() {
    clearInterval(slideInterval);
  }

  // Event Listeners
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startSlideShow(); // Reset timer
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startSlideShow(); // Reset timer
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startSlideShow(); // Reset timer
    });
  });

  // Pause on hover
  const wrapper = document.querySelector(".gallery-carousel-wrapper");
  if (wrapper) {
    wrapper.addEventListener("mouseenter", stopSlideShow);
    wrapper.addEventListener("mouseleave", startSlideShow);
  }

  // Start slideshow
  startSlideShow();
}

// ===================================
// Dining Gallery Carousel
// ===================================
function initDiningCarousel() {
  const carousel = document.getElementById("diningCarousel");
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".dining-dot");
  const prevBtn = document.getElementById("diningPrev");
  const nextBtn = document.getElementById("diningNext");
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));

    currentSlide = index;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;

    slides[currentSlide].classList.add("active");
    dots[currentSlide].classList.add("active");
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startSlideShow() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }

  function stopSlideShow() {
    clearInterval(slideInterval);
  }

  // Event Listeners
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startSlideShow(); // Reset timer
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startSlideShow(); // Reset timer
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startSlideShow(); // Reset timer
    });
  });

  // Pause on hover
  const wrapper = document.querySelector(
    ".dining-gallery .gallery-carousel-wrapper"
  );
  if (wrapper) {
    wrapper.addEventListener("mouseenter", stopSlideShow);
    wrapper.addEventListener("mouseleave", startSlideShow);
  }

  // Start slideshow
  startSlideShow();
}

// Instagram-Style Couples Carousel
function initCouplesCarousel() {
  const reviews = document.querySelectorAll(".couple-review");
  const progressBars = document.querySelectorAll(".progress-bar");
  const prevBtn = document.getElementById("couplesPrev");
  const nextBtn = document.getElementById("couplesNext");
  let currentIndex = 0;
  let autoplayInterval;
  const SLIDE_DURATION = 3000; // 3 seconds

  function resetProgressBars() {
    progressBars.forEach((bar, index) => {
      bar.classList.remove("active", "completed");
      const fill = bar.querySelector(".progress-fill");
      fill.style.animation = "none";
      // Force reflow to restart animation
      void fill.offsetWidth;
    });
  }

  function showReview(index, direction = "next") {
    // Update index
    if (index >= reviews.length) currentIndex = 0;
    else if (index < 0) currentIndex = reviews.length - 1;
    else currentIndex = index;

    // Remove all active classes
    reviews.forEach((review) => {
      review.classList.remove(
        "active",
        "slide-in-right",
        "slide-in-left",
        "slide-out-right",
        "slide-out-left"
      );
    });

    // Add appropriate classes for Instagram-style slide
    reviews[currentIndex].classList.add("active");
    if (direction === "next") {
      reviews[currentIndex].classList.add("slide-in-right");
    } else {
      reviews[currentIndex].classList.add("slide-in-left");
    }

    // Update progress bars
    resetProgressBars();
    progressBars.forEach((bar, index) => {
      if (index < currentIndex) {
        bar.classList.add("completed");
      } else if (index === currentIndex) {
        bar.classList.add("active");
        const fill = bar.querySelector(".progress-fill");
        fill.style.animation = "fillProgress 3s linear forwards";
      }
    });
  }

  function nextReview() {
    showReview(currentIndex + 1, "next");
  }

  function prevReview() {
    showReview(currentIndex - 1, "prev");
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextReview, SLIDE_DURATION);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevReview();
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextReview();
      startAutoplay();
    });
  }

  progressBars.forEach((bar, index) => {
    bar.addEventListener("click", () => {
      showReview(index, index > currentIndex ? "next" : "prev");
      startAutoplay();
    });
  });

  const carouselWrapper = document.querySelector(".couples-carousel-wrapper");
  if (carouselWrapper) {
    carouselWrapper.addEventListener("mouseenter", stopAutoplay);
    carouselWrapper.addEventListener("mouseleave", startAutoplay);
  }

  // Initialize first slide
  showReview(0, "next");
  startAutoplay();
}

// Initialize on load
if (document.querySelector(".couples-carousel")) {
  initCouplesCarousel();
}

// ===================================
// Room Gallery Lightbox (Room Details Pages)
// ===================================
function initRoomGalleryLightbox() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxPrev = document.getElementById("lightboxPrev");

  if (!galleryItems.length || !lightbox) return;

  const images = Array.from(galleryItems).map(
    (item) => item.querySelector("img").src
  );
  let currentIndex = 0;

  // Open lightbox on image click
  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      currentIndex = index;
      openLightbox();
    });
  });

  function openLightbox() {
    lightbox.classList.add("active");
    updateImage();
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  function updateImage() {
    if (lightboxImage && images[currentIndex]) {
      lightboxImage.src = images[currentIndex];
    }
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
  }

  // Event listeners
  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", nextImage);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", prevImage);
  }

  // Click overlay to close
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox?.classList.contains("active")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });

  // Touch gestures
  let touchStartX = 0;
  lightbox?.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  lightbox?.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  });
}

// Initialize lightbox on room details pages
if (document.querySelector(".room-gallery")) {
  initRoomGalleryLightbox();
}

// ===================================
// Site Settings - Dynamic Content
// ===================================

async function loadSiteSettings() {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    
    if (data.success) {
      const settings = data.data;
      
      // Handle Offer Banner
      const offerBanner = document.getElementById('offerBanner');
      if (offerBanner) {
        if (settings.offerEnabled) {
          offerBanner.style.display = 'block';
          
          // Update offer content
          const offerTitle = offerBanner.querySelector('h3');
          const offerDesc = offerBanner.querySelector('.banner-left p');
          const offerExpiry = offerBanner.querySelector('.banner-expiry');
          
          if (offerTitle && settings.offerName) {
            offerTitle.textContent = settings.offerName;
          }
          
          if (offerDesc && settings.offerDescription) {
            offerDesc.textContent = settings.offerDescription;
          }
          
          if (offerExpiry && settings.offerExpiry) {
            const expiryDate = new Date(settings.offerExpiry);
            offerExpiry.textContent = `Expires: ${expiryDate.toLocaleDateString('en-IN', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}`;
          }
          
          // Update offer image
          const offerImg = offerBanner.querySelector('.banner-right img');
          if (offerImg && settings.offerImage) {
            offerImg.src = settings.offerImage;
          }
        } else {
          // Hide offer banner if disabled
          offerBanner.style.display = 'none';
        }
      }
      
      // Handle Couple Section
      const coupleSection = document.getElementById('coupleSection');
      if (coupleSection) {
        if (settings.coupleSectionEnabled) {
          coupleSection.style.display = 'block';
        } else {
          // Hide couple section if disabled
          coupleSection.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.log('Settings not available, using defaults');
    // Settings API not available, keep default content visible
  }
}

/* ===================================
   Collapsible Services Section Logic
   =================================== */
document.addEventListener('DOMContentLoaded', () => {
    const servicesHeader = document.getElementById('servicesHeader');
    const servicesGrid = document.querySelector('.services-grid');
    const toggleIcon = servicesHeader ? servicesHeader.querySelector('.toggle-icon') : null;

    if (servicesHeader && servicesGrid && toggleIcon) {
        servicesHeader.addEventListener('click', () => {
            servicesGrid.classList.toggle('collapsed');
            toggleIcon.classList.toggle('rotate');
        });
    }
});

/* ===================================
   Mobile Gallery Logic
   =================================== */
function changeMobileGalleryImage(thumbnail) {
    // Update main image source
    const featuredImage = document.getElementById('mobileFeaturedImage');
    const newSrc = thumbnail.src;
    
    // Add fade effect
    featuredImage.style.opacity = '0';
    setTimeout(() => {
        featuredImage.src = newSrc;
        featuredImage.style.opacity = '1';
    }, 200);

    // Update active thumbnail state
    const allThumbnails = document.querySelectorAll('.gallery-thumb');
    allThumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnail.parentElement.classList.add('active');
}

function changeDiningGalleryImage(thumbnail) {
    // Update main image source for dining gallery
    const featuredImage = document.getElementById('diningFeaturedImage');
    const newSrc = thumbnail.src;
    
    // Add fade effect
    featuredImage.style.opacity = '0';
    setTimeout(() => {
        featuredImage.src = newSrc;
        featuredImage.style.opacity = '1';
    }, 200);

    // Update active thumbnail state in dining gallery
    // Scope search to the dining gallery container to avoid conflict if classes are reused globally
    // But since structure is simple, looking for parent's siblings works or just scoping selector
    const galleryContainer = thumbnail.closest('.gallery-mobile-view');
    const allThumbnails = galleryContainer.querySelectorAll('.gallery-thumb');
    
    allThumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnail.parentElement.classList.add('active');
}

/* ===================================
   Booking Form Collapsible Logic
   =================================== */
function toggleBookingForm() {
    const card = document.querySelector('.booking-form-card');
    if (card) {
        card.classList.toggle('collapsed');
    }
}

function expandBookingForm() {
    const card = document.querySelector('.booking-form-card');
    if (card) {
        card.classList.remove('collapsed');
    }
}

// Initialize state based on screen width
function initFormState() {
    const card = document.querySelector('.booking-form-card');
    if (card) {
        if (window.innerWidth <= 768) {
            card.classList.add('collapsed');
        } else {
            card.classList.remove('collapsed');
        }
    }
}

document.addEventListener('DOMContentLoaded', initFormState);

// Sticky button handler
document.addEventListener('click', function(e) {
    if (e.target.closest('.sticky-book-btn') || e.target.classList.contains('sticky-book-btn')) {
        const btn = e.target.closest('.sticky-book-btn') || e.target;
        // Check if it's an anchor to #bookingForm
        if (btn.getAttribute('href') === '#bookingForm') {
            e.preventDefault();
            expandBookingForm();
            const formSection = document.getElementById('bookingForm');
            if (formSection) {
                const offset = 80;
                const elementPosition = formSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }
    }
});


function toggleFeature(element) {
    // Optional: Close others
    // const allFeatures = document.querySelectorAll('.feature-item');
    // allFeatures.forEach(item => {
    //     if (item !== element) item.classList.remove('active');
    // });
    
    element.classList.toggle('active');
}

function toggleFeaturesList() {
    const list = document.getElementById('aboutFeaturesList');
    const btn = document.getElementById('featuresToggleBtn');
    const btnText = btn.querySelector('span');
    
    if (list.style.display === 'none') {
        list.style.display = 'flex';
        // Small timeout to allow display change to register before opacity transition
        setTimeout(() => {
            list.classList.add('visible');
        }, 10);
        btn.classList.add('active');
        btnText.textContent = 'Hide Features';
    } else {
        list.classList.remove('visible');
        btn.classList.remove('active');
        btnText.textContent = 'View All Features';
        
        // Wait for animation to finish before hiding
        setTimeout(() => {
            list.style.display = 'none';
        }, 400); // Matches transition duration roughly
    }
}

/* ===================================
   Dining & Menu Logic
   =================================== */

// Global State
let publicMenu = [];
let cart = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPublicMenu();
    loadCartFromStorage();
});

// Load Menu
async function loadPublicMenu() {
    try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        publicMenu = data;
        
        // Render Featured (First 4)
        renderFeaturedMenu(publicMenu.slice(0, 4));
        
        // Render Full Menu
        renderPublicMenu(publicMenu);
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('featuredMenuGrid').innerHTML = '<p class="error-msg">Failed to load menu.</p>';
        document.getElementById('publicMenuGrid').innerHTML = '<p class="error-msg">Failed to load menu.</p>';
    }
}

// Render Featured Menu
function renderFeaturedMenu(items) {
    const grid = document.getElementById('featuredMenuGrid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="no-items-msg">Coming soon!</p>';
        return;
    }

    grid.innerHTML = items.map(item => createMenuCardHtml(item)).join('');
}

// Render Public Menu (Full)
function renderPublicMenu(items) {
    const grid = document.getElementById('publicMenuGrid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="no-items-msg">No items found in this category.</p>';
        return;
    }

    grid.innerHTML = items.map(item => createMenuCardHtml(item)).join('');
}

// Helper for Card HTML
function createMenuCardHtml(item) {
    return `
        <div class="menu-card">
            <div class="menu-img-wrapper">
                <img src="${item.image || 'images/menu-placeholder.png'}" alt="${item.name}" loading="lazy">
                <span class="${item.isVegetarian ? 'veg-badge' : 'non-veg-badge'}">
                    ${item.isVegetarian ? 'VEG' : 'NON-VEG'}
                </span>
            </div>
            <div class="menu-content">
                <h3 class="menu-title">${escapeHtml(item.name)}</h3>
                <p class="menu-desc">${item.description ? escapeHtml(item.description) : ''}</p>
                <div class="menu-footer">
                    <span class="menu-price">₹${item.price}</span>
                    <button class="btn-add-cart" onclick="addToCart('${item._id}')" ${!item.isAvailable ? 'disabled' : ''}>
                        ${item.isAvailable ? 'Add' : 'Sold Out'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Menu Modal Functions
function openMenuModal() {
    document.getElementById('menuOverlay').classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeMenuModal() {
    document.getElementById('menuOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Close on outside click
document.getElementById('menuOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'menuOverlay') {
        closeMenuModal();
    }
});

// Filter Menu (Category)
function filterMenu(category, btn) {
    // Update Active Tab
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Clear search if switching category
    const searchInput = document.getElementById('menuSearch');
    if (searchInput) searchInput.value = '';

    if (category === 'all') {
        renderPublicMenu(publicMenu);
    } else {
        const filtered = publicMenu.filter(item => item.category === category);
        renderPublicMenu(filtered);
    }
}

// Search Menu
function searchMenu(query) {
    // Reset tabs to All visually since search searches everything
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    // Select 'All' tab if it exists (optional polish)
    
    const term = query.toLowerCase();
    const filtered = publicMenu.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term)
    );
    renderPublicMenu(filtered);
}


/* ===================================
   Shopping Cart Logic
   =================================== */

function addToCart(itemId) {
    const item = publicMenu.find(i => i._id === itemId);
    if (!item) return;

    const existingItem = cart.find(i => i.menuItemId === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }

    updateCartUI();
    saveCartToStorage();
    
    // Show Feedback
    showToast(`Added ${item.name} to cart`);
}

// Toast System
function showToast(message) {
    // Create toast element if not exists
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.classList.add('show');

    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    saveCartToStorage();
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        updateCartUI();
        saveCartToStorage();
    }
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
    
    // Update List
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-msg" style="text-align: center; color: #adb5bd; padding-top: 3rem;">
                <i class="fas fa-utensils" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Your cart is empty</p>
                <button onclick="toggleCartDrawer()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: 1px solid #ced4da; background: white; border-radius: 20px; cursor: pointer;">Browse Menu</button>
            </div>
        `;
        totalEl.textContent = '₹0';
        return;
    }

    let totalAmount = 0;
    
    container.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">₹${itemTotal}</div>
                    <div class="cart-item-controls">
                        <button class="btn-qty" onclick="updateQuantity(${index}, -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="btn-qty" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');

    totalEl.textContent = `₹${totalAmount}`;
}

function toggleCartDrawer() {
    document.getElementById('cartDrawer').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
}

function saveCartToStorage() {
    localStorage.setItem('ortus_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('ortus_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            updateCartUI();
        } catch (e) {
            console.error('Error parsing cart', e);
        }
    }
}

async function placeOrder() {
    if (cart.length === 0) return alert('Your cart is empty');
    
    const name = document.getElementById('orderGuestName').value.trim();
    const room = document.getElementById('orderRoomNumber').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();
    
    if (!name || !room) {
        return alert('Please enter your name and room/table number');
    }

    const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const orderData = {
        items: cart,
        totalAmount,
        customerDetails: {
            name,
            roomNumber: room,
            notes
        }
    };

    const btn = document.querySelector('.btn-checkout');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert('Order placed successfully! We will verify and prepare it shortly.');
            cart = [];
            saveCartToStorage();
            updateCartUI();
            toggleCartDrawer();
            document.getElementById('orderNotes').value = ''; // Reset form
        } else {
            alert('Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Order error:', error);
        alert('Something went wrong. Please check your connection.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Utility
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
