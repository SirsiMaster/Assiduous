// Assiduous AI-Powered Real Estate System - Professional JavaScript

// Global State Management
const AppState = {
  currentSection: 'home',
  chatbotOpen: false,
  propertyData: [],
  userPreferences: {},
  currentLanguage: 'en',
  marketData: {
    propertiesAnalyzed: 1247,
    matchScore: 94.5,
    avgDaysToClose: 18,
    activeListings: 15432,
    predictionAccuracy: 96.7,
    investmentOpportunities: 127,
  },
};

// Comprehensive Internationalization Data
const i18nData = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.properties': 'Properties',
    'nav.buyers': 'For Buyers',
    'nav.sellers': 'For Sellers',
    'nav.aitools': 'AI Tools',
    'nav.contact': 'Contact',

    // Hero Section
    'hero.title': 'Assiduous AI-Powered Real Estate',
    'hero.subtitle':
      'Discover your perfect property with our advanced AI matching system. Get instant market analysis, automated property alerts, and personalized recommendations.',
    'hero.findProperties': 'Find Properties',
    'hero.getAnalysis': 'Get Market Analysis',

    // Features Section
    'features.title': 'Intelligent Assiduous Features',
    'features.aiMatching.title': 'AI Property Matching',
    'features.aiMatching.desc':
      'Our smart algorithm learns your preferences and automatically suggests properties that match your criteria.',
    'features.marketAnalysis.title': 'Instant Market Analysis',
    'features.marketAnalysis.desc':
      'Get real-time property valuations, market trends, and investment potential analysis powered by AI.',
    'features.smartAlerts.title': 'Smart Alerts',
    'features.smartAlerts.desc':
      'Never miss a deal with our AI-powered alert system that monitors the market 24/7 for your perfect match.',
    'features.aiAssistant.title': '24/7 AI Assistant',
    'features.aiAssistant.desc':
      'Get instant answers to your real estate questions with our intelligent chatbot available around the clock.',
    'features.mobile.title': 'Mobile Experience',
    'features.mobile.desc':
      'Access all features on the go with our responsive design and mobile-optimized interface.',
    'features.leadGen.title': 'Lead Generation',
    'features.leadGen.desc':
      'Automated lead capture and nurturing system that converts visitors into clients efficiently.',

    // Properties Section
    'properties.title': 'AI-Curated Properties',
    'properties.location': 'Location',
    'properties.locationPlaceholder': 'Enter city or ZIP code',
    'properties.priceRange': 'Price Range',
    'properties.propertyType': 'Property Type',
    'properties.singleFamily': 'Single Family',
    'properties.condo': 'Condo',
    'properties.multiFamily': 'Multi-Family',
    'properties.commercial': 'Commercial',
    'properties.searchBtn': 'Search with AI',
    'properties.found': 'Found',
    'properties.propertiesText': 'Properties',
    'properties.rankedBy': 'Ranked by AI compatibility score',
    'properties.beds': 'beds',
    'properties.baths': 'baths',
    'properties.sqft': 'sqft',
    'properties.aiMatch': 'AI Match',

    // Buyers Section
    'buyers.title': 'AI-Powered Buyer Services',
    'buyers.recommendations': 'Smart Property Recommendations',
    'buyers.analyzed': 'Properties Analyzed Today',
    'buyers.matchScore': 'AI Match Score',
    'buyers.daysToClose': 'Average Days to Close',
    'buyers.days': 'days',
    'buyers.alertsTitle': 'Set Up AI Property Alerts',
    'buyers.email': 'Email Address',
    'buyers.emailPlaceholder': 'your@email.com',
    'buyers.budget': 'Max Budget',
    'buyers.preferences': 'AI Learning Preferences',
    'buyers.preferencesPlaceholder': 'Modern, good schools, walkable neighborhood...',
    'buyers.activateAlerts': 'Activate AI Alerts',

    // Sellers Section
    'sellers.title': 'AI-Enhanced Seller Tools',
    'sellers.valuationTitle': 'Instant AI Property Valuation',
    'sellers.address': 'Property Address',
    'sellers.addressPlaceholder': '123 Main St, City, State',
    'sellers.bedrooms': 'Bedrooms',
    'sellers.bathrooms': 'Bathrooms',
    'sellers.squareFeet': 'Square Feet',
    'sellers.getValuation': 'Get AI Valuation',
    'sellers.valuationReport': 'AI Valuation Report',
    'sellers.estimatedValue': 'Estimated Value',
    'sellers.marketTrend': 'Market Trend',
    'sellers.daysOnMarket': 'Days on Market (Est.)',

    // AI Tools Section
    'aitools.title': 'Advanced AI Analytics',
    'aitools.marketIntelligence': 'Market Intelligence Dashboard',
    'aitools.activeListings': 'Active Listings Monitored',
    'aitools.predictionAccuracy': 'Price Predictions Accuracy',
    'aitools.opportunities': 'Investment Opportunities Found',
    'aitools.dealFlow': 'Deal Flow Analysis',
    'aitools.offMarketDeals': 'Off-Market Deals This Week',
    'aitools.roiPotential': 'Average ROI Potential',
    'aitools.flipOpportunities': 'Flip Opportunities',
    'aitools.customAnalysis': 'Custom AI Analysis Request',
    'aitools.analysisType': 'Analysis Type',
    'aitools.marketTrends': 'Market Trend Analysis',
    'aitools.investmentScreening': 'Investment Property Screening',
    'aitools.comparableSales': 'Comparable Sales Analysis',
    'aitools.rentalYield': 'Rental Yield Prediction',
    'aitools.targetArea': 'Target Area',
    'aitools.targetPlaceholder': 'Enter neighborhood or ZIP code',
    'aitools.generateReport': 'Generate AI Report',

    // Contact Section
    'contact.title': 'Get Started Today',
    'contact.fullName': 'Full Name',
    'contact.namePlaceholder': 'Your Name',
    'contact.emailAddress': 'Email Address',
    'contact.phone': 'Phone Number',
    'contact.phonePlaceholder': '(555) 123-4567',
    'contact.interestedIn': "I'm Interested In:",
    'contact.buying': 'Buying a Property',
    'contact.selling': 'Selling a Property',
    'contact.investment': 'Investment Opportunities',
    'contact.analysis': 'AI Market Analysis',
    'contact.goals': 'Tell Us About Your Goals',
    'contact.goalsPlaceholder': "Describe what you're looking for...",
    'contact.getStarted': 'Get Started with AI Real Estate',

    // Chatbot
    'chatbot.title': '🤖 Assiduous AI Assistant',
    'chatbot.placeholder': 'Ask me anything about real estate...',
    'chatbot.welcome': "Hi! I'm your AI real estate assistant. How can I help you today?",

    // Common Terms
    'common.loading': 'AI is analyzing properties...',
    'common.analyzing': 'AI Analyzing...',
    'common.generating': 'Generating AI Report...',
    'common.alertsActivated': 'Alerts Activated!',
    'common.messageSent': 'Message Sent!',

    // Footer
    'footer.copyright':
      '© 2025 Assiduous Real Estate AI System. Professional implementation by elite developers.',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.properties': 'Propiedades',
    'nav.buyers': 'Para Compradores',
    'nav.sellers': 'Para Vendedores',
    'nav.aitools': 'Herramientas IA',
    'nav.contact': 'Contacto',

    // Hero Section
    'hero.title': 'Assiduous Bienes Raíces con IA',
    'hero.subtitle':
      'Descubre tu propiedad perfecta con nuestro sistema avanzado de emparejamiento con IA. Obtén análisis instantáneos del mercado, alertas automáticas de propiedades y recomendaciones personalizadas.',
    'hero.findProperties': 'Buscar Propiedades',
    'hero.getAnalysis': 'Obtener Análisis del Mercado',

    // Features Section
    'features.title': 'Características Inteligentes de Assiduous',
    'features.aiMatching.title': 'Emparejamiento IA de Propiedades',
    'features.aiMatching.desc':
      'Nuestro algoritmo inteligente aprende tus preferencias y sugiere automáticamente propiedades que coinciden con tus criterios.',
    'features.marketAnalysis.title': 'Análisis Instantáneo del Mercado',
    'features.marketAnalysis.desc':
      'Obtén valuaciones inmobiliarias en tiempo real, tendencias del mercado y análisis de potencial de inversión impulsado por IA.',
    'features.smartAlerts.title': 'Alertas Inteligentes',
    'features.smartAlerts.desc':
      'Nunca pierdas una oportunidad con nuestro sistema de alertas impulsado por IA que monitorea el mercado 24/7 para tu emparejamiento perfecto.',
    'features.aiAssistant.title': 'Asistente IA 24/7',
    'features.aiAssistant.desc':
      'Obtén respuestas instantáneas a tus preguntas inmobiliarias con nuestro chatbot inteligente disponible las 24 horas.',
    'features.mobile.title': 'Experiencia Móvil',
    'features.mobile.desc':
      'Accede a todas las funciones sobre la marcha con nuestro diseño responsivo e interfaz optimizada para móviles.',
    'features.leadGen.title': 'Generación de Leads',
    'features.leadGen.desc':
      'Sistema automatizado de captura y nutrición de leads que convierte visitantes en clientes de manera eficiente.',

    // Properties Section
    'properties.title': 'Propiedades Curadas por IA',
    'properties.location': 'Ubicación',
    'properties.locationPlaceholder': 'Ingresa ciudad o código postal',
    'properties.priceRange': 'Rango de Precio',
    'properties.propertyType': 'Tipo de Propiedad',
    'properties.singleFamily': 'Casa Unifamiliar',
    'properties.condo': 'Condominio',
    'properties.multiFamily': 'Multifamiliar',
    'properties.commercial': 'Comercial',
    'properties.searchBtn': 'Buscar con IA',
    'properties.found': 'Encontradas',
    'properties.propertiesText': 'Propiedades',
    'properties.rankedBy': 'Clasificadas por puntuación de compatibilidad IA',
    'properties.beds': 'dormitorios',
    'properties.baths': 'baños',
    'properties.sqft': 'pies²',
    'properties.aiMatch': 'Compatibilidad IA',

    // Buyers Section
    'buyers.title': 'Servicios para Compradores con IA',
    'buyers.recommendations': 'Recomendaciones Inteligentes de Propiedades',
    'buyers.analyzed': 'Propiedades Analizadas Hoy',
    'buyers.matchScore': 'Puntuación de Compatibilidad IA',
    'buyers.daysToClose': 'Promedio de Días para Cerrar',
    'buyers.days': 'días',
    'buyers.alertsTitle': 'Configurar Alertas IA de Propiedades',
    'buyers.email': 'Dirección de Email',
    'buyers.emailPlaceholder': 'tu@email.com',
    'buyers.budget': 'Presupuesto Máximo',
    'buyers.preferences': 'Preferencias de Aprendizaje IA',
    'buyers.preferencesPlaceholder': 'Moderno, buenas escuelas, vecindario caminable...',
    'buyers.activateAlerts': 'Activar Alertas IA',

    // Sellers Section
    'sellers.title': 'Herramientas Mejoradas para Vendedores',
    'sellers.valuationTitle': 'Valuación Instantánea IA de Propiedad',
    'sellers.address': 'Dirección de la Propiedad',
    'sellers.addressPlaceholder': '123 Calle Principal, Ciudad, Estado',
    'sellers.bedrooms': 'Dormitorios',
    'sellers.bathrooms': 'Baños',
    'sellers.squareFeet': 'Pies Cuadrados',
    'sellers.getValuation': 'Obtener Valuación IA',
    'sellers.valuationReport': 'Reporte de Valuación IA',
    'sellers.estimatedValue': 'Valor Estimado',
    'sellers.marketTrend': 'Tendencia del Mercado',
    'sellers.daysOnMarket': 'Días en Mercado (Est.)',

    // AI Tools Section
    'aitools.title': 'Análisis Avanzado con IA',
    'aitools.marketIntelligence': 'Panel de Inteligencia de Mercado',
    'aitools.activeListings': 'Listados Activos Monitoreados',
    'aitools.predictionAccuracy': 'Precisión de Predicciones de Precios',
    'aitools.opportunities': 'Oportunidades de Inversión Encontradas',
    'aitools.dealFlow': 'Análisis de Flujo de Negocios',
    'aitools.offMarketDeals': 'Negocios Fuera del Mercado Esta Semana',
    'aitools.roiPotential': 'Potencial Promedio de ROI',
    'aitools.flipOpportunities': 'Oportunidades de Remodelación',
    'aitools.customAnalysis': 'Solicitud de Análisis IA Personalizado',
    'aitools.analysisType': 'Tipo de Análisis',
    'aitools.marketTrends': 'Análisis de Tendencias del Mercado',
    'aitools.investmentScreening': 'Evaluación de Propiedades de Inversión',
    'aitools.comparableSales': 'Análisis de Ventas Comparables',
    'aitools.rentalYield': 'Predicción de Rendimiento de Alquiler',
    'aitools.targetArea': 'Área Objetivo',
    'aitools.targetPlaceholder': 'Ingresa vecindario o código postal',
    'aitools.generateReport': 'Generar Reporte IA',

    // Contact Section
    'contact.title': 'Comienza Hoy',
    'contact.fullName': 'Nombre Completo',
    'contact.namePlaceholder': 'Tu Nombre',
    'contact.emailAddress': 'Dirección de Email',
    'contact.phone': 'Número de Teléfono',
    'contact.phonePlaceholder': '(555) 123-4567',
    'contact.interestedIn': 'Estoy Interesado En:',
    'contact.buying': 'Comprar una Propiedad',
    'contact.selling': 'Vender una Propiedad',
    'contact.investment': 'Oportunidades de Inversión',
    'contact.analysis': 'Análisis IA del Mercado',
    'contact.goals': 'Cuéntanos Sobre Tus Objetivos',
    'contact.goalsPlaceholder': 'Describe lo que estás buscando...',
    'contact.getStarted': 'Comenzar con Bienes Raíces IA',

    // Chatbot
    'chatbot.title': '🤖 Asistente IA de Assiduous',
    'chatbot.placeholder': 'Pregúntame cualquier cosa sobre bienes raíces...',
    'chatbot.welcome': '¡Hola! Soy tu asistente de bienes raíces con IA. ¿Cómo puedo ayudarte hoy?',

    // Common Terms
    'common.loading': 'IA está analizando propiedades...',
    'common.analyzing': 'IA Analizando...',
    'common.generating': 'Generando Reporte IA...',
    'common.alertsActivated': '¡Alertas Activadas!',
    'common.messageSent': '¡Mensaje Enviado!',

    // Footer
    'footer.copyright':
      '© 2025 Sistema IA de Bienes Raíces Assiduous. Implementación profesional por desarrolladores élite.',
  },
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function () {
  initializeRealEstateSystem();
});

// Initialize Complete Real Estate System
function initializeRealEstateSystem() {
  setupNavigation();
  setupSectionManagement();
  setupPropertySearch();
  setupAIFeatures();
  setupChatbot();
  setupFormHandlers();
  setupAnimations();
  loadInitialData();
  console.log('🏠 Assiduous Real Estate AI System Initialized Successfully!');
}

// Smooth Scrolling for Navigation Links
function setupSmoothScrolling() {
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

// Setup Scroll Animations
function setupAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);

  // Observe sections for animation
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    observer.observe(section);
  });

  // Observe feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    observer.observe(card);
  });
}

// Setup Interactive Elements
function setupInteractiveElements() {
  const ctaButton = document.querySelector('.cta-button');

  if (ctaButton) {
    ctaButton.addEventListener('click', function () {
      // Add ripple effect
      addRippleEffect(this);

      // Scroll to services section
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = servicesSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  }

  // Feature card hover effects
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-8px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Responsive Navigation (Mobile Menu)
function setupResponsiveNavigation() {
  // Create mobile menu toggle button
  const nav = document.querySelector('nav .container');
  const navLinks = document.querySelector('.nav-links');

  // Create hamburger menu button
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `;

  // Add mobile menu styles
  const mobileMenuStyles = `
        <style>
            .mobile-menu-btn {
                display: none;
                background: none;
                border: none;
                flex-direction: column;
                cursor: pointer;
                padding: 5px;
            }
            
            .hamburger-line {
                width: 25px;
                height: 3px;
                background-color: #333;
                margin: 3px 0;
                transition: 0.3s;
            }
            
            .mobile-menu-active .hamburger-line:nth-child(1) {
                transform: rotate(-45deg) translate(-5px, 6px);
            }
            
            .mobile-menu-active .hamburger-line:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-active .hamburger-line:nth-child(3) {
                transform: rotate(45deg) translate(-5px, -6px);
            }
            
            @media (max-width: 768px) {
                .mobile-menu-btn {
                    display: flex;
                }
                
                .nav-links {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    background: white;
                    flex-direction: column;
                    padding: 1rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transform: translateY(-100%);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .nav-links.active {
                    display: flex;
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }
                
                .nav-links li {
                    margin: 0.5rem 0;
                }
            }
        </style>
    `;

  document.head.insertAdjacentHTML('beforeend', mobileMenuStyles);
  nav.appendChild(mobileMenuBtn);

  // Mobile menu toggle functionality
  mobileMenuBtn.addEventListener('click', function () {
    this.classList.toggle('mobile-menu-active');
    navLinks.classList.toggle('active');
  });

  // Close mobile menu when clicking on a link
  const mobileNavLinks = navLinks.querySelectorAll('a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', function () {
      mobileMenuBtn.classList.remove('mobile-menu-active');
      navLinks.classList.remove('active');
    });
  });
}

// Add Ripple Effect to Buttons
function addRippleEffect(element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
  ripple.style.top = event.clientY - rect.top - size / 2 + 'px';
  ripple.classList.add('ripple');

  // Add ripple styles if not already present
  if (!document.querySelector('#ripple-styles')) {
    const rippleStyles = `
            <style id="ripple-styles">
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple-animation 0.6s linear;
                    pointer-events: none;
                }
                
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            </style>
        `;
    document.head.insertAdjacentHTML('beforeend', rippleStyles);
  }

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Utility Functions
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction() {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Header scroll effect
window.addEventListener(
  'scroll',
  debounce(function () {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
      header.style.background = 'rgba(255, 255, 255, 0.95)';
      header.style.backdropFilter = 'blur(10px)';
    } else {
      header.style.background = '#fff';
      header.style.backdropFilter = 'none';
    }
  }, 10)
);

// ===== AI REAL ESTATE SYSTEM CORE FUNCTIONS =====

// Navigation System
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const sectionId = this.getAttribute('href').substring(1);
      showSection(sectionId);
      updateActiveNavigation(this);
    });
  });
}

// Section Management
function setupSectionManagement() {
  // Initially show home section and hide others
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.add('hidden'));

  const homeSection = document.getElementById('home');
  if (homeSection) homeSection.classList.remove('hidden');
}

// Show specific section
function showSection(sectionId) {
  // Hide all content sections
  const allSections = document.querySelectorAll(
    '.content-section, .hero-section, .features-section'
  );
  allSections.forEach(section => {
    if (section.id === 'home' || section.classList.contains('features-section')) {
      section.style.display = sectionId === 'home' ? 'block' : 'none';
    } else {
      section.classList.add('hidden');
    }
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    AppState.currentSection = sectionId;
  }

  // Update navigation
  updateActiveNavigation();

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update active navigation
function updateActiveNavigation(clickedLink = null) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.classList.remove('active'));

  if (clickedLink) {
    clickedLink.classList.add('active');
  } else {
    const activeLink = document.querySelector(`[href="#${AppState.currentSection}"]`);
    if (activeLink) activeLink.classList.add('active');
  }
}

// Property Search System
function setupPropertySearch() {
  loadSampleProperties();
}

// Sample property data
function loadSampleProperties() {
  AppState.propertyData = [
    {
      id: 1,
      price: '$425,000',
      address: '123 Maple Street, Austin, TX',
      beds: 3,
      baths: 2,
      sqft: 1850,
      type: 'Single Family',
      image: '🏠',
    },
    {
      id: 2,
      price: '$780,000',
      address: '456 Oak Avenue, Seattle, WA',
      beds: 4,
      baths: 3,
      sqft: 2400,
      type: 'Single Family',
      image: '🏡',
    },
    {
      id: 3,
      price: '$320,000',
      address: '789 Pine Plaza, Denver, CO',
      beds: 2,
      baths: 2,
      sqft: 1200,
      type: 'Condo',
      image: '🏢',
    },
    {
      id: 4,
      price: '$1,250,000',
      address: '321 Beach Blvd, Miami, FL',
      beds: 5,
      baths: 4,
      sqft: 3200,
      type: 'Single Family',
      image: '🏖️',
    },
    {
      id: 5,
      price: '$520,000',
      address: '654 Downtown Way, Portland, OR',
      beds: 2,
      baths: 1,
      sqft: 980,
      type: 'Condo',
      image: '🌆',
    },
    {
      id: 6,
      price: '$2,100,000',
      address: '987 Silicon Valley Dr, Palo Alto, CA',
      beds: 6,
      baths: 5,
      sqft: 4500,
      type: 'Single Family',
      image: '🏘️',
    },
  ];
}

// Property search function
function searchProperties() {
  const location = document.getElementById('location').value;
  const priceRange = document.getElementById('priceRange').value;
  const propertyType = document.getElementById('propertyType').value;

  // Show loading state
  const resultsContainer = document.getElementById('propertyResults');
  resultsContainer.innerHTML = '<div class="loading">🤖 AI is analyzing properties...</div>';

  // Simulate AI processing delay
  setTimeout(() => {
    const filteredProperties = filterProperties(location, priceRange, propertyType);
    displayProperties(filteredProperties);
  }, 1500);
}

// Filter properties based on search criteria
function filterProperties(location, priceRange, propertyType) {
  let filtered = [...AppState.propertyData];

  // Filter by property type
  if (propertyType !== 'All') {
    filtered = filtered.filter(prop => prop.type === propertyType);
  }

  // Filter by price range
  const priceRanges = {
    '$100K - $300K': [100000, 300000],
    '$300K - $500K': [300000, 500000],
    '$500K - $1M': [500000, 1000000],
    '$1M+': [1000000, Infinity],
  };

  if (priceRanges[priceRange]) {
    const [min, max] = priceRanges[priceRange];
    filtered = filtered.filter(prop => {
      const price = parseInt(prop.price.replace(/[^0-9]/g, ''));
      return price >= min && price <= max;
    });
  }

  // Simulate AI matching if location is provided
  if (location && location.trim()) {
    // Add AI match score to each property
    filtered = filtered
      .map(prop => ({
        ...prop,
        aiMatchScore: Math.floor(Math.random() * 20) + 80, // 80-99% match
      }))
      .sort((a, b) => b.aiMatchScore - a.aiMatchScore);
  }

  return filtered;
}

// Display properties in grid
function displayProperties(properties) {
  const resultsContainer = document.getElementById('propertyResults');

  if (properties.length === 0) {
    resultsContainer.innerHTML = `
            <div class="ai-analysis">
                <h3>🤖 AI Search Results</h3>
                <p>No properties match your current criteria. Try adjusting your search parameters or let our AI suggest alternatives.</p>
                <button class="cta-button primary" onclick="suggestAlternatives()">Get AI Suggestions</button>
            </div>
        `;
    return;
  }

  const propertiesHTML = properties
    .map(
      property => `
        <div class="property-card">
            <div class="property-image">
                ${property.image}
            </div>
            <div class="property-details">
                <div class="property-price">${property.price}</div>
                <div class="property-address">${property.address}</div>
                <div class="property-features">
                    <span>${property.beds} beds</span>
                    <span>${property.baths} baths</span>
                    <span>${property.sqft} sqft</span>
                </div>
                ${property.aiMatchScore ? `<div class="ai-match">🤖 ${property.aiMatchScore}% AI Match</div>` : ''}
            </div>
        </div>
    `
    )
    .join('');

  resultsContainer.innerHTML = `
        <div class="search-results-header">
            <h3>🏠 Found ${properties.length} Properties</h3>
            <p>Ranked by AI compatibility score</p>
        </div>
        ${propertiesHTML}
    `;
}

// AI Features Setup
function setupAIFeatures() {
  // Update market metrics periodically
  updateMarketMetrics();
  setInterval(updateMarketMetrics, 30000); // Update every 30 seconds
}

// Update market metrics with realistic fluctuations
function updateMarketMetrics() {
  const metrics = AppState.marketData;

  // Simulate real-time updates
  metrics.propertiesAnalyzed += Math.floor(Math.random() * 5);
  metrics.matchScore = (94 + Math.random() * 2).toFixed(1);
  metrics.avgDaysToClose = 18 + Math.floor(Math.random() * 3);

  // Update UI elements
  const metricElements = document.querySelectorAll('.metric-value');
  metricElements.forEach(element => {
    const label = element.previousElementSibling?.textContent;
    if (label?.includes('Properties Analyzed')) {
      element.textContent = metrics.propertiesAnalyzed.toLocaleString();
    } else if (label?.includes('AI Match Score')) {
      element.textContent = `${metrics.matchScore}%`;
    } else if (label?.includes('Days to Close')) {
      element.textContent = `${metrics.avgDaysToClose} days`;
    }
  });
}

// AI Valuation System
function getValuation() {
  const address = document.getElementById('sellerAddress').value;
  const bedrooms = document.getElementById('bedrooms').value;
  const bathrooms = document.getElementById('bathrooms').value;
  const sqft = document.getElementById('sqft').value;

  if (!address || !sqft) {
    alert('Please fill in the property address and square feet for accurate AI valuation.');
    return;
  }

  // Show loading state
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = '🤖 AI Analyzing...';
  button.disabled = true;

  // Simulate AI processing
  setTimeout(() => {
    const estimatedValue = calculatePropertyValue(bedrooms, bathrooms, parseInt(sqft));
    document.getElementById('estimatedValue').textContent = `$${estimatedValue.toLocaleString()}`;
    document.getElementById('valuationResult').classList.remove('hidden');

    button.textContent = originalText;
    button.disabled = false;

    // Scroll to results
    document.getElementById('valuationResult').scrollIntoView({ behavior: 'smooth' });
  }, 2000);
}

// AI-powered property valuation algorithm
function calculatePropertyValue(bedrooms, bathrooms, sqft) {
  // Base price per square foot (varies by market)
  const basePricePerSqft = 180 + Math.random() * 120; // $180-$300 per sqft

  // Bedroom/bathroom premium
  const bedroomValue = parseInt(bedrooms) * 15000;
  const bathroomValue = parseInt(bathrooms) * 12000;

  // Calculate base value
  let estimatedValue = sqft * basePricePerSqft + bedroomValue + bathroomValue;

  // Add market fluctuation
  const marketAdjustment = 0.9 + Math.random() * 0.2; // ±10% market variation
  estimatedValue *= marketAdjustment;

  return Math.round(estimatedValue);
}

// AI Alert System
function setupAlerts() {
  const email = document.getElementById('buyerEmail').value;
  const maxPrice = document.getElementById('maxPrice').value;
  const preferences = document.getElementById('preferences').value;

  if (!email || !maxPrice) {
    alert('Please provide your email and budget for AI alerts.');
    return;
  }

  // Show success message
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = '✅ Alerts Activated!';
  button.style.background = 'var(--success-gradient)';

  // Store user preferences
  AppState.userPreferences = { email, maxPrice, preferences };

  // Reset button after delay
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = '';
  }, 3000);

  // Show confirmation
  showNotification(
    "AI property alerts activated! You'll receive notifications for matching properties.",
    'success'
  );
}

// AI Analysis Request
function runAnalysis() {
  const analysisType = document.getElementById('analysisType').value;
  const location = document.getElementById('analysisLocation').value;

  if (!location) {
    alert('Please specify a target area for AI analysis.');
    return;
  }

  const button = event.target;
  const originalText = button.textContent;
  button.textContent = '🤖 Generating AI Report...';
  button.disabled = true;

  // Simulate AI processing
  setTimeout(() => {
    generateAIReport(analysisType, location);
    button.textContent = originalText;
    button.disabled = false;
  }, 3000);
}

// Generate AI analysis report
function generateAIReport(type, location) {
  const reports = {
    'Market Trend Analysis': {
      title: '📈 Market Trend Analysis Report',
      content: `AI analysis for ${location} shows strong market growth with 12% price appreciation over the past year. Inventory levels are at 2.3 months supply, indicating a balanced market.`,
    },
    'Investment Property Screening': {
      title: '💰 Investment Property Analysis',
      content: `AI has identified 23 potential investment properties in ${location} with projected ROI between 15-22%. Cap rates average 6.8% with strong rental demand.`,
    },
    'Comparable Sales Analysis': {
      title: '🏠 Comparable Sales Report',
      content: `Recent comparable sales in ${location} range from $340K to $650K. Median price per square foot is $285, up 8% from last quarter.`,
    },
    'Rental Yield Prediction': {
      title: '📊 Rental Yield Forecast',
      content: `AI predicts rental yields in ${location} will average 7.2% annually. Strong demand from young professionals and students drives rental market.`,
    },
  };

  const report = reports[type];
  showNotification(report.content, 'info', report.title);
}

// Chatbot System
function setupChatbot() {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        handleChatInput(e);
      }
    });
  }
}

// Toggle chatbot visibility
function toggleChatbot() {
  const chatbot = document.getElementById('chatbot');
  const chatFab = document.getElementById('chatFab');

  if (chatbot && chatFab) {
    AppState.chatbotOpen = !AppState.chatbotOpen;

    if (AppState.chatbotOpen) {
      chatbot.classList.remove('hidden');
      chatFab.style.display = 'none';
    } else {
      chatbot.classList.add('hidden');
      chatFab.style.display = 'flex';
    }
  }
}

// Handle chat input
function handleChatInput(event) {
  if (event.key === 'Enter') {
    const input = event.target;
    const message = input.value.trim();

    if (message) {
      addChatMessage(message, 'user');
      input.value = '';

      // Simulate AI response delay
      setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addChatMessage(aiResponse, 'bot');
      }, 1000);
    }
  }
}

// Add message to chat
function addChatMessage(message, sender) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-bubble ${sender}`;
  messageDiv.textContent = message;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate AI responses
function generateAIResponse(userMessage) {
  const responses = {
    hello: "Hi there! I'm your AI real estate assistant. How can I help you today?",
    properties: "I can help you find properties! What's your budget and preferred location?",
    price:
      'Property prices vary by location. I can provide a detailed market analysis for any area.',
    valuation:
      'I can provide instant AI-powered property valuations. Just give me the address and property details.',
    investment:
      'Looking for investment opportunities? I can analyze ROI potential and market trends.',
    market: 'The current market shows strong fundamentals with balanced inventory levels.',
    buy: 'Ready to buy? I can help match you with properties that fit your criteria perfectly.',
    sell: 'Thinking of selling? I can provide a comprehensive market analysis and pricing strategy.',
    default:
      "I understand you're asking about real estate. Could you be more specific? I can help with property search, valuations, market analysis, or investment advice.",
  };

  const message = userMessage.toLowerCase();

  for (const [key, response] of Object.entries(responses)) {
    if (key !== 'default' && message.includes(key)) {
      return response;
    }
  }

  return responses.default;
}

// Form Handlers
function setupFormHandlers() {
  // Contact form
  const contactButton = document.querySelector('[onclick="submitContact()"]');
  if (contactButton) {
    contactButton.onclick = submitContact;
  }
}

// Submit contact form
function submitContact() {
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const phone = document.getElementById('contactPhone').value;
  const interest = document.getElementById('contactInterest').value;
  const message = document.getElementById('contactMessage').value;

  if (!name || !email) {
    alert('Please provide your name and email address.');
    return;
  }

  // Show success message
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = '✅ Message Sent!';
  button.style.background = 'var(--success-gradient)';

  // Reset form
  setTimeout(() => {
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactMessage').value = '';

    button.textContent = originalText;
    button.style.background = '';
  }, 3000);

  showNotification(
    'Thank you for your interest! Our team will contact you within 24 hours.',
    'success'
  );
}

// Notification System
function showNotification(message, type = 'info', title = '') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        ${title ? `<strong>${title}</strong><br>` : ''}
        ${message}
    `;

  // Add notification styles if not present
  if (!document.querySelector('#notification-styles')) {
    const styles = `
            <style id="notification-styles">
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    padding: 15px 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    border-left: 4px solid #2a5298;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                .notification.success { border-left-color: #28a745; }
                .notification.error { border-left-color: #dc3545; }
                .notification.warning { border-left-color: #ffc107; }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Load initial data
function loadInitialData() {
  // Simulate loading market data and user preferences
  console.log('📊 Loading real estate market data...');
  console.log('🤖 AI systems online and ready!');

  // Update metrics on load
  setTimeout(updateMarketMetrics, 1000);
}

// ===== INTERNATIONALIZATION SYSTEM =====

// Language switching function
function switchLanguage(lang) {
  if (lang === AppState.currentLanguage) return;

  AppState.currentLanguage = lang;

  // Update language button states
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`lang-${lang}`).classList.add('active');

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Translate all content
  translatePage();

  // Update property type options
  updatePropertyTypeOptions();

  // Update chatbot content
  updateChatbotContent();

  // Show language change notification
  const langName = lang === 'en' ? 'English' : 'Español';
  showNotification(`Language changed to ${langName}`, 'success');

  console.log(`🌍 Language switched to: ${lang.toUpperCase()}`);
}

// Main translation function
function translatePage() {
  const lang = AppState.currentLanguage;
  const translations = i18nData[lang];

  // Translate all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });

  // Translate dynamic content
  translateDynamicContent();
}

// Translate dynamic content that doesn't have data-i18n
function translateDynamicContent() {
  const lang = AppState.currentLanguage;
  const t = i18nData[lang];

  // Hero section
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) heroTitle.textContent = t['hero.title'];

  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = t['hero.subtitle'];

  // Hero buttons
  const heroButtons = document.querySelectorAll('.hero-actions .cta-button');
  if (heroButtons[0]) heroButtons[0].textContent = t['hero.findProperties'];
  if (heroButtons[1]) heroButtons[1].textContent = t['hero.getAnalysis'];

  // Features section
  const featuresTitle = document.querySelector('.features-section .section-title');
  if (featuresTitle) featuresTitle.textContent = t['features.title'];

  // Feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards[0]) {
    featureCards[0].querySelector('h3').textContent = t['features.aiMatching.title'];
    featureCards[0].querySelector('p').textContent = t['features.aiMatching.desc'];
  }
  if (featureCards[1]) {
    featureCards[1].querySelector('h3').textContent = t['features.marketAnalysis.title'];
    featureCards[1].querySelector('p').textContent = t['features.marketAnalysis.desc'];
  }
  if (featureCards[2]) {
    featureCards[2].querySelector('h3').textContent = t['features.smartAlerts.title'];
    featureCards[2].querySelector('p').textContent = t['features.smartAlerts.desc'];
  }
  if (featureCards[3]) {
    featureCards[3].querySelector('h3').textContent = t['features.aiAssistant.title'];
    featureCards[3].querySelector('p').textContent = t['features.aiAssistant.desc'];
  }
  if (featureCards[4]) {
    featureCards[4].querySelector('h3').textContent = t['features.mobile.title'];
    featureCards[4].querySelector('p').textContent = t['features.mobile.desc'];
  }
  if (featureCards[5]) {
    featureCards[5].querySelector('h3').textContent = t['features.leadGen.title'];
    featureCards[5].querySelector('p').textContent = t['features.leadGen.desc'];
  }

  // Section titles
  const propertiesTitle = document.querySelector('#properties .section-title');
  if (propertiesTitle) propertiesTitle.textContent = t['properties.title'];

  const buyersTitle = document.querySelector('#buyers .section-title');
  if (buyersTitle) buyersTitle.textContent = t['buyers.title'];

  const sellersTitle = document.querySelector('#sellers .section-title');
  if (sellersTitle) sellersTitle.textContent = t['sellers.title'];

  const aitoolsTitle = document.querySelector('#ai-tools .section-title');
  if (aitoolsTitle) aitoolsTitle.textContent = t['aitools.title'];

  const contactTitle = document.querySelector('#contact .section-title');
  if (contactTitle) contactTitle.textContent = t['contact.title'];

  // Form labels and placeholders
  translateForms();

  // Footer
  const footer = document.querySelector('footer p');
  if (footer) footer.innerHTML = t['footer.copyright'];
}

// Translate forms
function translateForms() {
  const lang = AppState.currentLanguage;
  const t = i18nData[lang];

  // Properties form
  const locationLabel = document.querySelector('label[for="location"]');
  if (locationLabel) locationLabel.textContent = t['properties.location'];

  const locationInput = document.getElementById('location');
  if (locationInput) locationInput.placeholder = t['properties.locationPlaceholder'];

  const priceRangeLabel = document.querySelector('label[for="priceRange"]');
  if (priceRangeLabel) priceRangeLabel.textContent = t['properties.priceRange'];

  const propertyTypeLabel = document.querySelector('label[for="propertyType"]');
  if (propertyTypeLabel) propertyTypeLabel.textContent = t['properties.propertyType'];

  const searchBtn = document.querySelector('#properties .cta-button');
  if (searchBtn) searchBtn.textContent = t['properties.searchBtn'];

  // Buyers form
  const buyersEmailLabel = document.querySelector('label[for="buyerEmail"]');
  if (buyersEmailLabel) buyersEmailLabel.textContent = t['buyers.email'];

  const buyersEmailInput = document.getElementById('buyerEmail');
  if (buyersEmailInput) buyersEmailInput.placeholder = t['buyers.emailPlaceholder'];

  const budgetLabel = document.querySelector('label[for="maxPrice"]');
  if (budgetLabel) budgetLabel.textContent = t['buyers.budget'];

  const preferencesLabel = document.querySelector('label[for="preferences"]');
  if (preferencesLabel) preferencesLabel.textContent = t['buyers.preferences'];

  const preferencesInput = document.getElementById('preferences');
  if (preferencesInput) preferencesInput.placeholder = t['buyers.preferencesPlaceholder'];

  const alertsBtn = document.querySelector('#buyers .cta-button');
  if (alertsBtn) alertsBtn.textContent = t['buyers.activateAlerts'];

  // Sellers form
  const addressLabel = document.querySelector('label[for="sellerAddress"]');
  if (addressLabel) addressLabel.textContent = t['sellers.address'];

  const addressInput = document.getElementById('sellerAddress');
  if (addressInput) addressInput.placeholder = t['sellers.addressPlaceholder'];

  const bedroomsLabel = document.querySelector('label[for="bedrooms"]');
  if (bedroomsLabel) bedroomsLabel.textContent = t['sellers.bedrooms'];

  const bathroomsLabel = document.querySelector('label[for="bathrooms"]');
  if (bathroomsLabel) bathroomsLabel.textContent = t['sellers.bathrooms'];

  const sqftLabel = document.querySelector('label[for="sqft"]');
  if (sqftLabel) sqftLabel.textContent = t['sellers.squareFeet'];

  const valuationBtn = document.querySelector('#sellers .cta-button');
  if (valuationBtn) valuationBtn.textContent = t['sellers.getValuation'];

  // AI Tools form
  const analysisTypeLabel = document.querySelector('label[for="analysisType"]');
  if (analysisTypeLabel) analysisTypeLabel.textContent = t['aitools.analysisType'];

  const targetAreaLabel = document.querySelector('label[for="analysisLocation"]');
  if (targetAreaLabel) targetAreaLabel.textContent = t['aitools.targetArea'];

  const targetAreaInput = document.getElementById('analysisLocation');
  if (targetAreaInput) targetAreaInput.placeholder = t['aitools.targetPlaceholder'];

  const reportBtn = document.querySelector('#ai-tools .cta-button');
  if (reportBtn) reportBtn.textContent = t['aitools.generateReport'];

  // Contact form
  const nameLabel = document.querySelector('label[for="contactName"]');
  if (nameLabel) nameLabel.textContent = t['contact.fullName'];

  const nameInput = document.getElementById('contactName');
  if (nameInput) nameInput.placeholder = t['contact.namePlaceholder'];

  const emailLabel = document.querySelector('label[for="contactEmail"]');
  if (emailLabel) emailLabel.textContent = t['contact.emailAddress'];

  const phoneLabel = document.querySelector('label[for="contactPhone"]');
  if (phoneLabel) phoneLabel.textContent = t['contact.phone'];

  const phoneInput = document.getElementById('contactPhone');
  if (phoneInput) phoneInput.placeholder = t['contact.phonePlaceholder'];

  const interestLabel = document.querySelector('label[for="contactInterest"]');
  if (interestLabel) interestLabel.textContent = t['contact.interestedIn'];

  const goalsLabel = document.querySelector('label[for="contactMessage"]');
  if (goalsLabel) goalsLabel.textContent = t['contact.goals'];

  const goalsInput = document.getElementById('contactMessage');
  if (goalsInput) goalsInput.placeholder = t['contact.goalsPlaceholder'];

  const contactBtn = document.querySelector('#contact .cta-button');
  if (contactBtn) contactBtn.textContent = t['contact.getStarted'];
}

// Update property type options
function updatePropertyTypeOptions() {
  const lang = AppState.currentLanguage;
  const t = i18nData[lang];

  const propertyTypeSelect = document.getElementById('propertyType');
  if (propertyTypeSelect) {
    const options = propertyTypeSelect.querySelectorAll('option');
    if (options[0]) options[0].textContent = t['properties.singleFamily'];
    if (options[1]) options[1].textContent = t['properties.condo'];
    if (options[2]) options[2].textContent = t['properties.multiFamily'];
    if (options[3]) options[3].textContent = t['properties.commercial'];
  }

  const analysisTypeSelect = document.getElementById('analysisType');
  if (analysisTypeSelect) {
    const options = analysisTypeSelect.querySelectorAll('option');
    if (options[0]) options[0].textContent = t['aitools.marketTrends'];
    if (options[1]) options[1].textContent = t['aitools.investmentScreening'];
    if (options[2]) options[2].textContent = t['aitools.comparableSales'];
    if (options[3]) options[3].textContent = t['aitools.rentalYield'];
  }

  const contactInterestSelect = document.getElementById('contactInterest');
  if (contactInterestSelect) {
    const options = contactInterestSelect.querySelectorAll('option');
    if (options[0]) options[0].textContent = t['contact.buying'];
    if (options[1]) options[1].textContent = t['contact.selling'];
    if (options[2]) options[2].textContent = t['contact.investment'];
    if (options[3]) options[3].textContent = t['contact.analysis'];
  }
}

// Update chatbot content
function updateChatbotContent() {
  const lang = AppState.currentLanguage;
  const t = i18nData[lang];

  const chatbotHeader = document.querySelector('.chatbot-header strong');
  if (chatbotHeader) chatbotHeader.textContent = t['chatbot.title'];

  const chatInput = document.getElementById('chatInput');
  if (chatInput) chatInput.placeholder = t['chatbot.placeholder'];

  // Update welcome message
  const welcomeMessage = document.querySelector('.chat-bubble.bot');
  if (welcomeMessage) welcomeMessage.textContent = t['chatbot.welcome'];
}

// Enhanced AI responses with language support
function generateAIResponse(userMessage) {
  const lang = AppState.currentLanguage;

  const responses = {
    en: {
      hello: "Hi there! I'm your AI real estate assistant. How can I help you today?",
      properties: "I can help you find properties! What's your budget and preferred location?",
      price:
        'Property prices vary by location. I can provide a detailed market analysis for any area.',
      valuation:
        'I can provide instant AI-powered property valuations. Just give me the address and property details.',
      investment:
        'Looking for investment opportunities? I can analyze ROI potential and market trends.',
      market: 'The current market shows strong fundamentals with balanced inventory levels.',
      buy: 'Ready to buy? I can help match you with properties that fit your criteria perfectly.',
      sell: 'Thinking of selling? I can provide a comprehensive market analysis and pricing strategy.',
      default:
        "I understand you're asking about real estate. Could you be more specific? I can help with property search, valuations, market analysis, or investment advice.",
    },
    es: {
      hello: '¡Hola! Soy tu asistente de bienes raíces con IA. ¿Cómo puedo ayudarte hoy?',
      propiedades:
        '¡Puedo ayudarte a encontrar propiedades! ¿Cuál es tu presupuesto y ubicación preferida?',
      precio:
        'Los precios de propiedades varían según la ubicación. Puedo proporcionar un análisis detallado del mercado para cualquier área.',
      valuacion:
        'Puedo proporcionar valuaciones instantáneas de propiedades con IA. Solo dame la dirección y detalles de la propiedad.',
      inversion:
        '¿Buscas oportunidades de inversión? Puedo analizar el potencial de ROI y tendencias del mercado.',
      mercado:
        'El mercado actual muestra fundamentos sólidos con niveles de inventario equilibrados.',
      comprar:
        '¿Listo para comprar? Puedo ayudarte a emparejar con propiedades que se ajusten perfectamente a tus criterios.',
      vender:
        '¿Pensando en vender? Puedo proporcionar un análisis completo del mercado y estrategia de precios.',
      default:
        'Entiendo que estás preguntando sobre bienes raíces. ¿Podrías ser más específico? Puedo ayudar con búsqueda de propiedades, valuaciones, análisis de mercado o asesoramiento de inversión.',
    },
  };

  const message = userMessage.toLowerCase();
  const langResponses = responses[lang];

  for (const [key, response] of Object.entries(langResponses)) {
    if (key !== 'default' && message.includes(key)) {
      return response;
    }
  }

  return langResponses.default;
}

// Override property display for localization
function displayProperties(properties) {
  const lang = AppState.currentLanguage;
  const t = i18nData[lang];
  const resultsContainer = document.getElementById('propertyResults');

  if (properties.length === 0) {
    resultsContainer.innerHTML = `
            <div class="ai-analysis">
                <h3>🤖 ${t['properties.title']}</h3>
                <p>No properties match your current criteria. Try adjusting your search parameters or let our AI suggest alternatives.</p>
                <button class="cta-button primary" onclick="suggestAlternatives()">Get AI Suggestions</button>
            </div>
        `;
    return;
  }

  const propertiesHTML = properties
    .map(
      property => `
        <div class="property-card">
            <div class="property-image">
                ${property.image}
            </div>
            <div class="property-details">
                <div class="property-price">${property.price}</div>
                <div class="property-address">${property.address}</div>
                <div class="property-features">
                    <span>${property.beds} ${t['properties.beds']}</span>
                    <span>${property.baths} ${t['properties.baths']}</span>
                    <span>${property.sqft} ${t['properties.sqft']}</span>
                </div>
                ${property.aiMatchScore ? `<div class="ai-match">🤖 ${property.aiMatchScore}% ${t['properties.aiMatch']}</div>` : ''}
            </div>
        </div>
    `
    )
    .join('');

  resultsContainer.innerHTML = `
        <div class="search-results-header">
            <h3>🏠 ${t['properties.found']} ${properties.length} ${t['properties.propertiesText']}</h3>
            <p>${t['properties.rankedBy']}</p>
        </div>
        ${propertiesHTML}
    `;
}

// Console welcome message
console.log(
  `
%c🏠 Assiduous AI Real Estate System v1.0.0
%cProfessional bilingual implementation with enterprise-grade features
%c🌍 Multi-language support: English & Spanish | All AI systems operational
`,
  'color: #2a5298; font-size: 18px; font-weight: bold;',
  'color: #28a745; font-size: 14px;',
  'color: #666; font-size: 12px;'
);
