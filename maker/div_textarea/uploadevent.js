function corcinoUploadElement(componentName, nome_file) {
  
    // Testa se o objeto é nulo e associa o evento ao formulário
    var component = controller.verifyComponent(componentName);
    
    // Obtém a DIV onde o evento será associado
    var componentDiv;
    if(component == null) { 
      componentDiv = $mainform().d;
    } else {
      componentDiv = component.div;
    }
  
  let arr = ['dragover','drop', 'onpaste'];

  // Associa o evento ao componente e define a função num array 
  var assFunction = function(e) {                 

      let f = document.getElementById(nome_file);      

      if(e.clipboardData || window.clipboardData) {
        let t = (e.clipboardData || window.clipboardData).getData('text');
        
        if(!(t.length > 0)) {
            e.preventDefault(); 
            f.files = e.clipboardData.files;
        }
      } else {
        e.preventDefault(); 
        f.files = e.dataTransfer.files;
      }
       
      
      /*if(e.clipboardData) {
      
          try {
              e.preventDefault(); 
              
              let n = e.clipboardData.files[0].name;
              f.files = e.clipboardData.files;
          } catch(except) {
              
              e.preventDefault();

              return true;
          }
          
      }
      else {
          e.preventDefault(); 
          f.files = e.dataTransfer.files;
      }*/

      if(f.files)    
        corcinoUploadOnChange(nome_file, f);

  }       

  var eventDefault = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  for(var i = 0; i < arr.length; i++) {

    // Remove o 'on' do evento
    let eventName = arr[i]; 
        let associatedFunction;
             
        if(eventName === 'dragover')          
           associatedFunction = eventDefault;
        else
           associatedFunction = assFunction;  
                       
    let startsWithOn = /^on(.+)/;
    let found = eventName.match(startsWithOn);
    if (found != null && found != -1) {
      eventName = RegExp.$1;
    }
    
    var event = overwrittenEvents.get(eventName);

    if (event != null) {
      component[event] = associatedFunction;
    } else {
      addEvent(componentDiv, eventName, associatedFunction, true);
      
      if (!componentDiv.ruleEvents) {
        componentDiv.ruleEvents = new Array();
      }
      componentDiv.ruleEvents[eventName] = associatedFunction;
    }
    
  } 
}