var flag = 2;

var defaultHost = "localhost";
var defaultPort = "8180";

var GREEN = [124, 252, 0, 255];
var RED = [255, 0, 0, 255];
var YELLOW = [255, 205, 0, 255];

var connectionStatus = false;

if (typeof(Storage) == "undefined"){
	localStorage.proxyConfig = "system";
}

var pconfig = localStorage.getItem("proxyConfig");

if (pconfig == 'system') { // disconnected
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
	
	connectionStatus = false;
	updateBadge(connectionStatus);
});

document.getElementById("proxyTypeManual").addEventListener('click', function() { // connected
	document.getElementById("fixed_servers").setAttribute("hidden", "hidden");
	document.getElementById("system").removeAttribute("hidden")
	document.getElementById("settingsConfig").setAttribute("hidden", "hidden");

	var host = document.getElementById('proxyHostHttp').value
	var port = document.getElementById('proxyPortHttp').value
	var local = ""
	if(host.length > 0 && port.length >0){
		local = host + ":" + port
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
	
	connectionStatus = true;
	updateBadge(connectionStatus);
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
		
		updateBadge(true);
	}
	else if (request.status == 0) {
		updateBadge(false);
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







// update connection stats if we are indeed connected
function updateProxyStats() {
	var haproxyIp = document.getElementById('proxyHostHttp').value;
    var haproxyPort = parseInt(document.getElementById('proxyPortHttp').value, 10);
	
	// return and check later if host or port is invalid
	if (haproxyIp == "" || isNaN(haproxyPort)) {
		setTimeout(function() {
			updateProxyStats();
		}, 5000);
		
		return;
	}
	
	var url = "http://" + haproxyIp + ":" + haproxyPort + "/haproxy_stats;csv";
	
	console.log("Checking HAProxy @ " + url);
		
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var haproxyStats = csvToArray(xmlhttp.responseText);
			haproxyStats = JSON.stringify(haproxyStats[1]);
			haproxyStats = haproxyStats.split(',');
			haproxyStats[8] = haproxyStats[8].replace('"', '');
			haproxyStats[9] = haproxyStats[9].replace('"', '');
			console.log("Download: " + formatBytes(parseInt(haproxyStats[8])) + " / Upload: "+ formatBytes(parseInt(haproxyStats[9])));
			
			/*
			setTimeout(function() {
				updateProxyStats();
			}, 5000);
			*/
		}
		/*
		console.log(xmlhttp);
		console.log(xmlhttp.responseText);
		*/
	}

	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 2000; // time in milliseconds
    xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
    xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
    xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
    xmlhttp.send();
	
	//setConnectionValues("Provider", "Service", "Time Online", "Server IP", "Data");
}


// update badge depending on connection status
function updateBadge(connected) {
	// if we don't check connection status extension will report connected with clients default ip address
	if (connected == false || connectionStatus == false) {
		browser.browserAction.setBadgeText({ text: "X" });
		browser.browserAction.setBadgeBackgroundColor({color: RED});
	}
	else {
		browser.browserAction.setBadgeText({ text: "O" });
		browser.browserAction.setBadgeBackgroundColor({color: GREEN});
	}
}





checkOnlineStatus();

updateProxyStats();

//document.getElementById("proxyTypeManual").addEventListener('click', getHaproxyStats());