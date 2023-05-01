import * as u from "./utils.js";

function parseInfo(json) {
	var data = JSON.parse(json);

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