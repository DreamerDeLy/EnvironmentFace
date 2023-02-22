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

function coefToString(t, a, b) {
	switch (t) 
	{
		case "lin": return (a + " * <b>value</b> + " + b);
		case "exp": return (a + " * e^(" + b + " * <b>value</b>)");
		case "log": return (a + " * ln(<b>value</b>) + " + b);
		case "pow": return (a + " * <b>value</b>^" + b);
		default: return "<error>"
	}
}

var settings = { };

function parseSettings(json) {
	settings = JSON.parse(json);
	console.log(settings);

	// Table with coefficients
	var t = u.getE("current_coefs");

	// Clear table
	var child = t.lastElementChild; 
    while (child) {
        t.removeChild(child);
        child = t.lastElementChild;
    }

	// List of coefficirnts
	var coefficients = settings.system.coefficients;

	for (let c of coefficients)
	{
		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

		b_edit.onclick = (e) => {
			console.log("edit coef");
			console.log(c);

			u.getE("coef_type").value = c.coef_type;

			var sensor_select = u.getE("sensor");

			// If option doesn't exist
			if (Array.from(sensor_select.options).findIndex(e => {return e.innerText==c.sensor}) == -1)
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

		var b_remove = document.createElement("button");
		b_remove.innerText = "Remove";

		b_remove.onclick = (e) => {
			var i = coefficients.findIndex(e => {
				return (e.sensor == c.sensor && 
					e.type == c.type && 
					e.unit == c.unit);
			});

			console.log("removing coef");
			console.log(coefficients[i]);
			coefficients.splice(i, 1);
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

}

function createSensorOption(n, selected = false)
{
	var o = document.createElement("option");
	o.innerText = n;
	if (selected) o.setAttribute("selected", "selected");
	u.getE("sensor").appendChild(o);
}

function parseSensors(json) {
	var data = JSON.parse(json);
	for (const [key, value] of Object.entries(data["sensors-status"]))
	{
		createSensorOption(key);
	}
}

// Load info data
u.getFile("/data/info.json",
	parseSensors,
	2000,
	"GET",
	function () {
		u.getFile("/data/info.json", parseSettings);
	}, function () {
		u.getFile("/data/info.json", parseSettings);
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
	}, 3000);
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

	// Check if coefficient valid (doesn't have empty fields)
	if (Object.values(c).findIndex(v => v == ""))
	{
		showMessage(e.srcElement, "Invalid coefficient!", /* error: */ true);
		return;
	}

	// Reference to coefficients list
	var coefs = settings.system.coefficients;

	// Check if same coefficient already exist
	if (coefs.findIndex(e => { JSON.stringify(e) === JSON.stringify(c) }) >= 0)
	{
		showMessage(e.srcElement, "Coefficient already exist!");
		return;
	}

	// Check if contains same coefficient with different settings
	var i = coefs.findIndex(e => { e.sensor == c.sensor && e.type == c.type && e.unit == c.unit });

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