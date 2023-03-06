import * as u from "./utils.js";

var values_palette = [
	{
		name: "pm25",
		unit: "ug/m3",
		palette: [
			0,
			12,
			35.5,
			55.5,
			150.5,
			250.5
		]
	},
	{
		name: "pm10",
		unit: "ug/m3",
		palette: [
			0,
			55,
			155,
			255,
			355,
			425
		]
	},
	{
		name: "co2",
		unit: "ppm",
		palette: [
			0,
			600,
			1000,
			1500,
			2000,
			2500
		]
	},
	{
		name: "ch2o",
		unit: "ppb",
		palette: [
			0,
			35,
			50,
			100,
			200,
			500
		]
	},
	{
		name: "tvoc",
		unit: "ppb",
		palette: [
			0,
			65,
			220,
			660,
			1600,
			2200
		]
	},
	{
		name: "o3",
		unit: "ppb",
		palette: [
			0,
			70,
			125,
			165,
			205,
			405
		]
	},
	{
		name: "co",
		unit: "ppb",
		palette: [
			0,
			4500,
			9500,
			12500,
			15500,
			30500
		]
	},
	{
		name: "no2",
		unit: "ppb",
		palette: [
			0,
			55,
			100,
			360,
			650,
			1250
		]
	},
	{
		name: "so2",
		unit: "ppb",
		palette: [
			0,
			35,
			75,
			185,
			305,
			605
		]
	},
	{
		name: "radiation",
		unit: "uR/h",
		palette: [
			0,
			20,
			30,
			50,
			100,
			200
		]
	},
	// {
	// 	name: "ch4",
	// 	unit: "%vol",
	// 	palette: [
	// 		{ s: 0, color: C_1 },
	// 		{ s: 3, color: C_3 },
	// 		{ s: 4, color: C_4 },
	// 		{ s: 5, color: C_6 }
	// 	]
	// }
]

var sensors_descriptions = {
	"SDS011": "High quality optical PM sensor",
	"MH-Z1x": "NDIR infrared CO2 sensor",
	"ZE03-": "Electrochemical sensor for high concentrations",
	"ZE07-": "Electrochemical sensor",
	"ZE08-CH2O": "Electrochemical formaldehyde sensor",
	"ZE12-": "High-precision electrochemical sensor",
	"ZE25-O3": "Electrochemical O3 sensor",
	"AHT": "Meteorological sensor",
	"BMP": "BOSCH meteorological sensor",
	"BME": "BOSCH meteorological sensor",
	"MICS-VZ-89TE": "Metal-oxide VOCs sensor",
	"MICS-6814": "Metal-oxide CO, NO2, NH3 sensor",
	"RadKit": "Dosimeter module by BeeGreen",
}

var units_replace = {
	// "C": "°C", // Looks not centred
	"Rh": "%",
	"ug/m3": "&#181;g/m&#179;",
	"uR/h": "&#181;R/h"
}

var types_replace = {
	"pm10": "PM10",
	"pm25": "PM2.5",
	"pm1": "PM1",
	"temperature": "Temperature",
	"humidity": "Humidity",
	"pressure": "Pressure",
	"radiation": "Radiation",
}

var display_mode = "last"; // or "send"

var button_last = u.getE("v_last");
var button_send = u.getE("v_send");

button_last.onclick = () => {
	display_mode = "last";
	button_last.classList.add("selected");
	button_send.classList.remove("selected");
	u.getLiveData(updateValues, display_mode);
}

button_send.onclick = () => {
	display_mode = "send";
	button_send.classList.add("selected");
	button_last.classList.remove("selected");
	u.getLiveData(updateValues, display_mode);
}

u.getLiveData(updateValues, display_mode);

setInterval(()=>{ u.getLiveData(updateValues, display_mode); }, 1000);

function findLevel(value)
{
	var palette_obj = values_palette.find(p => p.name == value["type"] && (p.unit == value["unit"] || (p.unit == "ppb" && value["unit"] == "ppm")));

	if (palette_obj != undefined) 
	{
		var multiplier = (palette_obj.unit == "ppb" && value["unit"] == "ppm") ? 0.001 : 1;

		var result = undefined;
		for (var i = 0; i < palette_obj.palette.length; i++)
		{
			if (value["value"] >= palette_obj.palette[i] * multiplier) result = i;
		}
	}

	return result;
}

function createE(e)
{
	return document.createElement(e);
}

function updateValues(json) {
	var obj = JSON.parse(json);

	// Group values by sensor
	var by_sensor = obj["variables"].reduce((group, value) => {
		const { sensor } = value;
		group[sensor] = group[sensor] ?? [];
		group[sensor].push(value);
		return group;
	}, {});

	// Clear values container
	var table = u.getE("values_table");
	var child = table.lastElementChild; 
	while (child) {
		table.removeChild(child);
		child = table.lastElementChild;
	}

	Object.keys(by_sensor).forEach(e => {
		
		// Skip system values
		if (e == "system") return;

		// Sensor panel
		var s = createE("div");
		s.classList.add("panel");
		s.classList.add("sensor");

		// Sensor name
		var n = createE("div");
		n.innerHTML = e;
		s.appendChild(n);

		// Sensor description
		var n = createE("small");

		var description = e;
		for (const [key, value] of Object.entries(sensors_descriptions)) {
			if (e.startsWith(key)) description = value;
		}

		n.innerHTML = description;
		s.appendChild(n);
		
		// Values container
		var vs = createE("div");
		vs.classList.add("values");

		// console.log(by_sensor[e]);
		by_sensor[e].forEach(e => {
			// Skip raw values
			if (e["type"].endsWith("-raw")) return;

			var v = createE("div");

			var level = findLevel(e);
			if (level != undefined)
			{
				v.classList.add("level-" + level);
			}

			// Type
			var t = createE("small");

			var type = e["type"]
			if (types_replace[type] != null) {
				type = types_replace[type];
			} else {
				type = type.toUpperCase();
			}

			t.innerHTML = type;
			v.appendChild(t);

			// Check value 
			var value = e["value"];
			value = ((value == "null") ? "-" : value);

			// Value
			var t = createE("div");
			t.innerHTML = value;
			v.appendChild(t);

			// Type
			var t = createE("small");

			var unit = e["unit"];
			if (units_replace[unit] != null) unit = units_replace[unit];

			t.innerHTML = unit;
			v.appendChild(t);

			// Add to values container
			vs.appendChild(v);
		})

		// Add values container
		s.appendChild(vs);

		table.appendChild(s);
		
	})
}