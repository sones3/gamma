document.addEventListener('DOMContentLoaded', () => {
  const inputs = {
    maxClaim: document.getElementById('maxClaim'),
    claimKey: document.getElementById('claimKey'),
    approveKey: document.getElementById('approveKey'),
    addressKey: document.getElementById('addressKey')
  };
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  chrome.storage.local.get({
    maxClaim: 30,
    claimKey: 's',
    approveKey: '+',
    addressKey: 'Shift'
  }, (items) => {
    inputs.maxClaim.value = items.maxClaim;
    inputs.claimKey.value = items.claimKey;
    inputs.approveKey.value = items.approveKey;
    inputs.addressKey.value = items.addressKey;
  });

  ['claimKey', 'approveKey', 'addressKey'].forEach(id => {
    const el = document.getElementById(id);
    
    el.addEventListener('keydown', (e) => {
      e.preventDefault();
      
      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Meta');

      const isModifier = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
      if (!isModifier) {
        let keyChar = e.key;
        if (keyChar === ' ') keyChar = 'Space';
        if (keyChar.length === 1) keyChar = keyChar.toUpperCase();
        
        keys.push(keyChar);
        el.value = keys.join('+');
      } else {
        el.value = keys.join('+') + (keys.length > 0 ? '+' : '');
      }
    });

    el.addEventListener('keyup', (e) => {
      if (el.value.endsWith('+')) {
        el.value = el.value.slice(0, -1);
      }
    });
  });

  saveBtn.addEventListener('click', () => {
    if (inputs.claimKey.value.endsWith('+') || inputs.approveKey.value.endsWith('+')) {
      status.textContent = '❌ Invalid shortcut format!';
      status.style.color = '#f38ba8';
      return;
    }

    const config = {
      maxClaim: parseInt(inputs.maxClaim.value, 10),
      claimKey: inputs.claimKey.value,
      approveKey: inputs.approveKey.value,
      addressKey: inputs.addressKey.value
    };

    chrome.storage.local.set(config, () => {
      status.textContent = 'Settings Saved! ✅';
      status.style.color = '#a6e3a1';
      setTimeout(() => status.textContent = '', 2000);
      
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {type: 'UPDATE_CONFIG', config: config});
        }
      });
    });
  });
});