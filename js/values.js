function getE(name){
	return document.getElementById(name);
}

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
	"MH-Z1x": "NDIR infrared CO<sub>2</sub> sensor",
	"ZE03-": "Electrochemical sensor for high concentrations",
	"ZE07-": "Electrochemical sensor",
	"ZE08-CH2O": "Electrochemical formaldehyde sensor",
	"ZE12-": "High-precision electrochemical sensor",
	"ZE25-O3": "Electrochemical O<sub>3</sub> sensor",
	"AHT": "Meteorological sensor",
	"BMP": "BOSCH meteorological sensor",
	"BME": "BOSCH meteorological sensor",
	"MICS-VZ-89TE": "Metal-oxide VOCs sensor",
	"MICS-6814": "Metal-oxide CO, NO2, NH3 sensor",
	"RadKit": "Dosimeter module by BeeGreen",
}

var display_mode = "last"; // or "send"

var button_last = getE("v_last");
var button_send = getE("v_send");

button_last.onclick = () => {
	display_mode = "last";
	button_last.classList.add("selected");
	button_send.classList.remove("selected");
	updateLiveData();
}

button_send.onclick = () => {
	display_mode = "send";
	button_send.classList.add("selected");
	button_last.classList.remove("selected");
	updateLiveData();
}

var xhr = null;

getXmlHttpRequestObject = function () {
	if (!xhr) {
		// Create a new XMLHttpRequest object 
		xhr = new XMLHttpRequest();
	}
	return xhr;
};

updateLiveData = function () {
	var now = new Date();
	var file_name = display_mode;
	// Date string is appended as a query with live data 
	// for not to use the cached version
	var url = 'data/' + file_name + '.json?' + now.getTime();
	console.log(url);
	xhr = getXmlHttpRequestObject();
	xhr.onreadystatechange = evenHandler;
	// asynchronous requests
	xhr.open("GET", url, true);
	// Send the request over the network
	xhr.send(null);
};

updateLiveData();

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

function evenHandler() {
	// Check response is ready or not
	if (xhr.readyState == 4 && xhr.status == 200) {
		var obj = JSON.parse(xhr.responseText);

		var by_sensor = obj["variables"].reduce((group, value) => {
			const { sensor } = value;
			group[sensor] = group[sensor] ?? [];
			group[sensor].push(value);
			return group;
		}, {});

		console.log(by_sensor);

		var table = getE("values-table");
		var child = table.lastElementChild; 
        while (child) {
            table.removeChild(child);
            child = table.lastElementChild;
        }

		Object.keys(by_sensor).forEach(e => {

			// Sensor panel
			var s = createE("div");
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

				var v = createE("div");

				var level = findLevel(e);
				if (level != undefined)
				{
					v.classList.add("level-" + level);
				}

				// Type
				var t = createE("small");
				t.innerHTML = e["type"];
				v.appendChild(t);

				// Value
				var t = createE("div");
				t.innerHTML = e["value"];
				v.appendChild(t);

				// Type
				var t = createE("small");
				t.innerHTML = e["unit"];
				v.appendChild(t);

				// Add to values container
				vs.appendChild(v);
			})

			// Add values container
			s.appendChild(vs);

			table.appendChild(s);
			
		})

		

		try 
		{
			

			// if (obj["variables"].length > 0) 
			// {
			// 	for (var i = 0; i < obj["variables"].length; i++) 
			// 	{
			// 		var val_obj = obj["variables"][i];
			// 		var sensor_value = val_obj["value"];
	
			// 		var color = findColor(sensor_value);

			// 		var sensor_d = createE("div");
			// 	}


			// }
		}
		catch
		{
			console.error("live data parse");
			return;
		}
	}
}