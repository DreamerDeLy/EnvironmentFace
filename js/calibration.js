import * as u from "./utils.js";

// Load data
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

function coefToString(t, a, b) {
	switch (t) 
	{
		case "lin": return (a + " * x + " + b);
		case "exp": return (a + " * e^(" + b + " * x)");
		case "log": return (a + " * ln(x) + " + b);
		case "pow": return (a + " * x^" + b);
		default: return "<error>"
	}
}

var settings = { };

function parseSettings(json) {
	settings = JSON.parse(json);

	console.log(settings);
	var t = u.getE("current_coefs");

	var coefficients = settings.system.coefficients;

	for (let c of coefficients)
	{
		// console.log(c);

		var td_label = document.createElement("td");
		var td_edit = document.createElement("td");
		var td_remove = document.createElement("td");

		var tr = document.createElement("tr");

		var b_edit = document.createElement("button");
		b_edit.innerText = "Edit";

		b_edit.onclick = (e) => {
			console.log("set coef");
			console.log(c);

			var options = document.getElementsByTagName("option");

			var sensor_selected = false;
			for (let o of options)
			{
				if (u.getE("coef_type").contains(o))
				{
					if (o.innerText == c.coef_type) o.setAttribute("selected", "selected");
					else o.removeAttribute("selected");
				}
				else if (u.getE("sensor").contains(o))
				{
					if (o.innerText == c.sensor) {
						o.setAttribute("selected", "selected");
						sensor_selected = true;
					}
					else o.removeAttribute("selected");
				}
			}

			if (!sensor_selected)
			{
				createSensorOption(c.sensor, /* selected: */ true);
			}

			
			u.getE("type").value = c.type;
			u.getE("unit").value = c.unit;
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

		td_label.innerText = c.sensor + " " + c.type + " " + c.unit + " | " + coefToString(c.coef_type, c.a, c.b);
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

// Load data
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