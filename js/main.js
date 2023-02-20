import * as u from "./utils.js";

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
		e.innerHTML = u.convertLineBreaks(u.esc(dataJson[e.getAttribute("data-replace")]));
	}

	var status_icons = u.getE("status-icons");

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

	var sensors_list = u.getE("sensors_list");

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
u.getFile("/data/info.json",
	parseData,
	2000,
	"GET",
	function () {
		u.getFile("/data/info.json", parseData);
	}, function () {
		u.getFile("/data/info.json", parseData);
	}
);

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

menuSetOnClick();

// Add copying to clipboard for station info elements
u.getE("station_info").childNodes.forEach(n => {
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
u.getE("save_settings").onclick = (e) => {
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
	u.getFile("/data/settings.json",
		loadSettingsFromJSON,
		2000,
		"GET",
		function () {
			u.getFile("/data/settings.json", loadSettingsFromJSON);
		}, function () {
			u.getFile("/data/settings.json", loadSettingsFromJSON);
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
	var p = e.parentNode.parentNode;
	var matches = document.querySelectorAll("input");

	for (let m of matches)
	{
		if (p.contains(m) && m != e)
		{
			m.disabled = !state;
		}
	}
}


// Hide loading screen
function hideLoading() {
	setTimeout(() => { u.getE("loading").style.opacity = "0"; }, 1000)
	setTimeout(() => { u.getE("loading").style.display = "none"; }, 1500)
}

// Hide loading screen when DOM processing by JS finished
window.addEventListener('DOMContentLoaded', (event) => {
	console.log('DOM fully loaded and parsed');
	hideLoading();
});