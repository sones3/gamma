document.addEventListener('DOMContentLoaded', () => {
  const inputs = {
    maxClaim: document.getElementById('maxClaim'),
    claimKey: document.getElementById('claimKey'),
    approveKey: document.getElementById('approveKey'),
    addressKey: document.getElementById('addressKey'),
    ocrKey: document.getElementById('ocrKey'),
    turboMode: document.getElementById('turboMode')
  };
  const saveBtn = document.getElementById('saveBtn');
  const downloadLogsBtn = document.getElementById('downloadLogsBtn');
  const status = document.getElementById('status');

  chrome.storage.local.get({
    maxClaim: 30,
    claimKey: 's',
    approveKey: '+',
    addressKey: 'Shift',
    ocrKey: 'Ctrl+Shift+K',
    turboMode: false
  }, (items) => {
    inputs.maxClaim.value = items.maxClaim;
    inputs.claimKey.value = items.claimKey;
    inputs.approveKey.value = items.approveKey;
    inputs.addressKey.value = items.addressKey;
    inputs.ocrKey.value = items.ocrKey;
    inputs.turboMode.checked = items.turboMode;
  });

  ['claimKey', 'approveKey', 'addressKey', 'ocrKey'].forEach(id => {
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
      addressKey: inputs.addressKey.value,
      ocrKey: inputs.ocrKey.value,
      turboMode: inputs.turboMode.checked,
      multiViewMode: true 
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

  downloadLogsBtn.addEventListener('click', () => {
    chrome.storage.local.get({ gammaLogs: [] }, (result) => {
      const logs = result.gammaLogs;
      if (!logs || logs.length === 0) {
        status.textContent = '⚠️ No logs found.';
        status.style.color = '#fab387';
        return;
      }

      const today = new Date().toDateString();
      const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);

      if (todayLogs.length === 0) {
        status.textContent = '⚠️ No logs for today.';
        status.style.color = '#fab387';
        return;
      }

      const logText = todayLogs.map(log => log.text).join('\n');
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `${dateStr}.log`;
      a.click();
      
      URL.revokeObjectURL(url);
      status.textContent = 'Logs Downloaded! 📥';
      status.style.color = '#a6e3a1';
    });
  });
});