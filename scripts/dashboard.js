document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const themesList = document.getElementById('themesList');
  const createThemeBtn = document.getElementById('createTheme');
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
    if (theme.id === currentTheme) {
      card.classList.add('active');
    }

    // Create color preview
    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    preview.setAttribute('data-theme', theme.id);

    // Create color swatches
    const swatches = document.createElement('div');
    swatches.className = 'color-swatches';
    
    const colors = [
      { name: 'primary', color: theme.colors?.primary || '#ffa6d2' },
      { name: 'secondary', color: theme.colors?.secondary || '#a6c1ff' },
      { name: 'accent', color: theme.colors?.accent || '#ffd6e6' }
    ];

    colors.forEach(({ name, color }) => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${name}-swatch`;
      swatch.style.backgroundColor = color;
      swatch.title = `${name} color: ${color}`;
      swatches.appendChild(swatch);
    });

    // Create background preview with text sample
    const bgPreview = document.createElement('div');
    bgPreview.className = 'bg-preview';
    bgPreview.style.backgroundColor = theme.colors?.background || '#fff0f5';
    bgPreview.style.color = theme.colors?.text || '#6e5a6e';
    bgPreview.style.fontFamily = theme.fontFamily || 'Quicksand';
    bgPreview.innerHTML = `
      <span class="font-sample">Aa</span>
      <span class="theme-name">${theme.name}</span>
    `;

    preview.appendChild(swatches);
    preview.appendChild(bgPreview);

    // Create theme info section
    const info = document.createElement('div');
    info.className = 'theme-info';
    info.innerHTML = `
      <div class="theme-actions">
        <button class="apply-btn" title="Apply Theme">Apply</button>
        ${theme.type !== 'preset' ? `
          <button class="edit-btn" title="Edit Theme">Edit</button>
          <button class="delete-btn" title="Delete Theme">Delete</button>
        ` : ''}
      </div>
    `;

    card.appendChild(preview);
    card.appendChild(info);

    // Add event listeners
    const applyBtn = info.querySelector('.apply-btn');
    applyBtn.addEventListener('click', () => applyTheme(theme));

    if (theme.type !== 'preset') {
      const editBtn = info.querySelector('.edit-btn');
      const deleteBtn = info.querySelector('.delete-btn');
      
      editBtn.addEventListener('click', () => openModal(theme));
      deleteBtn.addEventListener('click', () => deleteTheme(theme.id));
    }

    return card;
  }

  // Open modal for creating/editing theme
  function openModal(theme = null) {
    editingThemeId = theme ? theme.id : null;
    const modalTitle = document.getElementById('modalTitle');
    const themeNameInput = document.getElementById('themeName');
    const primaryColorInput = document.getElementById('primaryColor');
    const secondaryColorInput = document.getElementById('secondaryColor');
    const accentColorInput = document.getElementById('accentColor');
    const textColorInput = document.getElementById('textColor');
    const bgColorInput = document.getElementById('bgColor');
    const fontFamilySelect = document.getElementById('fontFamily');

    modalTitle.textContent = theme ? 'Edit Theme' : 'Create New Theme';
    
    if (theme) {
      themeNameInput.value = theme.name;
      primaryColorInput.value = theme.colors.primary;
      secondaryColorInput.value = theme.colors.secondary;
      accentColorInput.value = theme.colors.accent;
      textColorInput.value = theme.colors.text;
      bgColorInput.value = theme.colors.background;
      fontFamilySelect.value = theme.fontFamily || 'Quicksand';
    } else {
      themeForm.reset();
    }

    themeEditorModal.classList.add('active');
    updatePreview();
  }

  // Close modal
  function closeModal() {
    themeEditorModal.classList.remove('active');
    editingThemeId = null;
    themeForm.reset();
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

  // Save theme
  async function saveTheme() {
    const themeData = getThemeDataFromForm();
    
    if (!themeData.name) {
      alert('Please enter a theme name');
      return;
    }

    const result = await chrome.storage.sync.get(['themes']);
    let themes = result.themes || [];

    if (editingThemeId) {
      // Update existing theme
      themes = themes.map(theme => 
        theme.id === editingThemeId 
          ? { ...theme, ...themeData }
          : theme
      );
    } else {
      // Create new theme
      themes.push({
        id: 'custom-' + Date.now(),
        type: 'custom',
        ...themeData
      });
    }

    await chrome.storage.sync.set({ themes });
    closeModal();
    loadThemes();
  }

  // Delete theme
  async function deleteTheme(themeId) {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    const result = await chrome.storage.sync.get(['themes', 'currentTheme']);
    let themes = result.themes || [];
    
    // Remove theme
    themes = themes.filter(theme => theme.id !== themeId);
    
    // If deleted theme was current theme, switch to default
    if (result.currentTheme === themeId) {
      await chrome.storage.sync.set({ currentTheme: 'pastel-paradise' });
    }

    await chrome.storage.sync.set({ themes });
    loadThemes();
  }

  // Apply theme
  async function applyTheme(theme) {
    await chrome.storage.sync.set({ 
      currentTheme: theme.id,
      enabled: true
    });

    // Update recently used themes
    const result = await chrome.storage.sync.get(['recentlyUsed']);
    let recentlyUsed = result.recentlyUsed || [];
    recentlyUsed = [theme.id, ...recentlyUsed.filter(id => id !== theme.id)].slice(0, 5);
    await chrome.storage.sync.set({ recentlyUsed });

    // Update display
    displayThemes(themes, theme.id);

    // Apply to current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleTheme',
        enabled: true,
        theme: theme.id
      });
    });
  }

  // Add event listeners for live preview
  const colorInputs = document.querySelectorAll('input[type="color"]');
  const fontFamilySelect = document.getElementById('fontFamily');
  
  colorInputs.forEach(input => {
    input.addEventListener('input', updatePreview);
  });
  
  fontFamilySelect.addEventListener('change', updatePreview);
});
