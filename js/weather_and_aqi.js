import * as u from "./utils.js";

function getAqiLevel(aqi)
{
	if (aqi < 50) return 0;
	if (aqi < 100) return 1;
	if (aqi < 150) return 2;
	if (aqi < 200) return 3;
	if (aqi < 300) return 4;
	return 5;
}

function loadWeatherData() 
{
	var x = new XMLHttpRequest(); 
	x.open("GET", "/data/weather_and_aqi.json"); 
	x.onload = function () 
	{ 
		if (x.status === 200) 
		{ 
			var data = JSON.parse(x.responseText);

			console.log(data);

			if (data.weather.current != null && data.weather.forecast != null)
			{
				u.getE("city").classList.remove("hide");

				var weather_icon = data.weather.forecast.icon;
				var data_temperature = data.weather.current.temp;
				var data_humidity = data.weather.current.humidity;
				var data_city_name = data.weather.current.name;

				if (weather_icon != null)
				{
					weather_icon = weather_icon.substring(0, 2);
					if (weather_icon == "04") weather_icon = "03";
	
					u.getE("weather_icon").src = "/images/weather/" + weather_icon + ".svg";
				}
	
				if (data_temperature != null && data_humidity != null)
				{
					u.getE("weather_temperature").innerHTML = Math.round(data_temperature);
					u.getE("weather_humidity").innerHTML = Math.round(data_humidity);
				}
	
				if (data_city_name != null)
				{
					u.getE("weather_city").innerHTML = data_city_name;
				}
			}

			if (data.ao != null) 
			{
				u.getE("city_aqi").classList.remove("hide");

				var data_city_aqi = data.ao.aqi;
				// var data_city_name = data.ao.short_name;

				if (data_city_aqi != null) {
					u.getE("aqi").innerHTML = Math.round(data_city_aqi);

					var aqi_level = getAqiLevel(data_city_aqi);
					u.getE("city_aqi").classList.add("level-" + aqi_level);

					// u.getE("ao_city_name").innerHTML = data_city_name;
				}
			}
		} 
		else
		{
			console.error("Loading weather and aqi failed");
			console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
		}
	}; 
	x.send(); 
}

window.setTimeout(() => { loadWeatherData() }, 100)
window.setInterval(() => { loadWeatherData() }, 60 * 1000);