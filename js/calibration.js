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

u.getE("apply_coef").onclick = (e) => {
	var c = {
		"sensor": u.getE("sensor").value,
		"type": u.getE("type").value,
		"unit": u.getE("unit").value,
		"coef_type": "lin",
		"a": u.getE("a").value,
		"b": u.getE("b").value
	};

	console.log("coef applying")
	console.log(c);

	settings.system.coefficients.push(c);

	if (u.saveSettings(settings))
	{
		e.srcElement.nextElementSibling.style = "";
		e.srcElement.nextElementSibling.innerText = "Applied!"
	}
	else
	{
		e.srcElement.nextElementSibling.style = "color: red;";
		e.srcElement.nextElementSibling.innerText = "error!"
	}

	loadSettings();
}