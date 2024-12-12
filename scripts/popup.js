document.addEventListener('DOMContentLoaded', async () => {
  const themeToggle = document.getElementById('themeToggle');
  const openDashboardBtn = document.getElementById('openDashboard');
  const currentThemeText = document.getElementById('currentTheme');
  const themeGrid = document.getElementById('themeGrid');

  // Load initial state and apply to all tabs
  async function initializeState() {
    const { enabled, activeTheme, themes = [] } = await chrome.storage.sync.get(['enabled', 'activeTheme', 'themes']);
    themeToggle.checked = enabled ?? false;
    
    // Get the active theme object
    const currentTheme = themes.find(t => t.id === activeTheme);
    
    // Apply to all tabs based on current state
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.map(tab => {
      return chrome.tabs.sendMessage(tab.id, {
        action: 'toggleTheme',
        enabled: enabled ?? false,
        theme: currentTheme
      }).catch(() => {/* Ignore errors for inactive tabs */});
    }));

    // Update popup UI
    if (currentTheme) {
      updateCurrentThemeDisplay(currentTheme);
    }
  }

  // Handle theme toggle
  themeToggle.addEventListener('change', async () => {
    const enabled = themeToggle.checked;
    
    try {
      // Save state
      await chrome.storage.sync.set({ enabled });
      
      // Get current theme
      const { activeTheme, themes = [] } = await chrome.storage.sync.get(['activeTheme', 'themes']);
      const currentTheme = themes.find(t => t.id === activeTheme);
      
      // Apply to all tabs
      const tabs = await chrome.tabs.query({});
      await Promise.all(tabs.map(tab => {
        return chrome.tabs.sendMessage(tab.id, {
          action: 'toggleTheme',
          enabled,
          theme: enabled ? currentTheme : null
        }).catch(() => {/* Ignore errors for inactive tabs */});
      }));
    } catch (error) {
      console.error('Error toggling theme:', error);
      // Revert toggle if there was an error
      themeToggle.checked = !enabled;
    }
  });

  // Load and display themes
  async function loadThemes() {
    const { themes = defaultThemes, activeTheme } = await chrome.storage.sync.get(['themes', 'activeTheme']);
    displayThemes(themes, activeTheme);
    updateCurrentThemeDisplay(themes.find(t => t.id === activeTheme));
  }

  // Display themes in the grid
  function displayThemes(themes, currentThemeId) {
    themeGrid.innerHTML = '';
    themes.forEach(theme => {
      const card = document.createElement('div');
      card.className = `theme-card ${theme.id === currentThemeId ? 'active' : ''}`;
      
      const preview = document.createElement('div');
      preview.className = 'theme-preview';
      preview.style.background = `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
      
      const name = document.createElement('div');
      name.className = 'theme-name';
      name.textContent = theme.name;
      
      card.appendChild(preview);
      card.appendChild(name);
      
      card.addEventListener('click', async () => {
        if (!themeToggle.checked) {
          // If toggle is off, turn it on when selecting a theme
          themeToggle.checked = true;
          await chrome.storage.sync.set({ enabled: true });
        }
        
        try {
          // Update active theme
          await chrome.storage.sync.set({ activeTheme: theme.id });
          
          // Apply to all tabs
          const tabs = await chrome.tabs.query({});
          await Promise.all(tabs.map(tab => {
            return chrome.tabs.sendMessage(tab.id, {
              action: 'toggleTheme',
              enabled: true,
              theme: theme
            }).catch(() => {/* Ignore errors for inactive tabs */});
          }));
          
          // Update UI
          document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          updateCurrentThemeDisplay(theme);
        } catch (error) {
          console.error('Error applying theme:', error);
        }
      });
      
      themeGrid.appendChild(card);
    });
  }

  // Update current theme display
  function updateCurrentThemeDisplay(theme) {
    if (!theme) return;
    currentThemeText.textContent = theme.name;
    currentThemeText.style.color = theme.colors.text;
    document.body.style.backgroundColor = theme.colors.background;
  }

  // Listen for theme updates from dashboard
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'themesUpdated') {
      loadThemes();
    }
  });

  // Open dashboard
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });

  // Initialize
  await initializeState();
  loadThemes();
});
