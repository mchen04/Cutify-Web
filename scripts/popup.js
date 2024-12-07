document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const themeToggle = document.getElementById('themeToggle');
  const openDashboardBtn = document.getElementById('openDashboard');
  const currentThemeText = document.getElementById('currentTheme');

  // Load saved state
  async function loadState() {
    const result = await chrome.storage.sync.get(['enabled', 'currentTheme', 'themes']);
    const enabled = result.enabled ?? false;
    themeToggle.checked = enabled;

    // Find theme name
    const currentThemeId = result.currentTheme || 'pastel-paradise';
    let themeName = 'Pastel Paradise'; // default

    // Check preset themes
    const presetThemes = {
      'pastel-paradise': 'Pastel Paradise',
      'starry-night': 'Starry Night',
      'fluffy-clouds': 'Fluffy Clouds'
    };

    if (presetThemes[currentThemeId]) {
      themeName = presetThemes[currentThemeId];
    } else if (result.themes) {
      // Check custom themes
      const customTheme = result.themes.find(t => t.id === currentThemeId);
      if (customTheme) {
        themeName = customTheme.name;
      }
    }

    currentThemeText.textContent = themeName;
  }

  // Theme toggle
  themeToggle.addEventListener('change', async () => {
    const enabled = themeToggle.checked;
    const result = await chrome.storage.sync.get(['currentTheme']);
    const currentTheme = result.currentTheme || 'pastel-paradise';

    // Save state
    await chrome.storage.sync.set({ enabled });

    // Apply to current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleTheme',
        enabled,
        theme: currentTheme
      });
    });
  });

  // Open dashboard
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  });

  // Initialize
  loadState();
});
