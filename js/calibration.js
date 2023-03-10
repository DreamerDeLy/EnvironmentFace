import * as u from "./utils.js";

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

	// Create coefficients array if not exist
	if (settings.coefficients == null) settings.coefficients = [ ];

	// List of coefficients
	var coefficients = settings.coefficients;

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
			if (u.saveSettings(settings, "system")) {
				window.alert("Successfully removed!");

				// Reload settings
				loadSettings();
			}
			else {
				window.alert("ERROR: settings saving error!");
			}
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
	u.getE("mics_a0").value = settings.mics_a0;
	u.getE("mics_a1").value = settings.mics_a1;
	u.getE("mics_a2").value = settings.mics_a2;
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
	
	// Create coefficients array if not exist
	if (settings.coefficients == null) settings.coefficients = [ ];

	// Reference to coefficients list
	var coefs = settings.coefficients;

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
	if (u.saveSettings(settings, "system"))
	{
		showMessage(e.srcElement, "Applied!");

		// Reload settings
		loadSettings();
	}
	else
	{
		showMessage(e.srcElement, "Error!", /* error: */ true);
	}
}

// Apply MICS calibration
u.getE("apply_mics").onclick = (e) => {
	console.log("applying mics");

	settings.mics_a0 = u.getE("mics_a0").value;
	settings.mics_a1 = u.getE("mics_a1").value;
	settings.mics_a2 = u.getE("mics_a2").value;

	// Save settings
	if (u.saveSettings(settings, "system"))
	{
		showMessage(e.srcElement, "Applied!");

		// Reload settings
		loadSettings();

		// Restart sensors
		u.sendCommand("restart_module sensors");
	}
	else
	{
		showMessage(e.srcElement, "Error!", /* error: */ true);
	}
}

// Is value/coefficient for sensor
function isForSensor(c, s, t, u)
{
	return (c.sensor == s && c.type == t && c.unit == u);
}

function round(v, digits = 2)
{
	var m = Math.pow(10, digits);
	return Math.round(v * m) / m;
}

function updateValues(json, is_avg)
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
	var nh3_i = values.findIndex(e => { return isForSensor(e, "MICS-6814", "nh3", "ppm"); });
	var co_i = values.findIndex(e => { return isForSensor(e, "MICS-6814", "co", "ppm"); });
	var no2_i = values.findIndex(e => { return isForSensor(e, "MICS-6814", "no2", "ppm"); });

	var id_postfix = (is_avg == true ? "_avg" : "");

	if (nh3_i >= 0) u.getE("value_nh3" + id_postfix).innerText = round(values[nh3_i].value * 1000);
	if (co_i >= 0) u.getE("value_co" + id_postfix).innerText = round(values[co_i].value * 1000);
	if (no2_i >= 0) u.getE("value_no2" + id_postfix).innerText = round(values[no2_i].value * 1000);

	// Set coefficient value
	var sensor = u.getE("sensor").value;
	var type = u.getE("type").value;
	var unit = u.getE("unit").value;

	var i = values.findIndex(e => { return isForSensor(e, sensor, type, unit); });

	if (i >= 0)
	{
		u.getE("val_after" + id_postfix).innerText = values[i].value;
		u.getE("val_unit" + id_postfix).innerText = values[i].unit;
	}
	else
	{
		u.getE("val_after" + id_postfix).innerText = "-";
		u.getE("val_unit" + id_postfix).innerText = "-";
	}

	var type_select = u.getE("type");

	if (type_select.options.length == 0 || is_avg == true)
	{
		var types = Array.from(new Set(values.map((v) => { 
			if (v.sensor != "system" && !v.type.endsWith("-raw")) return v.type; 
			else return "";
		} )));
		
		for (var t of types)
		{
			// Skip if already exist
			if (Array.from(type_select.options).findIndex(e => { return e.innerText == t; }) != -1) continue;

			if (t == "") continue;

			var o = document.createElement("option");
			o.innerText = t;
			type_select.appendChild(o);
		}
	}

	var unit_select = u.getE("unit");

	if (unit_select.options.length == 0 || is_avg == true)
	{
		var units = Array.from(new Set(values.map((v) => { 
			if (v.sensor != "system" && !v.type.endsWith("-raw")) return v.unit; 
			else return "";
		} )));
		
		for (var t of units)
		{
			// Skip if already exist
			if (Array.from(unit_select.options).findIndex(e => { return e.innerText == t; }) != -1) continue;

			if (t == "") continue;

			var o = document.createElement("option");
			o.innerText = t;
			unit_select.appendChild(o);
		}
	}
}

setInterval(() => { u.getLiveData( (e) => { updateValues(e, false); }, "last")}, 1000);
setInterval(() => { u.getLiveData( (e) => { updateValues(e, true); }, "send")}, 1000);

var mics_boxes = [
	u.getE("mics_a0"),
	u.getE("mics_a1"),
	u.getE("mics_a2")
]

mics_boxes.forEach(e => e.onchange = () => {
	e.style = "";
})

u.getE("calculate_mics").onclick = e => {
	u.getLiveData(calculateMics, "send");
}

function calculateMics(json)
{
	try {
		var data = JSON.parse(json);
	} catch (error) {
		window.alert("ERROR: Failed to load data!");
		return;
	}

	var isValid = e => {
		return (e != null && e > 0);
	};

	try {
		var raw_nh3 = data["variables"].find(e => e.type == "nh3-raw")["value"];
		var raw_co = data["variables"].find(e => e.type == "co-raw")["value"];
		var raw_no2 = data["variables"].find(e => e.type == "no2-raw")["value"];
	} catch {
		window.alert("WARNING: Failed to load some MICS values!");
	}

	var avg_nh3 = u.getE("ref_nh3").value;
	var avg_co = u.getE("ref_co").value;
	var avg_no2 = u.getE("ref_no2").value;

	if (isValid(raw_nh3)) {
		var ratio_nh3 = (10 * Math.pow(10/7, 33/167)) / (Math.pow(7*3, 100/167) * Math.pow(avg_nh3, 100/167));
		var r0_nh3 = raw_nh3 / ratio_nh3;
		mics_boxes[0].value = Math.round(r0_nh3 * 100);
		mics_boxes[0].style = "background-color: #FFEB3B;"
	}

	if (isValid(raw_co)) {
		var ratio_co = Math.pow(877, 1000/1179) / (20 * Math.pow(2, 214/393) * Math.pow(5, 821/1179) * Math.pow(avg_co, 1000/1179));
		var r0_co = raw_co / ratio_co;
		mics_boxes[1].value = Math.round(r0_co * 100);
		mics_boxes[1].style = "background-color: #FFEB3B;"
	}
	
	if (isValid(raw_no2)) {
		var ratio_no2 = (Math.pow(1371, 1000/1007) * Math.pow(avg_no2, 1000/1007)) / (20 * Math.pow(2, 986/1007) * Math.pow(5, 993/1007));
		var r0_no2 = raw_no2 / ratio_no2;
		mics_boxes[2].value = Math.round(r0_no2 * 100);
		mics_boxes[2].style = "background-color: #FFEB3B;"
	}
}