import * as u from "./utils.js";

b_paste.onclick = e => {
	try {
		navigator.clipboard.readText().then((clipText) =>
		password.value = clipText);	
	} catch (e) {
		console.log(e);
	}
}

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