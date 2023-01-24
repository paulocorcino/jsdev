function corcinoUploadSend(nome, ruleName) {

    if(isNullable(ruleName) || isNullable(nome))
		return;

    if(!Array.isArray(nome) && document.getElementById(nome).files.length == 0) 
        return;
        
    if(Array.isArray(nome))
        if(nome.length < 4)
            return;

    let params = "";
    if (arguments.length > 3) {
        for (var i = 3; i < arguments.length; i++) {
        params += ("&P_" + (i - 3) + "=" + URLEncode(arguments[i], "GET"));
        }
    }

    var pageURL = getAbsolutContextPath();
    pageURL += ("uploadFile.do?sys=" + sysCode + "&formID=" + idForm + "&ruleName=" + URLEncode(ruleName, "GET") + params);
	
	let formData = new FormData();

    if(Array.isArray(nome)) {
        formData.append('upload', nome[3], nome[0]);
    } else {
        let f = document.getElementById(nome);
        formData.append('upload', f.files[0], f.files[0].name);
    }

    let response = fetch(pageURL, {
        method: 'POST'
        ,body: formData      
        ,credentials: 'same-origin'
    }).then(async function(response) {      

		  if(response.ok)
		  {

            const regex = /\{([^}]+)\}/gm;
            let codes;
            const str = await response.text();   
            let m;

            while ((m = regex.exec(str)) !== null) {

                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                codes = m[1];
                break;
            }

            if(codes) {
                try {
                    eval(codes);                    
                } catch(e) {
                    throw new Error('Error: ' + e.message);
                }
            }            
            return;            	       
 		  } else {          
            throw new Error('Error');		  
          }
		  
	})  
	.then(function(text) {                          
		console.log('Request successful', text);  
	})  
	.catch(function(error) { 
		console.log('Request failed', error);
	});  

}