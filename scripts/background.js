// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    syncThemeToTab(tabId);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(({ tabId }) => {
  syncThemeToTab(tabId);
});

// Listen for theme toggle messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'toggleTheme') {
    // Update all tabs with the new theme state
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleTheme',
          enabled: message.enabled,
          theme: message.theme
        });
      } catch (error) {
        console.error(`Error updating tab ${tab.id}:`, error);
      }
    }
    
    // Store the theme state
    await chrome.storage.sync.set({
      enabled: message.enabled,
      activeTheme: message.enabled ? message.theme : null
    });
  }
});

// Sync theme to a specific tab
async function syncThemeToTab(tabId) {
  try {
    const { enabled, activeTheme } = await chrome.storage.sync.get(['enabled', 'activeTheme']);
    if (enabled && activeTheme) {
      await chrome.tabs.sendMessage(tabId, {
        action: 'toggleTheme',
        enabled: true,
        theme: activeTheme
      });
    } else if (!enabled) {
      await chrome.tabs.sendMessage(tabId, {
        action: 'toggleTheme',
        enabled: false,
        theme: null
      });
    }
  } catch (error) {
    console.error('Error syncing theme to tab:', error);
  }
}

// Listen for installation or update
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize theme state if not set
  const { enabled, activeTheme } = await chrome.storage.sync.get(['enabled', 'activeTheme']);
  if (enabled === undefined) {
    await chrome.storage.sync.set({ enabled: false, activeTheme: null });
  }
  
  // Sync theme to all existing tabs
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    syncThemeToTab(tab.id);
  }
});
