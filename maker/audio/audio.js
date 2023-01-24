var audio_gumStream; 
var audio_rec; 
var audio_input; 
var AudioRecordBlob;

function AudioInit() {
    if(hasAudioDevice) {
        const AudioContext = AudioContext = window.AudioContext || window.webkitAudioContext;
        AudioRecordBlob = new Array();
    }
}

function AudioExecFlow(ruleName, actions, ruleParams) {
    //exec flow
    if(ruleName) {

        var system = ($mainform().d.WFRForm ? $mainform().d.WFRForm.sys.value : $mainform().sysCode);
        var formID = ($mainform().d.WFRForm ? $mainform().d.WFRForm.formID.value : "");
        let params = new Array();
        
        params.push(system);
        params.push(formID);
        params.push(ruleName);
        if (!isNullable(ruleParams)) {
            ruleParams[0] = actions;
            params.push(ruleParams);
        }else {
            ruleParams = new Array();
            ruleParams[0] = actions;
            params.push(ruleParams);
        }
        
        timeout(executeJSRuleNoField, 500, params);
    }
}

function AudioStartRecording(ruleName, ruleParams) {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: {
        echoCancellation: false,
        noiseSuppression: true,
    } , video:false }


	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {

        var audioContext;

		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		audioContext = new AudioContext();

		AudioRecordBlob = undefined;
		AudioRecordBlob = new Array();
        //console.log(audioContext);

		//update the format 
		/* document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz" */

		/*  assign to audio_gumStream for later use  */
		audio_gumStream = stream;
        //console.log(audio_gumStream);
		
		/* use the stream */
		audio_input = audioContext.createMediaStreamSource(stream);
        //console.log(audio_input);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		//audio_rec = new Recorder(audio_input,{numChannels:1});
        audio_rec = new MediaRecorder(stream);
        audio_rec.ondataavailable = AudioAddDataToArray;
        audio_rec.start();

		//start the recording process
		//audio_rec.record();

		console.log("Recording started");
        AudioExecFlow(ruleName, 'record', ruleParams);


	}).catch(function(err) {
        console.log("Error:" + err);
        AudioExecFlow(ruleName, 'error', ruleParams);
	});
}

var AudioAddDataToArray = function(event){
        
    if(event.data.size > 0){

        let AudioblobArray = [];        
        AudioblobArray.push(event.data);

        AudioCreateDownload(new Blob(AudioblobArray, {
            type: 'audio/webm; codecs=opus'
        }));
    }
}

function AudioPauseRecording(ruleName, ruleParams){
	console.log("pauseButton clicked rec.recording=",audio_rec.recording );
	if (audio_rec.recording){
		//pause
		audio_rec.pause();
		//pauseButton.innerHTML="Resume";
        AudioExecFlow(ruleName, 'pause', ruleParams);
	}else{
		//resume
		audio_rec.resume()
		//pauseButton.innerHTML="Pause";
        AudioExecFlow(ruleName, 'resume', ruleParams);

	}
}

function AudioStopRecording(ruleName, ruleParams) {
	console.log("stopButton clicked");

	//tell the recorder to stop the recording
	audio_rec.stop();

	//stop microphone access
	audio_gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	audio_rec = null;
    
    AudioExecFlow(ruleName, 'stop', ruleParams);
}

function AudioCreateDownload(blob) {
       
    AudioRecordBlob[0] = new Date().toISOString();
    AudioRecordBlob[0] = AudioRecordBlob[0] + ".wav";
    AudioRecordBlob[1] = blob;
    
}

function AudioGetBlob() {
    return AudioRecordBlob;
}

function AudioExist() {
	
	if(AudioRecordBlob) {
		if(Array.isArray(AudioRecordBlob)) {
			if(AudioRecordBlob.length >= 2)
				return true;
		}
	}

	return false;
}

function AudioShowController(component) {
    if(component) {
        var AudioURL = window.URL || window.webkitURL;
        var url = AudioURL.createObjectURL(AudioRecordBlob[1]);
        var au = document.createElement('audio');
        var comp = document.getElementById(component);
        au.controls = true;
        au.src = url;

        comp.replaceChildren();
        comp.appendChild(au);
    }

}

function corcinoUploadBlobSend(blob, filename, ruleName) {

    if(isNullable(ruleName) || isNullable(filename) || isNullable(blob))
		return;

    let params = "";
    if (arguments.length > 2) {
        for (var i = 2; i < arguments.length; i++) {
        params += ("&P_" + (i - 2) + "=" + URLEncode(arguments[i], "GET"));
        }
    }

    var pageURL = getAbsolutContextPath();
    pageURL += ("uploadFile.do?sys=" + sysCode + "&formID=" + idForm + "&ruleName=" + URLEncode(ruleName, "GET") + params);
	
	let formData = new FormData();

	let n = filename;
	n = n.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 

	formData.append('upload', blob, n);    

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

function AudioCreateDownloadLink(blob) {
	
	var url = AudioURL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "Save to disk";

	//add the new audio element to li
	li.appendChild(au);
	
	//add the filename to the li
	li.appendChild(document.createTextNode(filename+".wav "))

	//add the save to disk link to li
	li.appendChild(link);
	
	//upload link
	var upload = document.createElement('a');
	upload.href="#";
	upload.innerHTML = "Upload";
	upload.addEventListener("click", function(event){
		  var xhr=new XMLHttpRequest();
		  xhr.onload=function(e) {
		      if(this.readyState === 4) {
		          console.log("Server returned: ",e.target.responseText);
		      }
		  };
		  var fd=new FormData();
		  fd.append("audio_data",blob, filename);
		  xhr.open("POST","upload.php",true);
		  xhr.send(fd);
	})
	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li

	//add the li element to the ol
	recordingsList.appendChild(li);
}