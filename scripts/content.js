// Theme Manager
class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.enabled = false;
    this.init();
  }

  async init() {
    const result = await chrome.storage.sync.get(['enabled', 'currentTheme']);
    this.enabled = result.enabled ?? false;
    this.currentTheme = result.currentTheme;

    if (this.enabled && this.currentTheme) {
      this.applyTheme(this.currentTheme);
    }

    this.setupMutationObserver();
    this.setupMessageListener();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (this.enabled && this.currentTheme) {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              this.applyThemeToElement(node);
            }
          });
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleTheme') {
        this.enabled = request.enabled;
        this.currentTheme = request.theme;
        
        if (this.enabled && this.currentTheme) {
          this.applyTheme(this.currentTheme);
        } else {
          this.removeTheme();
        }
      }
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Apply to all elements
    const elements = document.getElementsByTagName('*');
    for (let element of elements) {
      this.applyThemeToElement(element);
    }

    // Add special effects
    this.addSpecialEffects();
  }

  applyThemeToElement(element) {
    if (!element || element.hasAttribute('data-cutify-processed')) {
      return;
    }

    // Skip elements that shouldn't be themed
    if (this.shouldSkipElement(element)) {
      return;
    }

    element.setAttribute('data-theme', this.currentTheme);
    element.setAttribute('data-cutify-processed', 'true');

    // Add hover effects to interactive elements
    if (this.isInteractiveElement(element)) {
      element.classList.add('cutify-float');
    }
  }

  removeTheme() {
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
    
    const elements = document.getElementsByTagName('*');
    for (let element of elements) {
      element.removeAttribute('data-theme');
      element.removeAttribute('data-cutify-processed');
      element.classList.remove('cutify-float', 'cutify-pulse');
    }
  }

  shouldSkipElement(element) {
    // Skip script and style tags
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
      return true;
    }

    // Skip elements with specific classes or IDs that shouldn't be themed
    const skipClasses = ['no-theme', 'code', 'syntax'];
    const skipIds = ['monaco-editor', 'code-editor'];

    return skipClasses.some(cls => element.classList.contains(cls)) ||
           skipIds.some(id => element.id === id);
  }

  isInteractiveElement(element) {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    return interactiveTags.includes(element.tagName);
  }

  addSpecialEffects() {
    if (this.currentTheme === 'starry-night') {
      this.createStars();
    }
  }

  createStars() {
    const starsContainer = document.createElement('div');
    starsContainer.className = 'cutify-stars-container';
    starsContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;

    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'cutify-star';
      star.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: white;
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: twinkle ${1 + Math.random() * 2}s infinite ease-in-out;
      `;
      starsContainer.appendChild(star);
    }

    document.body.appendChild(starsContainer);
  }
}

// Initialize Theme Manager
new ThemeManager();
