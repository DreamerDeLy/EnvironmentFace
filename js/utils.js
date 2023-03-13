
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

export function saveSettings(json, type) 
{
	var url = "/data/settings_" + type + ".json";

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, /*async: */ false); // TODO: synchronous requests are deprecated and this approach can cause problems
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	console.log("Sending new settings to " + url);

	xhr.send("data="+encodeURIComponent(JSON.stringify(json)));

	console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
			
	return (xhr.status >= 200 && xhr.status < 300);
}

export function getLiveData(event_handler, file_name) {
	var now = new Date();

	// Date string is appended as a query with live data 
	// for not to use the cached version
	var url = "data/" + file_name + ".json?" + now.getTime();

	console.log("getting live data from " + file_name);

	var xhr = new XMLHttpRequest();
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

export function sendCommand(cmd) {
	let xhr = new XMLHttpRequest();
	xhr.open("POST", "/run");
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
			
			if (xhr.status == 200)
			{
				console.log("Command send successfully");
			}
		}
	};

	xhr.send("command="+encodeURIComponent(cmd));
}