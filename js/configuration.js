import * as u from "./utils.js";

// Load info data
u.getFile("/data/info.json",
	parseInfo,
	2000,
	"GET",
	function () {
		u.getFile("/data/info.json", parseInfo);
	}, function () {
		u.getFile("/data/info.json", parseInfo);
	}
);

// Load settings
function loadSettings() {
	u.getFile("/data/settings_system.json",
		parseSettings,
		2000,
		"GET",
		function () {
			u.getFile("/data/settings_system.json", parseSettings);
		}, function () {
			u.getFile("/data/settings_system.json", parseSettings);
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
	u.getE("settings_json").value = JSON.stringify(settings, null, "\t");

	// Table with ports
	var t_ports = u.getE("ports_table");
	u.clearTable(t_ports);

	var ports = settings.serial_ports;
	var sensors = settings.sensors;

	// Sort by port id
	ports.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

	// Sensor port select 
	var port_select = u.getE("value");
	var sensor_select = u.getE("sensor");

	for (let p of ports)
	{
		if (p.tx == null) p.tx = -1;

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

		b_remove.onclick = e => {
			var i = ports.findIndex(e => { return e.id == p.id});

			if (i > -1) {
				console.log("removing port " + ports[i].id);
				ports.splice(i, 1);

				// Save settings
				if (u.saveSettings(settings, "system")) {
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
		}
		
		// Check if this pin used in other port
		var rx_duplicated = (ports.findIndex(e => { return (e.id != p.id && (e.rx == p.rx || e.tx == p.rx)); }) != -1);
		var tx_duplicated = (ports.findIndex(e => { return (e.id != p.id && (e.rx == p.tx || e.tx == p.tx)); }) != -1);
		
		// Port label
		var text = "";

		text += `${p.name} / ${p.id}`;
		text += ` | RX: <b style="${rx_duplicated ? "color: red" : ""}">${p.rx}</b>` //, TX: <b style='tx_s'>{tx}</b>"
		
		if (p.tx != -1)
		{
			text += `, TX: <b style="${tx_duplicated ? "color: red" : ""}">${p.tx}</b>` //, TX: <b style='tx_s'>{tx}</b>"
		}

		td_label.innerHTML = text;
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

	for (const s of sensors)
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

			sensor_select.value = s.name;
			if (s.port != null) {
				port_select.value = s.port.toString();
			} else {
				port_select.value = "enabled";
			}
		}

		// Remove button
		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";

		b_remove.onclick = e => {
			console.log("remove sensor");

			// Remove sensor
			var i = sensors.findIndex(e => { return e.name == s.name });
			if (i > -1) sensors.splice(i, 1);

			// Save settings
			if (u.saveSettings(settings, "system")) {
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
		if (s.port != null)
		{
			var i = ports.findIndex(p => p.id == s.port);
			if (i != -1) status = ports[i].name;
		}

		td_label.innerHTML = s.name + (status != null ? (" > " + status) : "");
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

// Is string a valid JSON object
function isValidJSON(str)
{
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}

// Change color of settings JSON textarea 
u.getE("settings_json").oninput = e => {
	e.srcElement.style = "background-color: " + (isValidJSON(e.srcElement.value) ? "#3a6d3e" : "#6d3a3a");
}

// Format text in settings JSON textarea
u.getE("b_format").onclick = e => {
	try {
		u.getE("settings_json").value = JSON.stringify(JSON.parse(u.getE("settings_json").value), null, "\t");
	} catch (error) {
		window.alert("ERROR: JSON is invalid!");
	}
}

// Save settings JSON from textarea
u.getE("b_save").onclick = e => {
	try {
		settings = JSON.parse(u.getE("settings_json").value);
	} catch (error) {
		window.alert("ERROR: JSON is invalid!");
		return;
	}	

	// Save settings
	if (u.saveSettings(settings, "system")) {
		window.alert("Saved!");

		loadSettings();
	}
	else {
		window.alert("ERROR: settings saving error!");
	}
}

function isNumber(value) {
    if (typeof value === "string") {
        return !isNaN(value);
    }
}

u.getE("apply_sensor").onclick = e => {
	var sensors = settings.sensors;

	var name = u.getE("sensor").value;
	var value = u.getE("value").value;

	if (isNumber(value)) 
	{
		// Convert to number
		value = parseInt(value);

		// Check if there is another sensor on same port 
		var i = sensors.findIndex(e => { return e.port == value && e.name != name; });
		if (i > -1) 
		{
			window.alert("WARNING: there is another sensor on this port!");
		}
	}
	else
	{
		value = -1;
	}

	// Create new sensor
	var new_sensor = { name: name, port: value };
	
	console.log("apply sensor: " + new_sensor.toString());

	// Check if already exist
	var i = sensors.findIndex(e => { return e.name == name; });
	if (i > -1)
	{
		// Replace
		sensors[i] = new_sensor;
	}
	else
	{
		// Add new
		sensors.push(new_sensor);
	}

	// Save settings
	if (u.saveSettings(settings, "system")) {
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
	var ports = settings.serial_ports;

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
	if (u.saveSettings(settings, "system")) {
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