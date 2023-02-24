import * as u from "./utils.js";

function parseInfo(json) {
	var data = JSON.parse(json);

	// Fill info 
	u.getE("id").innerText = data["id"];
	u.getE("version").innerText = data["software-version"];
}

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

	// Clear table
	var child = t_ports.lastElementChild; 
    while (child) {
        t_ports.removeChild(child);
        child = t_ports.lastElementChild;
    }

	var ports = settings.system.serial_ports;
	var sensors = settings.system.sensors;

	ports.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

	for (let p of ports)
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		// Edit button
		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

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
	}

	// Table with ports
	var t_sensors = u.getE("sensors_table");

	for (const [name, value] of Object.entries(sensors))
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		// Edit button
		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

		// Remove button
		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";

		var status = null;

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