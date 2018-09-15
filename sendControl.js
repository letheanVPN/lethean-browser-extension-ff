

document.getElementById("proxyTypeSystem").addEventListener('click', function() { // disconnect click
	console.log("Disconnect Clicked");

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
	document.getElementById('proxyHostHttp').value = localStorage.getItem('proxyHost');
    document.getElementById('proxyPortHttp').value = localStorage.getItem('proxyPort');
	
	connectionStatus = false;
	updateBadge(connectionStatus);
});

document.getElementById("proxyTypeManual").addEventListener('click', function() { // connect click
	console.log("Connect Clicked");
	
	// show loading screen
	showLoadingScreen(true);

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
	
	resetOnlineTimerCheck();
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


// dashboard page updates - ip - received from background script
function setServerIP(ip) {
	serverIP = ip;
	
	console.log("Setting server IP to " + serverIP);
	document.getElementById('serverIP').innerHTML = serverIP;
}

// dashboard page updates - stats - received from background script
function setProxyStats(onlineTime, transferredData) {
	console.log("Setting Online time to " + onlineTime + " and transferred data to " + transferredData);
	
	document.getElementById('timeOnline').innerHTML = onlineTime;
	document.getElementById('dataTransferred').innerHTML = transferredData;
}

// dashboard page updates - provider - received from background script
function setProxyProvider(provider, service) {
	console.log("Setting Provider to " + provider + " and serviceName to " + service);
	
	document.getElementById('providerName').innerHTML = provider;
	document.getElementById('serviceName').innerHTML = service;
}




function showLoadingScreen(state) {
	if (state == true) {
		document.getElementById("loadingScreen").removeAttribute("hidden");
	}
	else {
		document.getElementById("loadingScreen").setAttribute("hidden", "hidden");
	}
}











/* communication with background script BEGIN */
var myPort = browser.runtime.connect({name:"port-from-cs"});

// array of pending messages to be sent between background and content script
var pendingMessages = [];

console.log("myPort in content script");
console.log(myPort);

myPort.onMessage.addListener(function(m) {
  console.log("In content script, received message from background script: ");
  console.log(m);
  
  // we received a method request from the background thread
  if (m.method != undefined) {
	  processReceivedMessage(m);
  }
});

// process messages sent by background script
function processReceivedMessage(m) {
	if (m.method == 'ip') {
		setServerIP(m.parms[0]);
	}
	else if (m.method == 'loading') {
		showLoadingScreen(m.parms[0]);
	}
	else if (m.method == 'provider') {
		setProxyProvider(m.parms[0], m.parms[1]);
	}
	else if (m.method == 'stats') {
		setProxyStats(m.parms[0], m.parms[1]);
	}
}


// update badge depending on connection status
function updateBadge(connected) {
	var message = {method: "badge", parms: [ connected ]};
	
	if (myPort == null || myPort.disconnected) {
		console.log("No Connection to background script");
		pendingMessages.push(message);
		return;
	}
	
	myPort.postMessage(message);
}


// timer reset needs to be called in background script
function resetOnlineTimerCheck() {
	var message = {method: "timer", parms: [ ]};
	
	if (myPort == null || myPort.disconnected) {
		console.log("No Connection to background script");
		pendingMessages.push(message);
		return;
	}
	
	myPort.postMessage(message);
}

/* communication with background script END */










// hide loading screen after startup
showLoadingScreen(false);