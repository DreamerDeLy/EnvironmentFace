
function getE(name){
	return document.getElementById(name);
}

function getEc(name){
	return document.getElementsByClassName(name);
}

function hideLoading() {
	setTimeout(() => { getE("loading").style.opacity = "0"; }, 1000)
	setTimeout(() => { getE("loading").style.display = "none"; }, 3000)
}
hideLoading();