let config = {
  maxClaim: 30,
  claimKey: 'S',
  approveKey: '+',
  addressKey: 'Shift',
  ocrKey: 'Ctrl+Shift+K',
  turboMode: false
};

let ocrWorker = null;

chrome.storage.local.get({
  maxClaim: 30,
  claimKey: 'S',
  approveKey: '+',
  addressKey: 'Shift',
  ocrKey: 'Ctrl+Shift+K',
  turboMode: false
}, (items) => {
  config = items;
  console.log('✅ Gamma Extension Loaded:', config);
  applyTurboMode();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UPDATE_CONFIG') {
    config = request.config;
    console.log('🔄 Config updated:', config);
    applyTurboMode();
  }
});

function applyTurboMode() {
  if (config.turboMode) {
    const script = document.createElement('script');
    script.textContent = `
      if (window.bootbox) {
        window.bootbox.alert = function() { console.log('🚀 Turbo Mode: Alert blocked'); };
        window.bootbox.confirm = function(msg, cb) { if(cb) cb(true); }; 
      }
      console.log('🔥 Turbo Mode ACTIVATED: Alerts & Confirms neutralized.');
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }
}

const COMMUNE_MAPPING = {
  "Les Eucaliptus/ Cherarba": "Les Eucaliptus",
  "B E Bahri": "Bordj El Bahri",
  "O Fayet": "Ouled Fayet",
  "BIR KADEM R1 TEXRIANE R3": "BIR KADEM",
  "Staoueli R2": "Staoueli",
  "Reghaia R1": "Reghaia",
  "Bologhine R1": "Bologhine Ben Ziri",
  "DOUERA R2": "Douera",
  "El Kennar": "El Kennar Nouchfi",
  "DRARIA R2": "Draria",
  "Alger Haute Casbah R1": "Casbah",
  "Dely ibrahim R2": "Dely Ibrahim",
  "Mohammadia R2": "Mohammadia",
  "KHRAISSIA R3": "Khraissia",
  "Bordj el Kiffan Faizi": "Bordj El Kifan",
  "KOUBA RCE": "Kouba",
  "SAOULA R3": "Saoula",
  "BABA HASSEN R3": "Baba Hassen",
  "BACHDJARAH R1": "BACHDJARAH",
  "BENI MESSOUS R2": "Beni Messous",
  "Staoueli C ": "Staoueli",
  "AYN TAYA R1": "Ayn Taya",
  "HYDRA RHC": "Hydra",
  "EL ACHOUR R4": "El Achour",
  "OUED EL SEMAR R2": "Oued El Semar",
  "Alger Mohamed V": "Mohammed Belouizdad",
  "BARAKI BAR SI LAKHDAR R3": "Baraki",
  "ALGER SIDI M HAMED": "SIDI M HAMED",
  "Souidania R3": "Souidania",
  "Constantine El Gamas": "El Gamas",
  "Les Eucaliptus  Cherarba": "Les Eucaliptus",
  "Constantine Wilaya": "Les Eucaliptus"
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkTimeWithinMinutes(timingString, n) {
  if (!timingString) return false;
  const parts = timingString.trim().split(' ');
  if (parts.length !== 2) return false;

  const [datePart, timePart] = parts;
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const inputDate = new Date(year, month - 1, day, hours, minutes);
  if (isNaN(inputDate.getTime())) return false;

  const now = new Date();
  const diffMs = Math.abs(now - inputDate);
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes <= n;
}

async function waitAndClick(selector, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    
    if (el && (el.offsetParent !== null || config.turboMode)) { 
      el.click();
      return true;
    }
    await delay(config.turboMode ? 20 : 50);
  }
  return false;
}

let isProcessingQueue = false;

async function processTaskQueue(tasks) {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  console.log(`⚡ Processing ${tasks.length} tasks...`);

  for (const task of tasks) {
    try {
      task.children[0].click();
      await delay(config.turboMode ? 20 : 100);

      const claimBtn = document.querySelector("#claimTask");
      if (claimBtn) claimBtn.click();
      else console.warn("Claim button not found");

      if (!config.turboMode) {
        await waitAndClick("body > div.bootbox.modal.fade.bootbox-confirm.in > div > div > div.modal-footer > button.btn.btn-primary");
        await waitAndClick("body > div.bootbox.modal.fade.bootbox-alert.in > div > div > div.modal-footer > button");
        await waitAndClick("body > div.bootbox.modal.fade.bootbox-alert.in > div > div > div.modal-footer > button");
      } else {
        await delay(50); 
      }
      
      await delay(config.turboMode ? 50 : 200); 
    } catch (err) {
      console.error("Error processing task:", err);
    }
  }
  
  isProcessingQueue = false;
  console.log("⚡ Queue finished.");
}

function handleClaim() {
  const taskList = document.getElementsByClassName("ui-widget-content jqgrow ui-row-ltr");
  const validTasks = [];

  for (const task of taskList) {
    let timingString = task.children[13]?.innerText;
    if (checkTimeWithinMinutes(timingString, 4)) {
      validTasks.push(task);
    }
  }

  const limit = Math.min(validTasks.length, config.maxClaim);
  const tasksToProcess = validTasks.slice(0, limit);

  if (tasksToProcess.length > 0) {
    processTaskQueue(tasksToProcess);
  } else {
    console.log("⚠️ No recent tasks found ( < 4 mins ).");
  }
}

function handleApprove() {
  const approveBtn = document.querySelector('#submitEditPrepaidID');
  if (approveBtn) {
    approveBtn.click();
    
    if (!config.turboMode) {
      setTimeout(() => {
        const okApprove = document.querySelector('body > div.bootbox.modal.fade.bootbox-confirm.in > div > div > div.modal-footer > button.btn.btn-primary');
        if (okApprove) okApprove.click();
      }, 200);
    }
  } else {
    console.warn("Approve button not found.");
  }
}

function handleAddress() {
  const communes = document.getElementsByClassName('select2-chosen');
  if (!communes || communes.length < 2) return;

  const communeValue = communes[1].innerText;
  const addressField = document.querySelector('#address1');

  if (addressField) {
    let finalValue = communeValue
      .replace(/-/g, ' ')
      .replace(/'/g, ' ')
      .replace(/\//g, ' ')
      .replace(/é/g, 'e');

    if (COMMUNE_MAPPING[finalValue]) {
      finalValue = COMMUNE_MAPPING[finalValue];
    } else if (COMMUNE_MAPPING[addressField.value]) {
       finalValue = COMMUNE_MAPPING[addressField.value];
    }

    addressField.value = finalValue;
    console.log(`📍 Address updated: ${finalValue}`);
  }
}

function createToast(text) {
  let toast = document.getElementById('gamma-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gamma-toast';
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#222;color:#fff;padding:10px 20px;border-radius:8px;z-index:999999;font-family:sans-serif;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function rotateBase64(base64, degrees) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(degrees * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = base64;
  });
}

async function performOCR() {
  createToast('👁️ Scanning ID...');
  
  const targetIds = ['documentImageId', 'documentImageId2', 'documentImageId1', 'documentImageId3'];
  let foundImg = null;

  for (const id of targetIds) {
    const el = document.getElementById(id);
    if (el && el.src && el.src.startsWith('data:image')) {
      foundImg = el.src;
      break;
    }
  }

  if (!foundImg) {
    createToast('❌ No ID image found!');
    return;
  }

  if (!ocrWorker) {
    createToast('⚙️ Loading Engine...');
    try {
      ocrWorker = await Tesseract.createWorker('fra', 1, {
        workerPath: chrome.runtime.getURL('lib/worker.min.js'),
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: chrome.runtime.getURL('lib/tesseract-core.wasm.js')
      });
    } catch (e) {
      console.error('OCR Init Error:', e);
      createToast('❌ OCR Engine Failed');
      return;
    }
  }

  const rotations = [0, 90, 180, 270];
  let finalText = "";

  for (const deg of rotations) {
    createToast(`↻ OCR Attempt (${deg}°)...`);
    const rotatedImg = deg === 0 ? foundImg : await rotateBase64(foundImg, deg);
    
    try {
      const result = await ocrWorker.recognize(rotatedImg);
      const text = result.data.text.trim();
      
      if (text && text.length > 5) { 
        finalText = text;
        break; 
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (finalText) {
    await navigator.clipboard.writeText(finalText);
    createToast('✅ Text Copied to Clipboard!');
  } else {
    createToast('❌ OCR Failed (Too blurry?)');
  }
}

function isShortcutPressed(event, shortcutString) {
  if (!shortcutString) return false;
  
  const pressed = [];
  if (event.ctrlKey) pressed.push('Ctrl');
  if (event.altKey) pressed.push('Alt');
  if (event.shiftKey) pressed.push('Shift');
  if (event.metaKey) pressed.push('Meta');
  
  const isModifier = ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key);
  if (!isModifier) {
    let keyChar = event.key;
    if (keyChar === ' ') keyChar = 'Space';
    if (keyChar.length === 1) keyChar = keyChar.toUpperCase();
    pressed.push(keyChar);
  }

  if (shortcutString === 'Shift' && event.key === 'Shift') return true;
  if (shortcutString === 'Ctrl' && event.key === 'Control') return true;
  if (shortcutString === 'Alt' && event.key === 'Alt') return true;

  const currentString = pressed.join('+');
  return currentString === shortcutString;
}

document.addEventListener('keydown', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

  if (isShortcutPressed(event, config.claimKey)) {
    event.preventDefault();
    handleClaim();
  }

  if (isShortcutPressed(event, config.approveKey)) {
    event.preventDefault();
    handleApprove();
  }

  if (isShortcutPressed(event, config.addressKey)) {
    event.preventDefault();
    handleAddress();
  }

  if (isShortcutPressed(event, config.ocrKey)) {
    event.preventDefault();
    performOCR();
  }
});