var flag = 2

if(typeof(Storage) == "undefined"){
	localStorage.proxyConfig = "system";
}

var pconfig = localStorage.getItem("proxyConfig")
if(pconfig == 'system'){
	let proxySettings = {
	  proxyType: "system"
	};

	browser.proxy.settings.set({value: proxySettings})
	localStorage.proxyConfig = "system";
	document.getElementById("system").setAttribute("hidden", "hidden");
	document.getElementById("fixed_servers").removeAttribute("hidden")
	document.getElementById("settingsConfig").removeAttribute("hidden")	
	document.getElementById('proxyHostHttp').value = "localhost";
    document.getElementById('proxyPortHttp').value = "6666"
}else if(pconfig == 'manual'){
	document.getElementById("fixed_servers").setAttribute("hidden", "hidden");
	document.getElementById("system").removeAttribute("hidden")
	document.getElementById("settingsConfig").setAttribute("hidden", "hidden");

}

//$('input[id=proxyTypeSystem]').click(function() {
document.getElementById("proxyTypeSystem").addEventListener('click', function() {
	document.getElementById("system").setAttribute("hidden", "hidden");
	document.getElementById("fixed_servers").removeAttribute("hidden")
	document.getElementById("settingsConfig").removeAttribute("hidden")	
	//document.getElementsByClassName("proxyFailMsg").classList.add("nonDisplay");
	//document.getElementsByClassName("proxyFailMsg").classList.remove("visible");

	let proxySettings = {
	  proxyType: "system"
	};
	browser.proxy.settings.set({value: proxySettings})
	localStorage.proxyConfig = "system";
	document.getElementById('proxyHostHttp').value = "localhost";
    document.getElementById('proxyPortHttp').value = "6666"
	
});

document.getElementById("proxyTypeManual").addEventListener('click', function() {
	document.getElementById("fixed_servers").setAttribute("hidden", "hidden");
	document.getElementById("system").removeAttribute("hidden")
	document.getElementById("settingsConfig").setAttribute("hidden", "hidden");

	var host = document.getElementById('proxyHostHttp').value
	var port = document.getElementById('proxyPortHttp').value
	var local = ""
	if(host.length > 0 && port.length >0){
		local = host+":"+port
	}
	let proxySettings = {
	  proxyType: "manual",
	  http: local,
	  socksVersion: 4,
	  //passthrough: ".example.org"
	  httpProxyAll: true
	};
	browser.proxy.settings.set({value: proxySettings})
	localStorage.proxyConfig = "manual";

});


document.getElementById("settingsConfig").addEventListener('click', function() {
	if(flag == 2){	
		document.getElementById("proxyHost").removeAttribute("hidden")
		flag = 1;
	}else{
		document.getElementById("proxyHost").setAttribute("hidden", "hidden");
		flag = 2;
	}
});


function transferComplete(evt) {
  alert("The transfer is complete.");
}

function transferFailed(evt) {
  console.log("An error occurred while transferring the file.");
}

function transferCanceled(evt) {
  console.log("The transfer has been canceled by the user.");
}


function getHaproxyStats(host,port){
	var oReq = new XMLHttpRequest();
	
	oReq.addEventListener("load", transferComplete);
	oReq.addEventListener("error", transferFailed);
	oReq.addEventListener("abort", transferCanceled);
	oReq.open("GET", "http://google.com");
	oReq.send();

	setTimeout(getHaproxyStats(), 15000);

}
//document.getElementById("proxyTypeManual").addEventListener('click', getHaproxyStats());


