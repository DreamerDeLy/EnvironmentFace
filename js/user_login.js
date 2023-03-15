password.addEventListener("keypress", e => {
	if (e.key === "Enter") {
		// Cancel the default action, if needed
		e.preventDefault();

		b_login.click();
	}
});

user.addEventListener("keypress", e => {
	if (e.key === "Enter") {
		password.focus();
	}
});

b_login.onclick = e => {
	console.log("login");

	if (user.value == "")
	{
		window.alert("User field is empty!");
		return;
	}

	let xhr = new XMLHttpRequest();
	xhr.open("POST", "/user_login");
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			console.log("HTTP status: " + xhr.status + "\nResponse: \"" + xhr.responseText + "\"");
			
			if (xhr.status == 200)
			{
				window.location.assign("/");
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

	xhr.send("password="+encodeURIComponent(password.value)+"&user="+encodeURIComponent(user.value));
}