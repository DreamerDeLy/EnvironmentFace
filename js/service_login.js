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

b_paste.onclick = e => {
	try {
		navigator.clipboard.readText().then((clipText) =>
		password.value = clipText);	
	} catch (e) {
		console.log(e);
	}
}

password.addEventListener("keypress", e => {
	if (e.key === "Enter") {
		// Cancel the default action, if needed
		e.preventDefault();

		b_login.click();
	}
});

b_login.onclick = e => {
	console.log("login");

	if (password.value == "")
	{
		window.alert("Password field is empty!");
		return;
	}

	let xhr = new XMLHttpRequest();
	xhr.open("POST", "/service_login");
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
			
			if (xhr.status == 200)
			{
				logged();
				window.location.assign("/service?logged");
			}
			else if (xhr.status == 401)
			{
				window.alert("Incorrect password!");
			}
			else
			{
				window.alert("ERROR: Something went wrong...");
			}
		}
	};

	xhr.send("password="+encodeURIComponent(password.value));
}

function logged() {
	password_box.classList.add("hide");
	welcome_box.classList.remove("hide");
}

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has("logged")) logged();