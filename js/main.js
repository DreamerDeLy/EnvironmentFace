import * as u from "./utils.js";

var info_loaded = false;

function parseInfo(fileStr)
{
	console.log("parse info");

	try {
		var dataJson = JSON.parse(fileStr);
	} catch (error) {
		console.error("info parse");
		window.alert("ERROR: Failed to load info!");
		return;
	}

	if (dataJson == null)
	{
		console.error("info parse null");
		return;
	}

	info_loaded = true;
	
	var elements = document.querySelectorAll("[data-replace]");

	for (let e of elements)
	{
		// Replace placeholder with actual data
		e.innerHTML = u.convertLineBreaks(u.esc(dataJson[e.getAttribute("data-replace")]));
	}

	var depends_on_hardware = document.querySelectorAll("[hardware]");

	for (let e of depends_on_hardware)
	{
		if (dataJson["hardware"].includes(e.getAttribute("hardware")) == false)
		{
			e.classList.add("hide");
		}
		else
		{
			e.classList.remove("hide");
		}
	}

	var status_icons = u.getE("status-icons");

	// Clear 
	status_icons.innerHTML = "";

	if (dataJson["wifi-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/wifi_" + dataJson["wifi-status"] + ".svg";

		if (dataJson["wifi-status"] == "off") i.classList.add("off");
		
		status_icons.appendChild(i);
	}

	if (dataJson["ethernet-status"] != null)
	{
		const i = document.createElement('img');
		i.src = "images/ethernet.svg";

		if (dataJson["ethernet-status"] == "off") i.classList.add("off");

		status_icons.appendChild(i);
	}

	var sensors_list = u.getE("sensors_list");

	// Clear 
	sensors_list.innerHTML = "";

	console.log(dataJson["sensors-status"]);

	for (const [key, value] of Object.entries(dataJson["sensors-status"])) {
		// Skip disabled sensors
		if (value == -1) continue;

		var s = document.createElement("span");

		var status_colors = {
			"0": "level-3", // Error
			"1": "level-1", // OK
			"2": "level-2", // Warning
		}

		s.classList.add(status_colors[value]);

		s.innerHTML = key;
		sensors_list.appendChild(s)	
	}

	// Show Custom API's settings
	if (dataJson["private-apis-allowed"] == true)
	{
		u.getE("private_apis_blocked").classList.add("hide");
		u.getE("private_apis").classList.remove("hide");
	}

	// If user have to login
	if (dataJson["user-logged"] == false)
	{
		// Redirect
		window.location.assign("/login");
	}

	// If station was offline, hide banner
	hideLoading();
}

// Load info
function loadInfo() {
	u.getFile("/data/info.json",
		parseInfo,
		2000,
		"GET",
		function () {
			// Show message that station is offline
			showOfflineLoading();
		}, function () {
			// Show message that station is offline
			showOfflineLoading();
		}
	);
}

// Menu buttons
var menu_items = [
	u.getE("m_station"),
	u.getE("m_home"),
	u.getE("m_settings")
]

// Menu buttons onclick
function menuSetOnClick() {
	menu_items.forEach(e => {
		e.onclick = () => {
			changePage((e.id).toString().substring(2));
		}
	})
}

// Add copying to clipboard for station info elements
u.getE("station_info").childNodes.forEach(n => {
	if (n.lastChild != null)
	{
		n.lastChild.onclick = () => {
			// Copy the text inside the text field
			navigator.clipboard.writeText(n.lastChild.innerText);
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
		u.getE("home_page"),
		u.getE("station_page"),
		u.getE("settings_page")
	]

	// No need in changing page
	if (current_page == page) return;

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
			u.getE("save_settings").scrollIntoView();

			// Cancel page change
			return;
		}
		else
		{
			// Load settings to avoid loading when user on page next time
			loadSettings();
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

var settings_unsaved = false;
var settings_inputs = u.getE("settings_page").querySelectorAll("input, select");

// Check id there is unsaved changes in inputs
function addSettingsUnsavedCheck() {
	for (let i of settings_inputs) {
		i.onchange = (e) => {
			settings_unsaved = true;
			if (i.getAttribute("master") != null) setAllDependents(i, i.checked);
		}
	}
}

// Save settings
u.getE("save_settings").onclick = (e) => {
	var new_settings = {};

	for (let i of settings_inputs)
	{
		if (i.type == "checkbox") 
		{
			new_settings[i.name] = i.checked;
		}
		else if (i.type == "text" || i.type == "password" || i.type == "select-one")
		{
			new_settings[i.name] = i.value;
		}
	}

	console.log("New settings");
	console.log(new_settings);

	if (new_settings["www_auth"] == true && new_settings["www_user"] == "") 
	{
		window.alert("User field have to be filled!");
		return;
	}

	if (u.saveSettings(new_settings, "user"))
	{
		window.alert("Settings saved successfully!");
		settings_unsaved = false;
	}
	else
	{
		window.alert("ERROR: Settings NOT SAVED due to error!");
	}
}

// Load current settings and setup inputs
function loadSettings()
{
	u.getFile("/data/settings_user.json",
		parseSettings,
		2000,
		"GET",
		function () {
			u.getFile("/data/settings_user.json", parseSettings);
		}, function () {
			u.getFile("/data/settings_user.json", parseSettings);
		}
	);
}

// Load settings from JSON and setup inputs
function parseSettings(settings_json)
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
			else if (i.name == "wlan_ssid")
			{
				// If networks not loaded
				if (i.innerHTML == "")
				{
					// Create default option
					var o = document.createElement("option");
					o.value = s;
					o.innerText = (s == "" ? "not selected" : s);
					o.id = "wlan_ssid_current";
					i.appendChild(o);

					// Load WiFi networks
					setTimeout(() => { loadWiFiNetworks(); }, 200); 
				} 

				// Set value
				i.value = s;
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

// Load WiFi networks
function parseWiFiNetworks(json)
{
	try {
		var networks = JSON.parse(json);
	} catch (error) {
		console.error("wifi networks parse");
		return;
	}

	console.log(networks);

	// Get WiFi select box
	var select = u.getE("wlan_ssid");

	// If current network exist in list
	if (networks.findIndex((e)=>{ return e.ssid == select.value; }) > -1)
	{
		// Delete all options
		select.innerHTML = "";
	}
	else 
	{
		// Delete only loaded options
		var options = select.querySelectorAll("option:not(#wlan_ssid_current)");
		for (var o of options) select.removeChild(o);
	}

	for (var n of networks)
	{
		// Create option
		var o = document.createElement("option");
		o.innerHTML = "<b>" + n.ssid + "</b> " + (n.encryption > 0 ? "&#128274;" : "") + " (" + n.quality + "%)";
		o.value = n.ssid;

		select.appendChild(o);
	}
}

// Load WiFi networks for settings page
function loadWiFiNetworks()
{
	u.getFile("/data/wifi_networks.json",
		parseWiFiNetworks,
		2000,
		"GET",
		function () {
			u.getFile("/data/wifi_networks.json", parseWiFiNetworks);
		}, function () {
			u.getFile("/data/wifi_networks.json", parseWiFiNetworks);
		}
	);
}

// Setup all inputs that depends on `e`
function setAllDependents(e, state)
{
	var p = e.parentNode.parentNode;
	var matches = document.querySelectorAll("input, select");

	for (let m of matches)
	{
		if (p.contains(m) && m != e)
		{
			m.disabled = !state;
		}
	}
}

// Set keypress events for inputs
function setInputsEnter()
{
	var panels = document.querySelectorAll(".panel");

	for (let p of panels)
	{
		let inputs = p.querySelectorAll("input[type='text'], input[type='password'], input[type='number']");

		for (let i = 0; i < inputs.length; i++)
		{
			inputs[i].addEventListener("keypress", e => {
				if (e.key === "Enter") {
					if (inputs[i+1] != null) inputs[i+1].focus();
				}
			});
		}
	}
}

// Hide loading screen
function hideLoading() {
	var delay_time = 2000;
	setTimeout(() => { u.getE("loading").style.opacity = "0"; }, delay_time)
	setTimeout(() => { 
		u.getE("loading").style.display = "none"; 
		u.getE("offline_text").style = "display: block";
	}, delay_time + 500)
}

// Show loading screen with offline text
function showOfflineLoading() {
	u.getE("offline_text").style = "";
	u.getE("loading").style.display = "flex";
	setTimeout(() => { u.getE("loading").style.opacity = "1"; }, 100)
}

var dom_loaded = false;

// Hide loading screen when DOM processing by JS finished
window.addEventListener('DOMContentLoaded', () => {
	console.log('DOM fully loaded and parsed');
	dom_loaded = true;
});


// Set menu buttons
menuSetOnClick();

// Add settings check 
addSettingsUnsavedCheck();

// Add enter key press handlers
setInputsEnter();

// Load settings first time
loadSettings();

// Detect page and switch to 
detectPage();

// Loading info
setTimeout(() => { 
	
	// Load info first time
	loadInfo() 

	// Add continuous loading of info
	setInterval(() => { loadInfo() }, 5000);

}, 500);

// Hide loading when DOM loaded and info parsed
var start_check_timer = setTimeout(() => {
	if (dom_loaded && info_loaded)
	{
		clearInterval(start_check_timer);
		hideLoading();
	}
}, 1000);