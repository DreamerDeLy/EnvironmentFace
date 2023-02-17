
function getE(name) {
	return document.getElementById(name);
}

function hideLoading() {
	setTimeout(() => { getE("loading").style.opacity = "0"; }, 1000)
	setTimeout(() => { getE("loading").style.display = "none"; }, 1500)
}

function esc(str) {
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

function convertLineBreaks(str){
	if(str){
		str = str.toString();
		str = str.replace(/(?:\r\n|\r|\n)/g,'<br>');
		return str;
	}
	return "";
}

function getFile(adr, callback, timeout, method, onTimeout, onError){
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

function parseData(fileStr)
{
	console.log("parse data");

	try {
		var dataJson = JSON.parse(fileStr);
	} catch (error) {
		console.error("info parse");
		return;
	}
	
	var elements = document.querySelectorAll("[data-replace]");

	for (i = 0; i < elements.length; i++) 
	{
		var element = elements[i];
		element.innerHTML = convertLineBreaks(esc(dataJson[element.getAttribute("data-replace")]));
	}

	var si = getE("status-icons");

	if (dataJson["wifi-status"] != null)
	{
		// let w = getE("wifi_s");
		// w.src = "images/wifi_" + dataJson["wifi-status"] + ".svg";
		// if(dataJson["wifi-status"] != "off") w.classList.remove("off");

		const i = document.createElement('img');
		i.src = "images/wifi_" + dataJson["wifi-status"] + ".svg";

		if (dataJson["wifi-status"] == "off") i.classList.add("off");
		
		si.appendChild(i);
	}
	
	if (dataJson["ap-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/ap.svg";
		
		if (dataJson["ap-status"] == "off") i.classList.add("off");
		
		si.appendChild(i);
	}

	if (dataJson["ethernet-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/ethernet.svg";

		if (dataJson["ethernet-status"] == "off") i.classList.add("off");

		si.appendChild(i);
	}

	var sl = getE("sensors_list");

	console.log(dataJson["sensors-status"]);

	for (const [key, value] of Object.entries(dataJson["sensors-status"])) {
		var s = document.createElement("span");

		var status_colors = {
			"0": "level-4",
			"1": "level-1",
			"2": "level-3",
		}

		s.classList.add(status_colors[value]);

		s.innerHTML = key;
		sl.appendChild(s)	
	}

	// if (typeof load !== 'undefined') load();
}

getFile("/data/info.json",
	parseData,
	2000,
	"GET",
	function () {
		getFile("/data/info.json", parseData);
	}, function () {
		getFile("/data/info.json", parseData);
	}
);

var page = "home"

function menuButtons() {
	var menu_items = [
		getE("m_station"),
		getE("m_home"),
		getE("m_settings")
	]

	menu_items.forEach(e => {
		e.onclick = () => {
			page = (e.id).toString().substring(2);
			console.log("set page to " + page);

			menu_items.forEach(a => {a.classList.remove("selected");})
			e.classList.add("selected");

			changePage();
		}
	})
}

function changePage() {
	var pages = [
		getE("home_page"),
		getE("station_page"),
		getE("settings_page")
	]

	pages.forEach(e => {
		if (e.id == (page + "_page")) 
		{
			e.classList.remove("hide");
		}
		else
		{
			e.classList.add("hide");
		}
	})
}

menuButtons();

window.addEventListener('DOMContentLoaded', (event) => {
	console.log('DOM fully loaded and parsed');
	hideLoading();
});