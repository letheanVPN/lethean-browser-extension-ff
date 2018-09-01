var flag = 2;

var defaultHost = "localhost";
var defaultPort = "8180";

if (typeof(Storage) == "undefined"){
	localStorage.proxyConfig = "system";
}

var pconfig = localStorage.getItem("proxyConfig");

if (pconfig == 'system') {
		
	var proxySettings = {
		proxyType: "system"
	};

	browser.proxy.settings.set({value: proxySettings})
	localStorage.proxyConfig = "system";
	document.getElementById("system").setAttribute("hidden", "hidden");
	document.getElementById("fixed_servers").removeAttribute("hidden")
	document.getElementById("settingsConfig").removeAttribute("hidden")	
	document.getElementById('proxyHostHttp').value = defaultHost;
    document.getElementById('proxyPortHttp').value = defaultPort;
}
else if(pconfig == 'manual') {
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
	document.getElementById('proxyHostHttp').value = defaultHost;
    document.getElementById('proxyPortHttp').value = defaultPort;
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



















/* dashboard page updates procedures */
function setServerIP(ip) {
	serverIP = ip;
	
	console.log("Setting server IP to " + serverIP);
	document.getElementById('serverIP').innerHTML = serverIP;
}

// sets the values on the connected screen
function setConnectionValues(providerName, serviceName, timeOnline, serverIP, dataTransferred) {
	console.log("Setting Connection Values");
	document.getElementById('providerName').innerHTML = providerName;
	document.getElementById('serviceName').innerHTML = serviceName;
	document.getElementById('timeOnline').innerHTML = timeOnline;
	setServerIP(serverIP);
	document.getElementById('dataTransferred').innerHTML = dataTransferred;
}






function onlineStatusResponseCheck(request) {
	if (request.status == 200) {
		var response = JSON.parse(request.response);
		
		setServerIP(response.ip);
	}
	else if (request.status == 0) {
	}
}

// check if extension is online
function checkOnlineStatus() {
	var url = "https://geoip.nekudo.com/api/";
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState === 4) {
			console.log("Response received after checking for connectivity");
			onlineStatusResponseCheck(xmlhttp);
			// this is in miliseconds, not sure why!
			//setTimeout(checkOnlineStatus(), 100000000000);
		}
	}
	
	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();
}

checkOnlineStatus();

//document.getElementById("proxyTypeManual").addEventListener('click', getHaproxyStats());