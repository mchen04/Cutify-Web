document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const themesList = document.getElementById('themesList');
  const createThemeBtn = document.getElementById('createThemeBtn');
  const themeEditorModal = document.getElementById('themeEditorModal');
  const closeModalBtn = document.querySelector('.close-btn');
  const saveThemeBtn = document.getElementById('saveTheme');
  const previewThemeBtn = document.getElementById('previewTheme');
  const themeForm = document.getElementById('themeForm');
  const previewContainer = document.getElementById('previewContainer');

  let editingThemeId = null;
  let themes = [];

  // Load themes from storage
  loadThemes();

  // Event Listeners
  createThemeBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', closeModal);
  saveThemeBtn.addEventListener('click', saveTheme);
  previewThemeBtn.addEventListener('click', previewCurrentTheme);

  // Modal elements
  const modal = document.getElementById('themeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('themeForm');
  const modalPreview = document.getElementById('modalPreview');
  const createThemeBtnModal = document.getElementById('createThemeBtn');

  // Default theme template
  const defaultTheme = {
    name: '',
    colors: {
      primary: '#ffa6d2',
      secondary: '#a6c1ff',
      accent: '#ffd6e6',
      text: '#6e5a6e',
      background: '#fff0f5'
    },
    fontFamily: 'Quicksand',
    type: 'custom'
  };

  // Initialize create theme button
  if (createThemeBtnModal) {
    createThemeBtnModal.addEventListener('click', () => openModal());
  } else {
    console.error('Create theme button not found');
  }

  // Open modal for create/edit
  function openModal(theme = null) {
    const isEditing = !!theme;
    modalTitle.textContent = isEditing ? 'Edit Theme' : 'Create New Theme';
    
    // Reset or fill form with theme data
    const themeData = theme || defaultTheme;
    
    // Set form values
    modalForm.elements.themeName.value = themeData.name;
    modalForm.elements.primaryColor.value = themeData.colors.primary;
    modalForm.elements.secondaryColor.value = themeData.colors.secondary;
    modalForm.elements.accentColor.value = themeData.colors.accent;
    modalForm.elements.textColor.value = themeData.colors.text;
    modalForm.elements.backgroundColor.value = themeData.colors.background;
    modalForm.elements.fontFamily.value = themeData.fontFamily;
    
    // Update preview
    updateModalPreview();
    
    // Show modal
    modal.style.display = 'block';
    
    // Store theme ID if editing
    modalForm.dataset.themeId = theme ? theme.id : '';
  }

  // Update modal preview as user makes changes
  function updateModalPreview() {
    const formData = new FormData(modalForm);
    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    
    // Create color swatches
    const swatches = document.createElement('div');
    swatches.className = 'color-swatches';
    
    const colors = [
      { name: 'primary', color: formData.get('primaryColor') },
      { name: 'secondary', color: formData.get('secondaryColor') },
      { name: 'accent', color: formData.get('accentColor') }
    ];

    colors.forEach(({ name, color }) => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${name}-swatch`;
      swatch.style.backgroundColor = color;
      swatches.appendChild(swatch);
    });

    // Create background preview
    const bgPreview = document.createElement('div');
    bgPreview.className = 'bg-preview';
    bgPreview.style.backgroundColor = formData.get('backgroundColor');
    bgPreview.style.color = formData.get('textColor');
    bgPreview.style.fontFamily = formData.get('fontFamily');
    bgPreview.innerHTML = `
      <span class="font-sample">Aa</span>
      <span class="theme-name">${formData.get('themeName') || 'Theme Preview'}</span>
    `;

    preview.appendChild(swatches);
    preview.appendChild(bgPreview);
    
    modalPreview.innerHTML = '';
    modalPreview.appendChild(preview);
  }

  // Add event listeners for live preview
  const formInputs = modalForm.querySelectorAll('input, select');
  formInputs.forEach(input => {
    input.addEventListener('input', updateModalPreview);
  });

  // Handle form submission
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(modalForm);
    const themeId = modalForm.dataset.themeId;
    
    const newTheme = {
      id: themeId || `custom_${Date.now()}`,
      name: formData.get('themeName'),
      colors: {
        primary: formData.get('primaryColor'),
        secondary: formData.get('secondaryColor'),
        accent: formData.get('accentColor'),
        text: formData.get('textColor'),
        background: formData.get('backgroundColor')
      },
      fontFamily: formData.get('fontFamily'),
      type: 'custom'
    };

    try {
      // Get existing themes
      const { themes = [] } = await chrome.storage.sync.get('themes');
      
      if (themeId) {
        // Update existing theme
        const index = themes.findIndex(t => t.id === themeId);
        if (index !== -1) {
          themes[index] = newTheme;
        }
      } else {
        // Add new theme
        themes.push(newTheme);
      }
      
      // Save updated themes
      await chrome.storage.sync.set({ themes });
      
      // Close modal and refresh themes
      closeModal();
      loadThemes();
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme. Please try again.');
    }
  });

  // Close modal
  function closeModal() {
    modal.style.display = 'none';
    modalForm.reset();
    modalForm.dataset.themeId = '';
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal when clicking close button
  document.querySelector('.close-modal').addEventListener('click', closeModal);

  // Load themes from storage and display them
  async function loadThemes() {
    const result = await chrome.storage.sync.get(['themes', 'currentTheme', 'recentlyUsed']);
    themes = result.themes || [];
    const currentTheme = result.currentTheme;
    const recentlyUsed = result.recentlyUsed || [];

    // Sort themes by recently used
    themes.sort((a, b) => {
      const aIndex = recentlyUsed.indexOf(a.id);
      const bIndex = recentlyUsed.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    displayThemes(themes, currentTheme);
  }

  // Display themes in the grid
  function displayThemes(themes, currentTheme) {
    themesList.innerHTML = '';

    // Add preset themes first
    const presetThemes = [
      { 
        id: 'pastel-paradise', 
        name: 'Pastel Paradise', 
        type: 'preset',
        colors: {
          primary: '#ffa6d2',
          secondary: '#a6c1ff',
          accent: '#ffd6e6',
          text: '#6e5a6e',
          background: '#fff0f5'
        }
      },
      { 
        id: 'starry-night', 
        name: 'Starry Night', 
        type: 'preset',
        colors: {
          primary: '#b19cd9',
          secondary: '#9db4ff',
          accent: '#e6e6ff',
          text: '#e6e6ff',
          background: '#2a2a4a'
        }
      },
      { 
        id: 'fluffy-clouds', 
        name: 'Fluffy Clouds', 
        type: 'preset',
        colors: {
          primary: '#87ceeb',
          secondary: '#b0e0e6',
          accent: '#e6f3ff',
          text: '#4a6b8c',
          background: '#f0f8ff'
        }
      }
    ];

    presetThemes.forEach(theme => {
      themesList.appendChild(createThemeCard(theme, currentTheme));
    });

    // Add custom themes
    themes.forEach(theme => {
      themesList.appendChild(createThemeCard(theme, currentTheme));
    });
  }

  // Create a theme card element
  function createThemeCard(theme, currentTheme) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.dataset.themeId = theme.id;
    if (theme.id === currentTheme) {
      card.classList.add('active');
    }

    // Create the card structure
    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    
    const swatches = document.createElement('div');
    swatches.className = 'color-swatches';
    swatches.innerHTML = `
      <div class="color-swatch" style="background-color: ${theme.colors.primary}"></div>
      <div class="color-swatch" style="background-color: ${theme.colors.secondary}"></div>
      <div class="color-swatch" style="background-color: ${theme.colors.accent}"></div>
    `;
    
    const bgPreview = document.createElement('div');
    bgPreview.className = 'bg-preview';
    bgPreview.style.backgroundColor = theme.colors.background;
    bgPreview.style.color = theme.colors.text;
    bgPreview.style.fontFamily = theme.fontFamily;
    bgPreview.innerHTML = `
      <div class="font-sample">Aa</div>
      <div class="theme-name">${theme.name}</div>
    `;
    
    preview.appendChild(swatches);
    preview.appendChild(bgPreview);
    
    const info = document.createElement('div');
    info.className = 'theme-info';
    info.innerHTML = `
      <div class="theme-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    
    card.appendChild(preview);
    card.appendChild(info);

    // Add click handler for the entire card
    card.addEventListener('click', async (e) => {
      // Don't apply theme if clicking edit or delete buttons
      if (e.target.matches('.edit-btn, .delete-btn')) {
        return;
      }

      // Add loading state
      card.classList.add('loading');

      try {
        // Mark this theme as active and others as inactive
        const themes = await getThemes();
        const updatedThemes = themes.map(t => ({
          ...t,
          active: t.id === theme.id
        }));
        
        // Update all theme cards
        document.querySelectorAll('.theme-card').forEach(c => {
          c.classList.toggle('active', c.dataset.themeId === theme.id);
        });

        // Save updated themes
        await chrome.storage.sync.set({ themes: updatedThemes });
        
        // Apply the theme
        await applyTheme({ ...theme, active: true });
        
        showNotification('Theme applied successfully!', 'success');
      } catch (error) {
        console.error('Error applying theme:', error);
        showNotification('Failed to apply theme. Please try again.', 'error');
      } finally {
        card.classList.remove('loading');
      }
    });

    // Add edit button handler
    const editBtn = info.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditThemeModal(theme);
    });

    // Add delete button handler
    const deleteBtn = info.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this theme?')) {
        try {
          await deleteTheme(theme.id);
          card.remove();
          showNotification('Theme deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting theme:', error);
          showNotification('Failed to delete theme. Please try again.', 'error');
        }
      }
    });

    return card;
  }

  // Preview current theme settings
  function previewCurrentTheme() {
    updatePreview();
  }

  // Update preview with current form values
  function updatePreview() {
    const preview = document.getElementById('modalPreview');
    const themeData = getThemeDataFromForm();
    
    preview.setAttribute('data-theme', 'preview');
    preview.style.setProperty('--cutify-primary-color', themeData.colors.primary);
    preview.style.setProperty('--cutify-secondary-color', themeData.colors.secondary);
    preview.style.setProperty('--cutify-accent-color', themeData.colors.accent);
    preview.style.setProperty('--cutify-text-color', themeData.colors.text);
    preview.style.setProperty('--cutify-bg-color', themeData.colors.background);
    preview.style.setProperty('--cutify-font-family', themeData.fontFamily);
  }

  // Get theme data from form
  function getThemeDataFromForm() {
    return {
      name: document.getElementById('themeName').value,
      colors: {
        primary: document.getElementById('primaryColor').value,
        secondary: document.getElementById('secondaryColor').value,
        accent: document.getElementById('accentColor').value,
        text: document.getElementById('textColor').value,
        background: document.getElementById('bgColor').value
      },
      fontFamily: document.getElementById('fontFamily').value
    };
  }

  async function saveTheme() {
    const themeData = getThemeDataFromForm();
    
    if (!themeData.name) {
      alert('Please enter a theme name');
      return;
    }

    try {
      const { themes = [] } = await chrome.storage.sync.get('themes');
      let updatedThemes = [...themes];
      
      if (editingThemeId) {
        // Update existing theme
        const index = themes.findIndex(t => t.id === editingThemeId);
        if (index !== -1) {
          updatedThemes[index] = { ...themeData, id: editingThemeId };
        }
      } else {
        // Create new theme
        const newTheme = {
          ...themeData,
          id: 'theme_' + Date.now(),
          type: 'custom'
        };
        updatedThemes.push(newTheme);
      }

      // Save to storage
      await chrome.storage.sync.set({ themes: updatedThemes });
      
      // Notify all tabs about the theme update
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'themesUpdated',
          themes: updatedThemes
        }).catch(() => {});
      });

      // If this was the active theme, reapply it
      const { activeTheme } = await chrome.storage.sync.get('activeTheme');
      if (activeTheme === editingThemeId) {
        const updatedTheme = updatedThemes.find(t => t.id === editingThemeId);
        if (updatedTheme) {
          await chrome.storage.sync.set({ activeTheme: updatedTheme.id });
          applyTheme(updatedTheme);
        }
      }

      // Refresh the display
      displayThemes(updatedThemes);
      closeModal();
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme. Please try again.');
    }
  }

  async function deleteTheme(themeId) {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    try {
      const { themes = [], activeTheme } = await chrome.storage.sync.get(['themes', 'activeTheme']);
      const updatedThemes = themes.filter(t => t.id !== themeId);
      
      // Save updated themes
      await chrome.storage.sync.set({ themes: updatedThemes });
      
      // If we deleted the active theme, switch to default
      if (activeTheme === themeId) {
        await chrome.storage.sync.set({ activeTheme: 'default' });
      }
      
      // Notify all tabs
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'themesUpdated',
          themes: updatedThemes
        }).catch(() => {});
      });

      // Refresh display
      displayThemes(updatedThemes);
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Failed to delete theme. Please try again.');
    }
  }

  // Apply theme
  async function applyTheme(theme) {
    try {
      // Save the theme to storage
      await chrome.storage.sync.set({
        activeTheme: {
          ...theme,
          active: true
        }
      });

      // Update theme colors in the manifest
      await updateManifestColors(theme);

      // Update any active tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'updateTheme', theme });
        } catch (error) {
          // Ignore errors for tabs that don't have our content script
          console.log('Tab not ready for theme update:', tab.id);
        }
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      throw error; // Re-throw to handle in the UI
    }
  }

  // Helper function to get themes from storage
  async function getThemes() {
    const data = await chrome.storage.sync.get('themes');
    return data.themes || [];
  }
});
