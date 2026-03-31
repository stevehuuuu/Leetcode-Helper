document.addEventListener('DOMContentLoaded', function() {
  try {
    setupEventListeners();
    initializeUIFromCache();
    updateGlider();
    displayVersion();
  } catch (error) {
    console.error('Error during popup initialization:', error);
    showErrorMessage('Failed to initialize the extension popup. Please try again.');
  }
});

function setupEventListeners() {
  try {
    const checkConnectionBtn = document.getElementById('check-connection');
    if (checkConnectionBtn) {
      checkConnectionBtn.addEventListener('click', checkApiConfig);
    } else {
      console.error('Check connection button not found');
    }

    const apiKeyForm = document.getElementById('api-key-form');
    if (apiKeyForm) {
      apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    } else {
      console.error('API key form not found');
    }

    const toggleApiKeyVisibilityBtn = document.getElementById('toggle-api-key-visibility');
    if (toggleApiKeyVisibilityBtn) {
        toggleApiKeyVisibilityBtn.addEventListener('click', function() {
            const apiKeyInput = document.getElementById('api-key-input');
            const icon = this.querySelector('i');
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                apiKeyInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    const settingsTab = document.getElementById('settings-tab');
    const aboutTab = document.getElementById('about-tab');
    const settingsContent = document.getElementById('settings-content');
    const aboutContent = document.getElementById('about-content');

    // 收藏Tab功能
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        // 切换按钮状态
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // 切换内容
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        // 如果是收藏tab，加载收藏列表
        if (tab === 'favorites') {
          renderFavorites();
        }
      });
    });
    
    if (settingsTab && aboutTab && settingsContent && aboutContent) {
      settingsTab.addEventListener('click', function() {
        settingsTab.classList.add('active');
        aboutTab.classList.remove('active');
        settingsContent.classList.add('active');
        aboutContent.classList.remove('active');
        updateGlider();
      });
      
      aboutTab.addEventListener('click', function() {
        aboutTab.classList.add('active');
        settingsTab.classList.remove('active');
        aboutContent.classList.add('active');
        settingsContent.classList.remove('active');
        updateGlider();
      });
    } else {
      console.error('Tab elements not found');
    }
    
    const emailLink = document.getElementById('email-link');
    if (emailLink) {
      emailLink.addEventListener('click', function(e) {
        e.preventDefault();
        try {
          chrome.tabs.create({
            url: "mailto:utkarshprap@gmail.com"
          });
        } catch (error) {
          console.error('Error opening email client:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

function updateGlider() {
  try {
    const activeTab = document.querySelector('.tab.active');
    const glider = document.querySelector('.glider');
    
    if (activeTab && glider) {
      glider.style.width = `${activeTab.offsetWidth}px`;
      glider.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    }
  } catch(error) {
    console.error("Error updating glider position:", error);
  }
}

function setUIForConnected() {
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const apiKeyInstruction = document.getElementById('api-key-instruction');
    const changeKeyInstruction = document.getElementById('change-key-instruction');
    const changeKeyLabel = document.getElementById('change-key-label');

    if (statusIcon) {
      statusIcon.classList.remove('disconnected');
      statusIcon.classList.add('connected');
    }
    if (statusText) {
      statusText.textContent = 'Gemini API configured. You can change your key below if needed.';
    }
    try {
      chrome.action.setIcon({ path: { "128": "images/enabled.png" } });
      chrome.action.setBadgeText({ text: '' });
    } catch (iconError) {
      console.error('Error setting icon:', iconError);
    }
    if (apiKeyInstruction) apiKeyInstruction.style.display = 'none';
    if (changeKeyInstruction) changeKeyInstruction.style.display = 'block';
    if (changeKeyLabel) changeKeyLabel.style.display = 'inline';
}

function setUIForDisconnected() {
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const apiKeyInstruction = document.getElementById('api-key-instruction');
    const changeKeyInstruction = document.getElementById('change-key-instruction');
    const changeKeyLabel = document.getElementById('change-key-label');

    if (statusIcon) {
      statusIcon.classList.remove('connected');
      statusIcon.classList.add('disconnected');
    }
    if (statusText) {
      statusText.textContent = 'Gemini API key not configured';
    }
    try {
      chrome.action.setIcon({ path: { "128": "images/disabled.png" } });
      chrome.action.setBadgeText({ text: '' });
    } catch (iconError) {
      console.error('Error setting icon:', iconError);
    }
    if (apiKeyInstruction) apiKeyInstruction.style.display = 'block';
    if (changeKeyInstruction) changeKeyInstruction.style.display = 'none';
    if (changeKeyLabel) changeKeyLabel.style.display = 'none';
}

function initializeUIFromCache() {
  chrome.storage.local.get(['apiKeyStatus'], function(result) {
    if (result.apiKeyStatus === 'ok') {
      setUIForConnected();
    } else {
      setUIForDisconnected();
    }
  });
}

function checkApiConfig() {
  try {
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    
    if (!statusText) {
      console.error('Status text element not found');
      return;
    }
    
    statusText.textContent = 'Checking Gemini API configuration...';
    if (statusIcon) {
      statusIcon.classList.remove('connected', 'disconnected');
    }

    const minDisplayTime = new Promise(resolve => setTimeout(resolve, 500));
    const apiCheck = checkApiStatus();

    Promise.all([apiCheck, minDisplayTime])
      .then(([data]) => {
        if (data.status === 'error') {
          throw new Error(data.message);
        }
        setUIForConnected();
        chrome.storage.local.set({ apiKeyStatus: 'ok' });
      })
      .catch(error => {
        console.error('Error checking API configuration:', error);
        setUIForDisconnected();
        chrome.storage.local.set({ apiKeyStatus: 'error' });
      });
  } catch (error) {
    console.error('Error in checkApiConfig:', error);
    showErrorMessage('Failed to check API configuration');
  }
}

function displayVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay) {
      versionDisplay.textContent = `Version: ${manifest.version}`;
    }
  } catch (error) {
    console.error('Error displaying version:', error);
  }
}

function handleApiKeySubmit(event) {
  event.preventDefault();
  
  try {
    const apiKeyInput = document.getElementById('api-key-input');
    const statusText = document.getElementById('status-text');
    
    if (!apiKeyInput || !statusText) {
      console.error('API key input or status text element not found');
      return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      statusText.textContent = 'Error: API key cannot be empty';
      statusText.style.color = '#dc3545';
      setTimeout(() => {
        statusText.style.color = '';
        setUIForDisconnected();
      }, 3000);
      return;
    }
    
    statusText.textContent = 'Validating API key...';
    saveApiKey(apiKey)
      .then(() => {
        apiKeyInput.value = '';
        statusText.textContent = 'API key validated and saved, checking configuration...';
        checkApiConfig();
      })
      .catch(error => {
        console.error('Error saving API key:', error);
        statusText.textContent = `Error: ${error.message || 'Failed to save API key'}`;
        statusText.style.color = '#dc3545';
        
        setTimeout(() => {
          statusText.style.color = '';
          setUIForDisconnected();
        }, 5000);
      });
  } catch (error) {
    console.error('Error in handleApiKeySubmit:', error);
    showErrorMessage('Failed to save API key');
  }
}

function showErrorMessage(message) {
  try {
    const statusText = document.getElementById('status-text');
    if (statusText) {
      statusText.textContent = message;
      statusText.style.color = '#dc3545';
      
      setTimeout(() => {
        statusText.style.color = '';
      }, 5000);
    }
  } catch (error) {
    console.error('Error showing error message:', error);
  }
}

// 渲染收藏列表
function renderFavorites() {
  const favoritesTab = document.getElementById('favorites-tab');
  if (!favoritesTab) return;

  chrome.storage.local.get('favorites', (result) => {
    const favorites = result.favorites || [];
    if (favorites.length === 0) {
      favoritesTab.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px 20px; color: var(--medium-text);">
          <i class="fas fa-star" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
          <p>No favorite problems yet</p>
          <p style="font-size: 14px; margin-top: 8px;">Star problems on LeetCode pages to save them here</p>
        </div>
      `;
      return;
    }

    // 按收藏时间倒序排列
    favorites.sort((a, b) => b.timestamp - a.timestamp);
    
    let html = `
      <div style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 8px;"><i class="fas fa-star" style="color: #f1c40f; margin-right: 6px;"></i> Your Favorites</h3>
        <p style="font-size: 14px; color: var(--medium-text);">${favorites.length} saved problems</p>
      </div>
      <div style="max-height: 400px; overflow-y: auto; padding-right: 4px;">
    `;

    favorites.forEach((item, index) => {
      html += `
        <div class="favorite-item" style="background: var(--dark-card); border: 1px solid var(--dark-border); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
          <a href="${item.url}" target="_blank" style="color: var(--light-text); text-decoration: none; flex: 1; margin-right: 8px;">
            <div style="font-weight: 500; margin-bottom: 4px;">${item.title}</div>
            <div style="font-size: 12px; color: var(--medium-text);">${new Date(item.timestamp).toLocaleDateString()}</div>
          </a>
          <button class="remove-favorite" data-index="${index}" style="background: transparent; border: none; color: var(--error-color); cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    });

    html += '</div>';
    favoritesTab.innerHTML = html;

    // 添加删除收藏事件
    document.querySelectorAll('.remove-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        removeFavorite(index);
      });
    });

    // 添加悬停效果
    document.querySelectorAll('.favorite-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = 'var(--primary-color)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = 'var(--dark-border)';
      });
    });
  });
}

// 删除收藏
function removeFavorite(index) {
  chrome.storage.local.get('favorites', (result) => {
    let favorites = result.favorites || [];
    favorites.splice(index, 1);
    chrome.storage.local.set({favorites: favorites}, () => {
      renderFavorites();
    });
  });
}