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

function editCoef(c)
{
	console.log("edit coef");
	console.log(c);

	// Set not required 
	c.coef_type = (c.coef_type == null ? "lin" : c.coef_type);
	c.a = (c.a == null ? "" : c.a);
	c.b = (c.b == null ? "" : c.b);

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

	// Show edit box
	u.getE("box_coef").classList.remove("hide");
}

function removeCoef(c)
{
	var coefficients = settings.coefficients;

	// Find index of coefficient
	var i = coefficients.findIndex(e => {
		return (e.sensor == c.sensor && 
			e.type == c.type && 
			e.unit == c.unit);
	});

	if (i == -1) 
	{
		console.warn("coef doesn't exist");
		return;
	}

	// Print log
	console.log("removing coef");
	console.log(coefficients[i]);

	// Remove coefficient
	coefficients.splice(i, 1);

	// Save settings
	if (u.saveSettings(settings, "system")) {
		window.alert("Successfully removed!");
	}
	else {
		window.alert("ERROR: settings saving error!");
		return;
	}

	// If currently edited, hide edit box
	if (isForSensor(c, u.getE("sensor").value, u.getE("type").value, u.getE("unit").value))
	{
		u.getE("box_coef").classList.add("hide");
	}

	// Reload settings
	loadSettings();

	// // Debug
	// parseSettings(JSON.stringify(settings));
}

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

	if (coefficients.length == 0) t.innerHTML = "-";
	else t.innerHTML = "";

	for (let c of coefficients)
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		// Edit button
		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";
		b_edit.onclick = () => { editCoef(c); }

		// Remove button
		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";
		b_remove.onclick = () => { removeCoef(c, settings); }

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

	while (m.nodeName.toLowerCase() != "span")
	{
		var m = m.nextElementSibling;
	}

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
	}
	else
	{
		showMessage(e.srcElement, "Error!", /* error: */ true);
		return;
	}

	// Reload settings
	loadSettings();

	// Hide edit box
	u.getE("box_coef").classList.add("hide");

	// // Debug
	// parseSettings(JSON.stringify(settings));
}

// Remove coefficient
u.getE("remove_coef").onclick = () => {
	// Create coefficient 
	var c = {
		"sensor": u.getE("sensor").value,
		"type": u.getE("type").value,
		"unit": u.getE("unit").value,
		"coef_type": u.getE("coef_type").value,
		"a": parseFloat(u.getE("a").value),
		"b": parseFloat(u.getE("b").value)
	};

	removeCoef(c);

	// Hide edit box
	u.getE("box_coef").classList.add("hide");

	// Debug
	parseSettings(JSON.stringify(settings));
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
	}
	else
	{
		showMessage(e.srcElement, "Error!", /* error: */ true);
		return;
	}

	// Hide editing box
	u.getE("box_mics").classList.add("hide");

	// Reload settings
	loadSettings();

	// Restart sensors
	u.sendCommand("restart_module sensors");
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

var last_data_realtime = { };
var last_data_average = { };

function updateValues(json, is_avg)
{
	var data = { };

	try {
		data = JSON.parse(json);
	} catch {
		console.error("ERROR: Value JSON parsing!");
		return;
	}

	let last_data = (is_avg ? last_data_average : last_data_realtime);

	var updated = (JSON.stringify(data.variables) != JSON.stringify(last_data.variables));

	var t = u.getE("values");

	for (let v of data.variables)
	{
		if (v.sensor == "system" || v.type.endsWith("-raw")) continue;

		var value_id = v.sensor + "/" + v.type + "/" + v.unit;

		var tr = document.createElement("tr");

		var td_sensor = document.createElement("td");
		var td_type = document.createElement("td");
		var td_last = document.createElement("td");
		var td_avg = document.createElement("td");

		var append = true;

		for (var i of t.rows) {
			if (i.getAttribute("data") == value_id) 
			{
				tr = i;

				td_sensor = i.cells[0];
				td_type = i.cells[1];
				td_last = i.cells[2];
				td_avg = i.cells[3];
				append = false;
			}
		}

		let td_value = (is_avg ? td_avg : td_last);

		tr.setAttribute("data", value_id);

		td_sensor.innerText = v.sensor;
		td_type.innerText = v.type;
		td_value.innerText = v.value + " " + v.unit;

		// Create default coefficient for value
		let c = {
			"sensor": v.sensor,
			"type": v.type,
			"unit": v.unit
		};

		// Find coefficient for value
		var i = settings.coefficients.findIndex(e => { return isForSensor(e, v.sensor, v.type, v.unit); });
		
		if (i >= 0)
		{
			// Highlight values with coefficient applied 
			tr.style = "background-color: #503020;"

			// Set actual coefficient
			c = settings.coefficients[i];
		}	
		else
		{
			// Reset style
			tr.style = "";
		}
			
		tr.onclick = () => { 
			if (v.sensor.toLowerCase() != "mics-6814")
			{
				editCoef(c); 

				// Hide MICS calibration box
				u.getE("box_mics").classList.add("hide");
			}
			else
			{
				// Hide coefficient edit box
				u.getE("box_coef").classList.add("hide");

				// Show MICS calibration box
				u.getE("box_mics").classList.remove("hide");
			}
		};

		if (updated)
		{
			td_value.classList.add("updated");
			setTimeout(() => { td_value.classList.remove("updated"); }, 3000);
		}

		if (append) 
		{
			tr.appendChild(td_sensor);
			tr.appendChild(td_type);
			tr.appendChild(td_last);
			tr.appendChild(td_avg);

			t.appendChild(tr);
		}
	}

	if (is_avg) 
		last_data_average = data;
	else 
		last_data_realtime = data;
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