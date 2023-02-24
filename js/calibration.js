import * as u from "./utils.js";

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

loadSettings();

// Coefficient formula to string
function coefToString(t, a, b) {
	if (a == "") a = "a";
	if (b == "") b = "b";

	switch (t) 
	{
		case "lin": return (a + " * <b>value</b> + (" + b + ")");
		case "exp": return (a + " * e^(" + b + " * <b>value</b>)");
		case "log": return (a + " * ln(<b>value</b>) + (" + b + ")");
		case "pow": return (a + " * <b>value</b>^(" + b + ")");
		default: return "<error>"
	}
}

var settings = { };

// Update formula text on input
u.getE("coef_type").oninput = updateFormula;
u.getE("a").oninput = updateFormula;
u.getE("b").oninput = updateFormula;

function updateFormula() {
	u.getE("coef_formula").innerHTML = coefToString(
		u.getE("coef_type").value, 
		u.getE("a").value, 
		u.getE("b").value
	);
}

updateFormula();

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
	u.getE("settings_json").value = JSON.stringify(settings, null, "  ");

	// Table with coefficients
	var t = u.getE("current_coefs");
	u.clearTable(t);

	// List of coefficients
	var coefficients = settings.system.coefficients;

	for (let c of coefficients)
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		// Edit button
		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

		b_edit.onclick = (e) => {
			console.log("edit coef");
			console.log(c);

			u.getE("coef_type").value = c.coef_type;

			var sensor_select = u.getE("sensor");

			// If option doesn't exist
			if (Array.from(sensor_select.options).findIndex(e => { return e.innerText == c.sensor; }) == -1)
			{
				// Add new option
				createSensorOption(c.sensor, /* selected: */ true);
			}

			sensor_select.value = c.sensor;
			
			u.getE("type").value = c.type;
			u.getE("unit").value = c.unit;

			u.getE("a").value = c.a;
			u.getE("b").value = c.b;

			u.getE("coef_formula").innerHTML = coefToString(c.coef_type, c.a, c.b);
		}

		// Remove button
		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";

		b_remove.onclick = (e) => {
			// Find index of coefficient
			var i = coefficients.findIndex(e => {
				return (e.sensor == c.sensor && 
					e.type == c.type && 
					e.unit == c.unit);
			});

			// Print log
			console.log("removing coef");
			console.log(coefficients[i]);

			// Remove coefficient
			coefficients.splice(i, 1);

			// Save settings
			if (u.saveSettings(settings)) {
				window.alert("Successfully removed!");
			}
			else {
				window.alert("ERROR: settings saving error!");
			}

			// Reload settings
			loadSettings();
		}

		td_label.innerHTML = c.sensor + " " + c.type + " " + c.unit + " | " + coefToString(c.coef_type, c.a, c.b);
		td_label.style = "font-family: monospace; width: 100%;"

		td_edit.appendChild(b_edit);
		td_remove.appendChild(b_remove);

		tr.appendChild(td_label);
		tr.appendChild(td_edit);
		tr.appendChild(td_remove);

		t.appendChild(tr);
	}

	// MICS calibration values
	u.getE("mics_a0").value = settings.system.mics_a0;
	u.getE("mics_a1").value = settings.system.mics_a1;
	u.getE("mics_a2").value = settings.system.mics_a2;
}

function createSensorOption(n, selected = false, disabled = false)
{
	var o = document.createElement("option");
	o.innerText = n;

	if (disabled) o.style = "background-color: #BBBBBB;"
	if (selected) o.setAttribute("selected", "selected");

	u.getE("sensor").appendChild(o);
}

function parseInfo(json) {
	var data = JSON.parse(json);

	// Create sensors select options
	for (const [key, value] of Object.entries(data["sensors-status"]))
	{
		createSensorOption(key, /* selected: */ false, /* disabled: */ (value == -1));
	}

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
		u.getFile("/data/info.json", parseInfo);
	}, function () {
		u.getFile("/data/info.json", parseInfo);
	}
);

// Show button message
function showMessage(button, msg, error = false) {
	var m = button.nextElementSibling;

	// Set mesage
	m.style = error ? "color: red;" : "";
	m.innerText = msg;

	// Clear message text
	setTimeout(()=>{
		m.style = "";
		m.innerText = "...";
	}, 1000);
}

// Apply coefficient 
u.getE("apply_coef").onclick = (e) => {
	// Create coefficient 
	var c = {
		"sensor": u.getE("sensor").value,
		"type": u.getE("type").value,
		"unit": u.getE("unit").value,
		"coef_type": u.getE("coef_type").value,
		"a": parseFloat(u.getE("a").value),
		"b": parseFloat(u.getE("b").value)
	};

	
	console.log("coef applying")
	console.log(c);

	// Check if coefficient valid
	if (c.sensor == "" || c.type == "" || c.unit == "" || Number.isNaN(c.a) || c.a == 0 || Number.isNaN(c.b))
	{
		showMessage(e.srcElement, "Invalid coefficient!", /* error: */ true);
		return;
	}

	// Reference to coefficients list
	var coefs = settings.system.coefficients;

	// Check if same coefficient already exist
	if (coefs.findIndex(e => { return JSON.stringify(e) === JSON.stringify(c); }) >= 0)
	{
		showMessage(e.srcElement, "Coefficient already exist!");
		return;
	}

	// Check if contains same coefficient with different settings
	var i = coefs.findIndex(e => { return (e.sensor == c.sensor && e.type == c.type && e.unit == c.unit); });

	// Delete existing coefficient
	if (i >= 0) coefs.splice(i, 1); 

	// Add coefficient to settings
	coefs.push(c);

	// Save settings
	if (u.saveSettings(settings))
	{
		showMessage(e.srcElement, "Applied!");
	}
	else
	{
		showMessage(e.srcElement, "Error!", /* error: */ true);
	}

	// Reload settings
	loadSettings();
}

// Apply MICS calibration
u.getE("apply_mics").onclick = (e) => {
	console.log("applying mics");

	settings.system.mics_a0 = u.getE("mics_a0").value;
	settings.system.mics_a1 = u.getE("mics_a1").value;
	settings.system.mics_a2 = u.getE("mics_a2").value;

	// Save settings
	if (u.saveSettings(settings))
	{
		showMessage(e.srcElement, "Applied!");
	}
	else
	{
		showMessage(e.srcElement, "Error!", /* error: */ true);
	}

	// Reload settings
	loadSettings();
}

u.getLiveData(updateValues, "last");

function isCoefForSensor(c, s, t, u)
{
	return (c.sensor == s && c.type == t && c.unit == u);
}

function round(v, digits = 2)
{
	var m = Math.pow(10, digits);
	return Math.round(v * m) / m;
}

function updateValues(json)
{
	var values_data = { };

	try {
		values_data = JSON.parse(json);
	} catch {
		console.error("ERROR: Value JSON parsing!");
		return;
	}

	var values = values_data.variables;

	// Set MICS values
	var nh3_i = values.findIndex(e => { return isCoefForSensor(e, "MICS-6814", "nh3", "ppm"); });
	var co_i = values.findIndex(e => { return isCoefForSensor(e, "MICS-6814", "co", "ppm"); });
	var no2_i = values.findIndex(e => { return isCoefForSensor(e, "MICS-6814", "no2", "ppm"); });

	if (nh3_i >= 0) u.getE("value_nh3").innerText = round(values[nh3_i].value * 1000);
	if (co_i >= 0) u.getE("value_co").innerText = round(values[co_i].value * 1000);
	if (no2_i >= 0) u.getE("value_no2").innerText = round(values[no2_i].value * 1000);

	// Set coefficient value
	var sensor = u.getE("sensor").value;
	var type = u.getE("type").value;
	var unit = u.getE("unit").value;

	var i = values.findIndex(e => { return isCoefForSensor(e, sensor, type, unit); });

	if (i >= 0)
	{
		u.getE("val_after").innerText = values[i].value;
		u.getE("val_unit").innerText = values[i].unit;
	}
	else
	{
		u.getE("val_after").innerText = "-";
		u.getE("val_unit").innerText = "-";
	}
}

setInterval(() => {u.getLiveData(updateValues, "last")}, 1000);