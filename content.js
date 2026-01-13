let config = {
  maxClaim: 30,
  claimKey: 'S',
  approveKey: '+',
  addressKey: 'Shift'
};

chrome.storage.local.get({
  maxClaim: 30,
  claimKey: 'S',
  approveKey: '+',
  addressKey: 'Shift'
}, (items) => {
  config = items;
  console.log('✅ Gamma Extension Loaded:', config);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UPDATE_CONFIG') {
    config = request.config;
    console.log('🔄 Config updated:', config);
  }
});

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
    if (el && el.offsetParent !== null) { 
      el.click();
      return true;
    }
    await delay(50);
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
      await delay(100);

      const claimBtn = document.querySelector("#claimTask");
      if (claimBtn) claimBtn.click();
      else console.warn("Claim button not found");

      await waitAndClick("body > div.bootbox.modal.fade.bootbox-confirm.in > div > div > div.modal-footer > button.btn.btn-primary");
      
      await waitAndClick("body > div.bootbox.modal.fade.bootbox-alert.in > div > div > div.modal-footer > button");
      
      await waitAndClick("body > div.bootbox.modal.fade.bootbox-alert.in > div > div > div.modal-footer > button");
      
      await delay(200); 
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
    setTimeout(() => {
      const okApprove = document.querySelector('body > div.bootbox.modal.fade.bootbox-confirm.in > div > div > div.modal-footer > button.btn.btn-primary');
      if (okApprove) okApprove.click();
    }, 200);
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
});