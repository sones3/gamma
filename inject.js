(function() {
  function safeOverride() {
    try {
      if (typeof window.showInitialActivationDocument === 'function' && !window.__gammaMultiViewInjected) {
        window.__gammaMultiViewInjected = true;
        const original = window.showInitialActivationDocument;
        
        console.log('🖼️ Gamma Multi-View: Overriding showInitialActivationDocument...');

        window.showInitialActivationDocument = function () {
          documentViewCount=1;
          $("#showImageDivId").css('display','none');
          $("#documentsDivId").css('display','');
          $("#documentsMenuDivId").css('display','');
          
          var activation_data = response.interface;
          var document_data = null;
          
          var data_value = typeof findActivationTab === 'function' ? findActivationTab() : null;
          
          if(data_value == "re_processed_data" && activation_data.reprocess_data)
            document_data = activation_data.reprocess_data;
          else if(data_value == "approval_data" && activation_data.approval_data)
            document_data = activation_data.approval_data;
          else
            document_data = activation_data.order_data;
          
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
            
            if (typeof enableDisableListOfDocuments === 'function') {
              enableDisableListOfDocuments(document_details);
            }
            
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
                } else {
                   $('#documentImageId2').hide();
                }

                if(fileObj2?.file) {
                   $('#documentImageId3').attr('src', 'data:image/png;base64,'+fileObj2.file);
                   $('#documentImageId3').show();
                } else {
                   $('#documentImageId3').hide();
                }
                
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
        if (!window.__gammaMultiViewInjected) {
           setTimeout(safeOverride, 500);
        }
      }
    } catch (err) {
      console.error('Gamma Override Error:', err);
    }
  }
  
  safeOverride();
  
  window.addEventListener('load', safeOverride);
})();