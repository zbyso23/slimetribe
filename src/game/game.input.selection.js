/* Game surfaces are controls, never selectable text. Preserve native editor fields. */
(function(){
const editable=target=>!!target?.closest?.('input,textarea,select,[contenteditable="true"],[contenteditable=""]');
function preventSelection(e){if(!editable(e.target))e.preventDefault()}
window.addEventListener('selectstart',preventSelection,{capture:true});
window.addEventListener('contextmenu',preventSelection,{capture:true});
})();
