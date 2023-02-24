
export function getE(name) {
	return document.getElementById(name);
}

export function esc(str) {
	if(str){
		return str.toString()
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\"/g, '&quot;')
			.replace(/\'/g, '&#39;')
			.replace(/\//g, '&#x2F;');
	}
	return "";
}

export function convertLineBreaks(str){
	if(str){
		str = str.toString();
		str = str.replace(/(?:\r\n|\r|\n)/g,'<br>');
		return str;
	}
	return "";
}

export function getFile(adr, callback, timeout, method, onTimeout, onError){
	/* fallback stuff */
	if(adr === undefined) return;
	if(callback === undefined) callback = function(){};
	if(timeout === undefined) timeout = 8000; 
	if(method === undefined) method = "GET";
	if(onTimeout === undefined) {
		onTimeout = function(){
			console.error("ERROR: timeout loading file "+adr);
		};
	}
	if(onError === undefined){
		onError = function(){
			console.error("ERROR: loading file: "+adr);
		};
	}
	
	/* create request */
	var request = new XMLHttpRequest();
	
	/* set parameter for request */
	request.open(method, encodeURI(adr), true);
	request.timeout = timeout;
	request.ontimeout = onTimeout;
    request.onerror = onError;
	request.overrideMimeType("application/json");
	
	request.onreadystatechange = function() {
		if(this.readyState == 4){
			if(this.status == 200){
				callback(this.responseText);
			}
		}
	};
	
	/* send request */
	request.send();
	
	console.log("getFile: " + adr);
}

export function saveSettings(json) 
{
	var url = window.location.origin + "/settings";

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url);
	xhr.setRequestHeader("Accept", "application/json");
	xhr.setRequestHeader("Content-Type", "application/json");

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
			
			return (xhr.status >= 200 && xhr.status < 300);
		}
	};

	console.log("Sending new settings to " + url);

	xhr.send(json);
}

var xhr = null;

function getXmlHttpRequestObject() {
	if (!xhr) {
		// Create a new XMLHttpRequest object 
		xhr = new XMLHttpRequest();
	}
	return xhr;
};

export function getLiveData(event_handler, file_name) {
	var now = new Date();

	// Date string is appended as a query with live data 
	// for not to use the cached version
	var url = 'data/' + file_name + '.json?' + now.getTime();

	console.log("getting live data from " + file_name);

	xhr = getXmlHttpRequestObject();
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				event_handler(xhr.responseText);
			} else {
				console.error("ERROR: request failed");
				console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"\n");
			}
		}
	};

	xhr.open("GET", url, true);
	xhr.send(null);
};

export function clearTable(table) {
	var child = table.lastElementChild; 
    while (child) {
        table.removeChild(child);
        child = table.lastElementChild;
    }
}