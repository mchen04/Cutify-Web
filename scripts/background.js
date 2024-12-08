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

// Sync theme to a specific tab
async function syncThemeToTab(tabId) {
  try {
    const { activeTheme } = await chrome.storage.sync.get('activeTheme');
    if (activeTheme) {
      await chrome.tabs.sendMessage(tabId, {
        action: 'updateTheme',
        theme: activeTheme
      });
    }
  } catch (error) {
    console.error('Error syncing theme to tab:', error);
  }
}

// Listen for installation or update
chrome.runtime.onInstalled.addListener(async () => {
  // Sync theme to all existing tabs
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    syncThemeToTab(tab.id);
  }
});
