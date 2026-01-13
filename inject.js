(function() {
  function safeOverride() {
    try {
      if (typeof window.showInitialActivationDocument === 'function' && !window.__gammaMultiViewInjected) {
        window.__gammaMultiViewInjected = true;
        
        window.showInitialActivationDocument = function () {
          documentViewCount=1;
          $("#showImageDivId").css('display','none');
          $("#documentsDivId").css('display','');
          $("#documentsMenuDivId").css('display','');
          
          var activation_data = response.interface;
          var document_data = null;
          var data_value = typeof findActivationTab === 'function' ? findActivationTab() : null;
          
          if(data_value == "re_processed_data" && activation_data.reprocess_data) document_data = activation_data.reprocess_data;
          else if(data_value == "approval_data" && activation_data.approval_data) document_data = activation_data.approval_data;
          else document_data = activation_data.order_data;
          
          if (!document_data) return;

          var document_details = null;
          if(document_data.document_details) {
            document_details = Array.isArray(document_data.document_details) ? 
              document_data.document_details[0] : document_data.document_details;
          }

          if(document_details) {
            $("#idProofRdBtn").prop('checked', true);
            $("#idProofFrontRdBtn").prop('checked', true);
            $('#idProofFandBdiv').css("display","");
            $('#controls').css("display","");
            $('#cafPreviewDiv').css("display","none");
            $('#img-preview').css("display","");
            
            if (typeof enableDisableListOfDocuments === 'function') enableDisableListOfDocuments(document_details);
            
            if(document_details.id_front) {
              const img = document.getElementById('documentImageId');
              if (img && !document.getElementById('documentImageId2')) {
                const clone = img.cloneNode(true);
                clone.id = 'documentImageId2';
                clone.style.marginTop = '10px';
                clone.style.border = '2px solid #4b8bf4';
                
                const clone2 = img.cloneNode(true);
                clone2.id = 'documentImageId3';
                clone2.style.marginTop = '10px';
                clone2.style.border = '2px solid #e05c4b';
  
                img.parentNode.insertBefore(clone2, img.nextSibling);
                img.parentNode.insertBefore(clone, img.nextSibling);
              }

              var file_id = document_details.id_front;
              var file_id2 = document_details.signature;
              var file_id3 = document_details.id_back;
              
              if (typeof getFileDataByFileId === 'function') {
                var fileObj = getFileDataByFileId(file_id);
                var fileObj2 = getFileDataByFileId(file_id2);
                var fileObj3 = getFileDataByFileId(file_id3);

                if(fileObj?.file) $('#documentImageId').attr('src', 'data:image/png;base64,'+fileObj.file);
                
                if(fileObj3?.file) {
                   $('#documentImageId2').attr('src', 'data:image/png;base64,'+fileObj3.file);
                   $('#documentImageId2').show();
                } else { $('#documentImageId2').hide(); }

                if(fileObj2?.file) {
                   $('#documentImageId3').attr('src', 'data:image/png;base64,'+fileObj2.file);
                   $('#documentImageId3').show();
                } else { $('#documentImageId3').hide(); }
                
                $("#idProofFrontRdBtn").attr('data_file_id', file_id);
              }
            } else {
              $('#documentImageId').attr('src',"");
              if(window.bootbox && window.bootbox.alert) window.bootbox.alert("ID Front Not Available");
            }
          }
        };
        console.log('🖼️ Gamma Multi-View: Override successful');
      } else {
        if (!window.__gammaMultiViewInjected) setTimeout(safeOverride, 500);
      }
    } catch (err) {
      console.error('Gamma Override Error:', err);
    }
  }
  
  safeOverride();
  window.addEventListener('load', safeOverride);

  function isFresh(dateStr) {
    if (!dateStr) return false;
    const [d, t] = dateStr.trim().split(" ");
    if (!d || !t) return false;
    const [day, month, year] = d.split("-").map(Number);
    const [hour, minute] = t.split(":").map(Number);
    const rowDate = new Date(year, month - 1, day, hour, minute);
    return (Date.now() - rowDate.getTime()) <= 6 * 60 * 1000;
  }

  function gammaReloadGrid() {
    if (window.$ && window.$.fn && window.$.fn.trigger) {
      try {
        $("#list_globalTaskTransactionGrid_cs").trigger("reloadGrid");
      } catch(e) {}
    }
  }

  function gammaClaimFast() {
    if (!window.assignOrClaimTaskCS) return;

    for (let i = 1; i <= 50; i++) {
      const row = document.getElementById(String(i));
      if (!row) continue;

      try {
        const id = Number(row.cells[1]?.innerText);
        const time = row.cells[13]?.innerText;

        if (id && isFresh(time)) {
          console.log(`⚡ Claiming Task ${id} (${time})...`);
          
          window.selectedtransIds = [id];
          window.assignOrClaimTaskCS({ transaction_ids: [id] }, "claim");
          
          return true;
        }
      } catch(e) {}
    }
    return false;
  }

  function activateTurboMode() {
    if (window.bootbox) {
      window.bootbox.alert = function() { console.log('🚀 Auto-Bot: Alert blocked'); };
      window.bootbox.confirm = function(msg, cb) { if(cb) cb(true); };
      console.log('🔥 Auto-Bot: Alerts neutralized (CSP-Safe).');
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data.type === 'GAMMA_RELOAD_GRID') {
      gammaReloadGrid();
    } else if (event.data.type === 'GAMMA_CLAIM_FAST') {
      gammaClaimFast();
    } else if (event.data.type === 'GAMMA_TURBO_MODE') {
      activateTurboMode();
    }
  });

  console.log('🤖 Gamma Auto-Bot functions loaded & Listening');

})();