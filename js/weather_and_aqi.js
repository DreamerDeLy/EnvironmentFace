function getE(name){
	return document.getElementById(name);
}

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
				getE("city").classList.remove("hide");

				var weather_icon = data.weather.forecast.icon;
				var data_temperature = data.weather.current.temp;
				var data_humidity = data.weather.current.humidity;
				var data_city_name = data.weather.current.name;

				if (weather_icon != null)
				{
					weather_icon = weather_icon.substring(0, 2);
					if (weather_icon == "04") weather_icon = "03";
	
					getE("weather_icon").src = "/images/weather/" + weather_icon + ".svg";
				}
	
				if (data_temperature != null && data_humidity != null)
				{
					getE("weather_temperature").innerHTML = Math.round(data_temperature);
					getE("weather_humidity").innerHTML = Math.round(data_humidity);
				}
	
				if (data_city_name != null)
				{
					getE("weather_city").innerHTML = data_city_name;
				}
			}

			if (data.ao != null) 
			{
				getE("city_aqi").classList.remove("hide");

				var data_city_aqi = data.ao.aqi;
				// var data_city_name = data.ao.short_name;

				if (data_city_aqi != null) {
					getE("aqi").innerHTML = Math.round(data_city_aqi);

					var aqi_level = getAqiLevel(data_city_aqi);
					getE("city_aqi").classList.add("level-" + aqi_level);

					// getE("ao_city_name").innerHTML = data_city_name;
				}
			}
		} 
	}; 
	x.send(); 
}

window.setTimeout(loadWeatherData, 1000)
window.setInterval(loadWeatherData, 60 * 1000);