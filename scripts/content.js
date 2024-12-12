// Theme Manager
class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.enabled = false;
    this.init();
  }

  async init() {
    try {
      // Check current state
      const { enabled, activeTheme, themes = [] } = await chrome.storage.sync.get(['enabled', 'activeTheme', 'themes']);
      this.enabled = enabled ?? false;
      
      if (this.enabled && activeTheme) {
        const theme = themes.find(t => t.id === activeTheme);
        if (theme) {
          this.applyTheme(theme);
        }
      }

      this.setupMessageListener();
    } catch (error) {
      console.error('Error initializing theme:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleTheme') {
        this.enabled = request.enabled;
        
        if (this.enabled && request.theme) {
          this.applyTheme(request.theme);
        } else {
          this.removeTheme();
        }
        
        sendResponse({ success: true });
      }
    });
  }

  applyTheme(theme) {
    if (!theme) return;
    
    this.removeTheme();
    this.currentTheme = theme;
    
    // Apply theme attributes
    document.documentElement.setAttribute('data-theme', theme.id);
    document.body.setAttribute('data-theme', theme.id);
    
    // Create and apply dramatic theme styles
    const style = document.createElement('style');
    style.id = 'cutify-custom-styles';
    style.textContent = `
      /* Root variables */
      :root[data-theme="${theme.id}"] {
        --cutify-primary: ${theme.colors.primary};
        --cutify-secondary: ${theme.colors.secondary};
        --cutify-accent: ${theme.colors.accent};
        --cutify-text: ${theme.colors.text};
        --cutify-background: ${theme.colors.background};
        --cutify-radius: 8px;
        --cutify-glow: ${this.getThemeGlow(theme)};
      }

      /* Links and interactive elements */
      a, 
      button,
      .btn,
      [role="button"],
      input[type="submit"],
      input[type="button"] {
        position: relative !important;
        transition: all 0.3s ease !important;
        text-decoration: none !important;
      }

      /* Theme-specific link and button styles */
      ${this.getThemeInteractiveStyles(theme)}

      /* Selection styling */
      ::selection {
        background-color: var(--cutify-accent) !important;
        color: #fff !important;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 10px !important;
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05) !important;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--cutify-accent) !important;
        opacity: 0.3 !important;
        border-radius: var(--cutify-radius) !important;
      }

      ::-webkit-scrollbar-thumb:hover {
        opacity: 0.5 !important;
      }

      /* Form elements */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="search"],
      textarea,
      select {
        border: 1px solid var(--cutify-accent) !important;
        border-radius: var(--cutify-radius) !important;
        transition: all 0.3s ease !important;
      }

      input[type="text"]:focus,
      input[type="email"]:focus,
      input[type="password"]:focus,
      input[type="search"]:focus,
      textarea:focus,
      select:focus {
        outline: none !important;
        box-shadow: var(--cutify-glow) !important;
      }

      /* Checkboxes and radio buttons */
      input[type="checkbox"],
      input[type="radio"] {
        accent-color: var(--cutify-accent) !important;
      }

      /* Theme-specific backgrounds */
      ${this.getThemeBackground(theme)}

      /* Body and background patterns based on theme */
      body {
        position: relative !important;
        color: inherit !important;
      }

      /* Add a subtle overlay for better text readability */
      body::after {
        content: '' !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        pointer-events: none !important;
        z-index: -1 !important;
      }

      /* Ensure content appears above the overlay */
      body > * {
        position: relative !important;
        z-index: 2 !important;
      }

      /* Text styling - more subtle approach */
      h1, h2, h3, h4, h5, h6 {
        color: inherit !important;
      }

      p, span, div {
        color: inherit !important;
      }

      /* Links - keep original colors but add subtle effects */
      a {
        transition: all 0.2s ease !important;
      }

      a:hover {
        text-decoration: underline !important;
      }

      /* Images */
      img {
        border-radius: var(--cutify-radius) !important;
        border: 2px solid var(--cutify-accent) !important;
        transition: all 0.3s ease !important;
      }

      img:hover {
        transform: scale(1.02) !important;
      }
    `;

    document.head.appendChild(style);
  }

  getThemeGlow(theme) {
    const glows = {
      'starry-night': '0 0 10px rgba(255, 255, 255, 0.2)',
      'forest': '0 0 10px rgba(34, 139, 34, 0.2)',
      'ocean': '0 0 10px rgba(25, 25, 112, 0.2)',
      'sunset': '0 0 10px rgba(255, 107, 107, 0.2)',
      'cyberpunk': '0 0 10px rgba(255, 0, 255, 0.2), 0 0 20px rgba(0, 255, 255, 0.1)'
    };
    return glows[theme.id] || glows['starry-night'];
  }

  getThemeInteractiveStyles(theme) {
    const styles = {
      'starry-night': `
        a, button, .btn, [role="button"], input[type="submit"], input[type="button"] {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        a:hover, button:hover, .btn:hover, [role="button"]:hover, 
        input[type="submit"]:hover, input[type="button"]:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        a::after {
          content: '' !important;
          position: absolute !important;
          bottom: -2px !important;
          left: 0 !important;
          width: 100% !important;
          height: 1px !important;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent) !important;
          transform: scaleX(0) !important;
          transition: transform 0.3s ease !important;
        }

        a:hover::after {
          transform: scaleX(1) !important;
        }
      `,
      'forest': `
        a, button, .btn, [role="button"], input[type="submit"], input[type="button"] {
          color: #2e8b57 !important;
          background: rgba(34, 139, 34, 0.1) !important;
          border: 1px solid rgba(34, 139, 34, 0.2) !important;
        }

        a:hover, button:hover, .btn:hover, [role="button"]:hover,
        input[type="submit"]:hover, input[type="button"]:hover {
          background: rgba(34, 139, 34, 0.15) !important;
          box-shadow: 0 0 15px rgba(34, 139, 34, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        a::after {
          content: '' !important;
          position: absolute !important;
          bottom: -2px !important;
          left: 0 !important;
          width: 100% !important;
          height: 1px !important;
          background: linear-gradient(90deg, transparent, rgba(34, 139, 34, 0.5), transparent) !important;
          transform: scaleX(0) !important;
          transition: transform 0.3s ease !important;
        }

        a:hover::after {
          transform: scaleX(1) !important;
        }
      `,
      'ocean': `
        a, button, .btn, [role="button"], input[type="submit"], input[type="button"] {
          color: #1e90ff !important;
          background: rgba(25, 25, 112, 0.1) !important;
          border: 1px solid rgba(25, 25, 112, 0.2) !important;
        }

        a:hover, button:hover, .btn:hover, [role="button"]:hover,
        input[type="submit"]:hover, input[type="button"]:hover {
          background: rgba(25, 25, 112, 0.15) !important;
          box-shadow: 0 0 15px rgba(25, 25, 112, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        a::after {
          content: '' !important;
          position: absolute !important;
          bottom: -2px !important;
          left: 0 !important;
          width: 100% !important;
          height: 1px !important;
          background: linear-gradient(90deg, transparent, rgba(25, 25, 112, 0.5), transparent) !important;
          transform: scaleX(0) !important;
          transition: transform 0.3s ease !important;
        }

        a:hover::after {
          transform: scaleX(1) !important;
        }
      `,
      'sunset': `
        a, button, .btn, [role="button"], input[type="submit"], input[type="button"] {
          color: #ff6b6b !important;
          background: rgba(255, 107, 107, 0.1) !important;
          border: 1px solid rgba(255, 107, 107, 0.2) !important;
        }

        a:hover, button:hover, .btn:hover, [role="button"]:hover,
        input[type="submit"]:hover, input[type="button"]:hover {
          background: rgba(255, 107, 107, 0.15) !important;
          box-shadow: 0 0 15px rgba(255, 107, 107, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        a::after {
          content: '' !important;
          position: absolute !important;
          bottom: -2px !important;
          left: 0 !important;
          width: 100% !important;
          height: 1px !important;
          background: linear-gradient(90deg, transparent, rgba(255, 107, 107, 0.5), transparent) !important;
          transform: scaleX(0) !important;
          transition: transform 0.3s ease !important;
        }

        a:hover::after {
          transform: scaleX(1) !important;
        }
      `,
      'cyberpunk': `
        a, button, .btn, [role="button"], input[type="submit"], input[type="button"] {
          color: #ff00ff !important;
          background: rgba(43, 33, 58, 0.1) !important;
          border: 1px solid rgba(255, 0, 255, 0.2) !important;
        }

        a:hover, button:hover, .btn:hover, [role="button"]:hover,
        input[type="submit"]:hover, input[type="button"]:hover {
          background: rgba(43, 33, 58, 0.15) !important;
          box-shadow: 
            0 0 10px rgba(255, 0, 255, 0.2),
            0 0 20px rgba(0, 255, 255, 0.1) !important;
          transform: translateY(-1px) !important;
        }

        a::after {
          content: '' !important;
          position: absolute !important;
          bottom: -2px !important;
          left: 0 !important;
          width: 100% !important;
          height: 1px !important;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 0, 255, 0.5), 
            rgba(0, 255, 255, 0.5),
            transparent
          ) !important;
          transform: scaleX(0) !important;
          transition: transform 0.3s ease !important;
        }

        a:hover::after {
          transform: scaleX(1) !important;
        }
      `
    };
    return styles[theme.id] || styles['starry-night'];
  }

  getThemeBackground(theme) {
    const animations = `
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.5; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes wave {
        0% { background-position: 0 0; }
        100% { background-position: 20px 20px; }
      }
      @keyframes aurora {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes cyber {
        0% { background-position: 0 0; }
        100% { background-position: 40px 40px; }
      }
    `;

    const backgrounds = {
      'starry-night': `
        ${animations}
        body::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(10, 15, 37, 0.03) !important;
          background-image: 
            radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.3), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.3), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.3), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.3), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.3), rgba(0,0,0,0)) !important;
          background-repeat: repeat !important;
          background-size: 200px 200px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.4 !important;
          animation: twinkle 3s infinite ease-in-out !important;
        }

        /* Add floating particles */
        body::after {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: 
            radial-gradient(2px 2px at 10% 10%, rgba(255,255,255,0.2), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 30% 20%, rgba(255,255,255,0.2), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50% 50%, rgba(255,255,255,0.2), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 70% 70%, rgba(255,255,255,0.2), rgba(0,0,0,0)) !important;
          background-repeat: repeat !important;
          background-size: 200px 200px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.2 !important;
          animation: float 5s infinite ease-in-out !important;
        }
      `,
      'forest': `
        ${animations}
        body::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(34, 139, 34, 0.02) !important;
          background-image: 
            linear-gradient(45deg, rgba(34, 139, 34, 0.05) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(34, 139, 34, 0.05) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(34, 139, 34, 0.05) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(34, 139, 34, 0.05) 75%) !important;
          background-size: 40px 40px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.3 !important;
          animation: float 8s infinite ease-in-out !important;
        }

        /* Add floating leaves effect */
        body::after {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: 
            radial-gradient(3px 3px at 20% 30%, rgba(34, 139, 34, 0.1), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40% 70%, rgba(34, 139, 34, 0.1), rgba(0,0,0,0)),
            radial-gradient(4px 4px at 60% 20%, rgba(34, 139, 34, 0.1), rgba(0,0,0,0)) !important;
          background-repeat: repeat !important;
          background-size: 300px 300px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.2 !important;
          animation: float 10s infinite ease-in-out !important;
        }
      `,
      'ocean': `
        ${animations}
        body::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(25, 25, 112, 0.02) !important;
          background-image: 
            linear-gradient(to right, rgba(25, 25, 112, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(25, 25, 112, 0.05) 1px, transparent 1px) !important;
          background-size: 20px 20px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.3 !important;
          animation: wave 15s infinite linear !important;
        }

        /* Add wave ripple effect */
        body::after {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: 
            radial-gradient(circle at 30% 50%, rgba(25, 25, 112, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 70% 50%, rgba(25, 25, 112, 0.05) 0%, transparent 50%) !important;
          background-size: 100px 100px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.2 !important;
          animation: wave 20s infinite linear reverse !important;
        }
      `,
      'sunset': `
        ${animations}
        body::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: linear-gradient(45deg, 
            rgba(255,107,107,0.05),
            rgba(255,179,107,0.05),
            rgba(255,223,107,0.05),
            rgba(107,255,255,0.05)
          ) !important;
          background-size: 400% 400% !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.3 !important;
          animation: aurora 15s infinite ease-in-out !important;
        }

        /* Add sun rays effect */
        body::after {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: radial-gradient(
            circle at 50% 120%,
            rgba(255,107,107,0.05) 0%,
            transparent 60%
          ) !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.2 !important;
          animation: float 10s infinite ease-in-out !important;
        }
      `,
      'cyberpunk': `
        ${animations}
        body::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(43, 33, 58, 0.02) !important;
          background-image: 
            linear-gradient(90deg, rgba(255, 0, 255, 0.03) 1px, transparent 1px),
            linear-gradient(0deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px) !important;
          background-size: 40px 40px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.3 !important;
          animation: cyber 10s infinite linear !important;
        }

        /* Add neon glow effect */
        body::after {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: 
            linear-gradient(45deg, rgba(255, 0, 255, 0.03) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(0, 255, 255, 0.03) 25%, transparent 25%) !important;
          background-size: 60px 60px !important;
          pointer-events: none !important;
          z-index: -1 !important;
          opacity: 0.2 !important;
          animation: cyber 15s infinite linear reverse !important;
        }
      `
    };

    return backgrounds[theme.id] || backgrounds['starry-night'];
  }

  removeTheme() {
    // Remove theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
    
    // Remove custom styles
    const style = document.getElementById('cutify-custom-styles');
    if (style) style.remove();
    
    // Reset body background
    document.body.style.background = '';
    document.body.style.color = '';
    
    this.currentTheme = null;
  }

  // Helper function to lighten or darken a color
  adjustColor(color, amount) {
    const clamp = (num) => Math.min(255, Math.max(0, num));
    
    // Convert hex to RGB
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Adjust the color
    r = clamp(r + amount);
    g = clamp(g + amount);
    b = clamp(b + amount);
    
    // Convert back to hex
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

// Create loading overlay
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = `
  <div class="loading-spinner"></div>
  <div class="loading-text">
    Applying your cute theme<span class="loading-dots"></span>
  </div>
`;
document.body.appendChild(loadingOverlay);

// Function to show/hide loading screen
function toggleLoading(show, theme = null) {
  if (theme) {
    loadingOverlay.style.backgroundColor = theme.backgroundColor || '#fff0f5';
    loadingOverlay.style.color = theme.textColor || '#6e5a6e';
    loadingOverlay.style.fontFamily = theme.fontFamily || 'Quicksand';
    
    const spinner = loadingOverlay.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.setProperty('--spinner-color', theme.primaryColor || '#ffa6d2');
      spinner.style.borderColor = `${theme.primaryColor || '#ffa6d2'}40`;
      spinner.style.borderTopColor = theme.primaryColor || '#ffa6d2';
    }
  }
  
  loadingOverlay.classList.toggle('visible', show);
}

// Initialize theme application
async function initTheme() {
  try {
    // Show loading screen
    toggleLoading(true);
    
    // Get active theme from storage
    const { activeTheme, themes = [] } = await chrome.storage.sync.get(['activeTheme', 'themes']);
    if (activeTheme) {
      const theme = themes.find(t => t.id === activeTheme);
      if (theme) {
        // Update loading screen with theme colors
        toggleLoading(true, theme);
        // Apply the theme
        await applyTheme(theme);
      }
    }
  } catch (error) {
    console.error('Error initializing theme:', error);
  } finally {
    // Hide loading after a minimum duration to prevent flash
    setTimeout(() => toggleLoading(false), 500);
  }
}

// Listen for theme updates
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'updateTheme') {
    try {
      toggleLoading(true, message.theme);
      await applyTheme(message.theme);
      setTimeout(() => toggleLoading(false), 500);
    } catch (error) {
      console.error('Error applying theme:', error);
      toggleLoading(false);
    }
  }
  // Always send a response
  sendResponse({ success: true });
  return true; // Required for async response
});

// Apply theme to the page
async function applyTheme(theme) {
  if (!theme) return;

  // Create or update CSS variables
  const root = document.documentElement;
  
  // Add transition properties
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    if (!el.hasAttribute('data-cutify-styled')) {
      el.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
      el.setAttribute('data-cutify-styled', 'true');
    }
  });

  // Function to get computed style before applying theme
  const getOriginalStyles = (element) => {
    const computed = window.getComputedStyle(element);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor
    };
  };

  // Store original styles if not already stored
  if (!document.body.hasAttribute('data-original-styles')) {
    const originalStyles = new Map();
    elements.forEach(el => {
      originalStyles.set(el, getOriginalStyles(el));
    });
    window.__cutifyOriginalStyles = originalStyles;
    document.body.setAttribute('data-original-styles', 'true');
  }

  // Helper function to determine if a color is light
  const isLight = (color) => {
    const rgb = parseColor(color);
    if (!rgb) return true;
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  };

  // Helper function to adjust color based on original and theme colors
  const adjustColor = (originalColor, themeColor) => {
    const orig = parseColor(originalColor);
    const theme = parseColor(themeColor);
    if (!orig || !theme) return themeColor;

    // Preserve relative lightness of original color
    const origBrightness = (orig.r * 299 + orig.g * 587 + orig.b * 114) / 1000;
    const themeBrightness = (theme.r * 299 + theme.g * 587 + theme.b * 114) / 1000;
    const ratio = origBrightness / themeBrightness;

    return `rgb(${
      Math.min(255, Math.max(0, Math.round(theme.r * ratio)))
    }, ${
      Math.min(255, Math.max(0, Math.round(theme.g * ratio)))
    }, ${
      Math.min(255, Math.max(0, Math.round(theme.b * ratio)))
    })`;
  };

  // Apply theme colors while preserving relative contrasts
  elements.forEach(el => {
    const originalStyles = window.__cutifyOriginalStyles.get(el);
    if (!originalStyles) return;

    // Only modify colors if they were visible in the original
    if (originalStyles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const adjustedBg = adjustColor(originalStyles.backgroundColor, theme.backgroundColor);
      el.style.backgroundColor = adjustedBg;
    }
    
    if (originalStyles.color !== 'rgba(0, 0, 0, 0)') {
      const adjustedColor = adjustColor(originalStyles.color, theme.textColor);
      el.style.color = adjustedColor;
    }

    if (originalStyles.borderColor !== 'rgba(0, 0, 0, 0)') {
      const adjustedBorder = adjustColor(originalStyles.borderColor, theme.primaryColor);
      el.style.borderColor = adjustedBorder;
    }
  });

  // Set theme colors as CSS variables for new elements
  root.style.setProperty('--primary-color', theme.primaryColor);
  root.style.setProperty('--secondary-color', theme.secondaryColor);
  root.style.setProperty('--accent-color', theme.accentColor);
  root.style.setProperty('--text-color', theme.textColor);
  root.style.setProperty('--background-color', theme.backgroundColor);
}

// Helper function to parse color strings into RGB values
function parseColor(color) {
  if (!color) return null;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }
  
  // Handle rgb/rgba colors
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  
  return null;
}

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', initTheme);

// Also check theme when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    initTheme();
  }
});

// Initialize Theme Manager
const themeManager = new ThemeManager();

// Listen for page visibility changes to reapply theme if needed
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    const { enabled, activeTheme, themes = [] } = await chrome.storage.sync.get(['enabled', 'activeTheme', 'themes']);
    if (enabled && activeTheme) {
      const theme = themes.find(t => t.id === activeTheme);
      if (theme) {
        themeManager.applyTheme(theme);
      }
    }
  }
});
