import * as u from "./utils.js";

// Load info data
u.getFile("/data/info.json",
	parseInfo,
	2000,
	"GET",
	function () {
		u.getFile("/data/info.json", parseSettings);
	}, function () {
		u.getFile("/data/info.json", parseSettings);
	}
);

// Load settings
function loadSettings() {
	u.getFile("/data/settings.json",
		parseSettings,
		2000,
		"GET",
		function () {
			u.getFile("/data/settings.json", parseSettings);
		}, function () {
			u.getFile("/data/settings.json", parseSettings);
		}
	);
}

function createNewOption(name, parent, text = "")
{
	var o = document.createElement("option");
	o.value = name;

	if (text != "") { 
		o.innerText = text
	} else {
		o.innerText = name;
	}

	parent.appendChild(o);
}

function parseInfo(json) {
	var data = JSON.parse(json);

	// Fill info 
	u.getE("id").innerText = data["id"];
	u.getE("version").innerText = data["software-version"];

	// Sensor select in "Edit sensor"
	var sensor_select = u.getE("sensor");

	// Add options in sensor select in "Edit sensor"
	for (const [name, value] of Object.entries(data["sensors-status"]))
	{
		// Add sensor to "Edit sensor" if isn't exist
		if (Array.from(sensor_select.options).findIndex(e => { return e.value == name; }) == -1) {
			// Add new option
			createNewOption(name, sensor_select);
		}
	}
}

var settings = { }

function parseSettings(json) {
	try {
		settings = JSON.parse(json);
	} catch {
		window.alert("ERROR: Settings JSON parsing!");
		return;
	}

	console.log("parsing settings");
	console.log(settings);

	// Fill settings JSON
	u.getE("settings_json").value = JSON.stringify(settings, null, "    ");

	// Table with ports
	var t_ports = u.getE("ports_table");
	u.clearTable(t_ports);

	var ports = settings.system.serial_ports;
	var sensors = settings.system.sensors;

	// Sort by port id
	ports.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

	// Sensor port select 
	var port_select = u.getE("value");
	var sensor_select = u.getE("sensor");

	for (let p of ports)
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		// Edit button
		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

		b_edit.onclick = e => {
			u.getE("port_id").value = p.id;
			u.getE("rx").value = p.rx;
			u.getE("tx").value = p.tx;
		}

		// Remove button
		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";

		td_label.innerHTML = p.name + " / " + p.id + " | RX: " + p.rx + (p.tx == -1 ? "" : ", TX: " + p.tx);
		td_label.style = "font-family: monospace; width: 100%;"

		td_edit.appendChild(b_edit);
		td_remove.appendChild(b_remove);

		tr.appendChild(td_label);
		tr.appendChild(td_edit);
		tr.appendChild(td_remove);

		t_ports.appendChild(tr);

		// Add port to "Edit sensor" if isn't exist
		if (Array.from(port_select.options).findIndex(e => { return e.value == p.id; }) == -1) {
			// Add new option
			createNewOption(p.id, port_select, p.name);
		}
	}

	// Table with ports
	var t_sensors = u.getE("sensors_table");
	u.clearTable(t_sensors);

	for (const [name, value] of Object.entries(sensors))
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		// Edit button
		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

		b_edit.onclick = e => {
			console.log("edit sensor");

			sensor_select.value = name;
			port_select.value = value.toString();
		}

		// Remove button
		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";

		b_remove.onclick = e => {
			console.log("remove sensor");

			// Remove sensor
			delete sensors[name];

			// Save settings
			if (u.saveSettings(settings)) {
				window.alert("Successfully removed!");
			}
			else {
				window.alert("ERROR: settings saving error!");
			}

			// Reload settings
			loadSettings();

			// Debug
			// parseSettings(JSON.stringify(settings));
		}

		var status = null;

		// If value is port id
		if (Number.isInteger(value))
		{
			var i = ports.findIndex(p => p.id == value);
			if (i != -1) status = ports[i].name;
		}

		td_label.innerHTML = name + (status != null ? (" > " + status) : "");
		td_label.style = "font-family: monospace; width: 100%;"

		td_edit.appendChild(b_edit);
		td_remove.appendChild(b_remove);

		tr.appendChild(td_label);
		tr.appendChild(td_edit);
		tr.appendChild(td_remove);

		t_sensors.appendChild(tr);
	}
}

loadSettings();

function isValidJSON(str)
{
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}

u.getE("settings_json").oninput = e => {
	e.srcElement.style = "background-color: " + (isValidJSON(e.srcElement.value) ? "#3a6d3e" : "#6d3a3a");
}

function isNumber(value) {
    if (typeof value === "string") {
        return !isNaN(value);
    }
}

u.getE("apply_sensor").onclick = e => {
	var sensors = settings.system.sensors;

	var name = u.getE("sensor").value;
	var value = u.getE("value").value;

	if (isNumber(value)) {
		// Convert to number
		value = parseInt(value);

		// Check if there is another sensor on same port 
		var i = Object.values(sensors).indexOf(value);
		if (i > -1 && Object.keys(sensors)[i] == name)
		{
			window.alert("Already exist!");
			return;
		} else if (i > -1) {
			window.alert("WARNING: there is another sensor on this port!");
		}
		
	} else {
		// Convert to boolean
		value = (value == true);
	}

	console.log("apply sensor: " + name + " / " + value);

	sensors[name] = value;

	// Save settings
	if (u.saveSettings(settings)) {
		window.alert("Saved!");
	}
	else {
		window.alert("ERROR: settings saving error!");
	}

	// Reload settings
	loadSettings();

	// Debug
	// parseSettings(JSON.stringify(settings));
}

u.getE("apply_port").onclick = e => {
	var ports = settings.system.serial_ports;

	var port_id = Number(u.getE("port_id").value);
	var port_rx = Number(u.getE("rx").value);
	var port_tx = Number(u.getE("tx").value);

	// If input field is empty
	if (port_tx == "") port_tx = -1;

	var is_active = (port_tx == -1);
	
	var is_id_valid = false;

	if (is_active) {
		is_id_valid = (port_id >= 10 && port_id < 20);
	} else {
		is_id_valid = (port_id >= 0 && port_id < 10);
	}

	if (!is_id_valid) {
		window.alert("Invalid ID!\nFor Passive: 0 <= id < 10\nFor Active: 10 <= id < 20");
		return;
	}

	if (port_rx <= 0) {
		window.alert("Invalid RX pin!");
		return;
	}

	var port_name = (is_active ? "A" : "P") + (is_active ? (port_id - 10) : port_id);

	console.log("apply port: " + port_id + "/" + port_name + " [rx: " + port_rx + ", tx: " + port_tx + "]");

	// Check if same port already exist
	var i = ports.findIndex(e => { return e.id == port_id; });

	// Delete existing coefficient
	if (i >= 0) ports.splice(i, 1); 

	ports.push({name: port_name, id: port_id, rx: port_rx, tx: port_tx});

	// Save settings
	if (u.saveSettings(settings)) {
		window.alert("Saved!");
	}
	else {
		window.alert("ERROR: settings saving error!");
	}
	
	// Reload settings
	loadSettings();

	// Debug
	// parseSettings(JSON.stringify(settings));
}