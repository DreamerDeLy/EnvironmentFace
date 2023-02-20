
function getE(name) {
	return document.getElementById(name);
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
		window.alert("ERROR: Failed to load data!");
		return;
	}
	
	var elements = document.querySelectorAll("[data-replace]");

	for (let e of elements)
	{
		// Replace placeholder with actual data
		e.innerHTML = convertLineBreaks(esc(dataJson[e.getAttribute("data-replace")]));
	}

	var status_icons = getE("status-icons");

	if (dataJson["wifi-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/wifi_" + dataJson["wifi-status"] + ".svg";

		if (dataJson["wifi-status"] == "off") i.classList.add("off");
		
		status_icons.appendChild(i);
	}
	
	if (dataJson["ap-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/ap.svg";
		
		if (dataJson["ap-status"] == "off") i.classList.add("off");
		
		status_icons.appendChild(i);
	}

	if (dataJson["ethernet-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/ethernet.svg";

		if (dataJson["ethernet-status"] == "off") i.classList.add("off");

		status_icons.appendChild(i);
	}

	var sensors_list = getE("sensors_list");

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
		sensors_list.appendChild(s)	
	}
}

// Load data
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

// Menu buttons
var menu_items = [
	getE("m_station"),
	getE("m_home"),
	getE("m_settings")
]

// Menu buttons onclick
function menuSetOnClick() {
	menu_items.forEach(e => {
		e.onclick = () => {
			changePage((e.id).toString().substring(2));
		}
	})
}

menuSetOnClick();

// Add copying to clipboard for station info elements
getE("station_info").childNodes.forEach(n => {
	if (n.lastChild != null)
	{
		n.lastChild.onclick = (e) => {
			// Copy the text inside the text field
			navigator.clipboard.writeText(e.srcElement.innerText);
			window.alert("Copied to clipboard!");
		}
	}
})

// Set buttons selected property according to current page
function menuStatusSet(page)
{
	menu_items.forEach(e => {
		if (e.id == "m_" + page)
		{
			e.classList.add("selected");
		}
		else
		{
			e.classList.remove("selected");
		}
	})
}

// Change first letter of string to uppercase
function firstLetterHigh(string)
{
	return string[0].toUpperCase() + string.substring(1);
}

var current_page;

function changePage(page) {
	var pages = [
		getE("home_page"),
		getE("station_page"),
		getE("settings_page")
	]

	// Check if page exist
	if (pages.find(e => { return e.id == (page + "_page") }) == undefined)
	{
		console.warn("page \"" + page + "\" does not exist");
		changePage("home");
		return;
	}

	// Check if there is unsaved changes on settings page
	if (current_page == "settings" && settings_unsaved)
	{
		if (!confirm("Current settings are not saved. Are you sure you want to leave the page?")) 
		{
			// Scroll to save button
			getE("save_settings").scrollIntoView();

			// Cancel page change
			return;
		}
	}

	// Load settings to settings inputs
	if (page == "settings")
	{
		loadSettings();
		settings_unsaved = false;
	}

	// Update current page
	current_page = page;
	
	// Show page
	console.log("set page to " + page);
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

	// Set address bar 
	history.replaceState(null, "", window.location.origin + "?page=" + page);
	document.title = firstLetterHigh(page) + " | EnvOS";

	// Set active menu button
	menuStatusSet(page);
}

function detectPage()
{
	// Get URL parameters
	const urlParams = new URLSearchParams(window.location.search);

	// Get 'page' parameter
	if (urlParams.has("page"))
	{
		changePage(urlParams.get("page"));
	}
	else if (urlParams.entries.length == 0)
	{
		// If there is no parameters, change page to home
		changePage("home")
	}
}

detectPage();

var settings_unsaved = false;
var settings_inputs = document.getElementsByTagName("input");

// Check id there is unsaved changes in inputs
function addSettingsUnsavedCheck() {
	for (let i of settings_inputs) {
		i.onchange = (e) => {
			settings_unsaved = true;
			if (i.getAttribute("master") != null) setAllDependents(i, i.checked);
		}
	}
}

addSettingsUnsavedCheck();

// Save settings
getE("save_settings").onclick = (e) => {
	var new_settings = {};

	for (let i of settings_inputs)
	{
		if (i.type == "checkbox") 
		{
			new_settings[i.name] = i.checked;
		}
		else if (i.type == "text" || i.type == "password")
		{
			new_settings[i.name] = i.value;
		}
	}

	console.log("New settings");
	console.log(new_settings);

	var url = window.location.origin + "/settings";

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url);
	xhr.setRequestHeader("Accept", "application/json");
	xhr.setRequestHeader("Content-Type", "application/json");

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
			
			if (xhr.status >= 200 && xhr.status < 300)
			{
				window.alert("Settings saved successfully!");
				settings_unsaved = false;
			}
			else
			{
				window.alert("ERROR: Settings NOT SAVED due to error!");
			}
		}
	};

	console.log("Sending new settings to " + url);

	xhr.send(new_settings);
}

// Load current settings and setup inputs
function loadSettings()
{
	getFile("/data/settings.json",
		loadSettingsFromJSON,
		2000,
		"GET",
		function () {
			getFile("/data/settings.json", loadSettingsFromJSON);
		}, function () {
			getFile("/data/settings.json", loadSettingsFromJSON);
		}
	);
}

// Load settings from JSON and setup inputs
function loadSettingsFromJSON(settings_json)
{
	try {
		var settings = JSON.parse(settings_json);
	} catch (error) {
		console.error("settings parse");
		window.alert("ERROR: Settings loading error!");

		changePage("home");
		return;
	}

	console.log("Loading current settings...");
	console.log(settings);

	for (let i of settings_inputs)
	{
		// Get setting
		var s = settings[i.name];

		// If setting exist
		if (s != null) 
		{
			if (i.type == "checkbox")
			{
				// Set checked status
				i.checked = s;

				// Set `disable` status of all dependent inputs
				if (i.getAttribute("master") != null) setAllDependents(i, i.checked);
			}
			else
			{
				// Set text
				i.value = s;
			}
		}
		else
		{
			// Hide settings that isn't exist in settings
			i.parentNode.style = "display: none;"
		}
	}
}

// Load settings first time
loadSettings();

// Setup all inputs that depends on `e`
function setAllDependents(e, state)
{
	var p = e.parentNode;

	var s = p.nextElementSibling;
	while (s) {
		s.disabled = !state;
		s = s.nextElementSibling;
	}
}


// Hide loading screen
function hideLoading() {
	setTimeout(() => { getE("loading").style.opacity = "0"; }, 1000)
	setTimeout(() => { getE("loading").style.display = "none"; }, 1500)
}

// Hide loading screen when DOM processing by JS finished
window.addEventListener('DOMContentLoaded', (event) => {
	console.log('DOM fully loaded and parsed');
	hideLoading();
});