// default variables, initialization

var flag = 2;

var defaultHost = "localhost";
var defaultPort = "8180";

var GREEN = [124, 252, 0, 255];
var RED = [255, 0, 0, 255];
var YELLOW = [255, 205, 0, 255];

var connectionStatus = false;

var geoip_URL = "https://geoip.nekudo.com/api/";


// interval between each online check. Increase if successfull, decrease if unsuccessfull
var defaultOnlineCheckTimeout = 5000;
var onlineCheckTimeout = 5000;
var onlineTimeoutID = 0; // id of the latest timeout so we can reset it if needed

// string when values to be shown are not available
var stringNotAvailable = "[not available]";


// connection port
var portFromCS = null;

// array of pending messages to be sent between background and content script
var pendingMessages = [];


// reset the timeout for validating online
function resetTimeoutOnline() {
	console.log("Clearing timeout ID " + onlineTimeoutID);
	
	// timeout
	var newExecution = Date.now() + onlineCheckTimeout;
	console.log(newExecution + " " + Date.now());
	
	// recall online validation with new timeout
	browser.alarms.clearAll();
	browser.alarms.create("checkOnlineStatus", {
		when: newExecution
	});
}

// reset intervals between online checks and call the method again
function setOnlineTimerCheck(value) {
	onlineCheckTimeout = value;
	resetTimeoutOnline();
}

// reset intervals between online checks and call the method again
function resetOnlineTimerCheck() {
	onlineCheckTimeout = defaultOnlineCheckTimeout;
	resetTimeoutOnline();
}









if (typeof(Storage) == "undefined") {
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







// sets the values on the connected screen
function setConnectionValues(providerName, serviceName, timeOnline, serverIP, dataTransferred) {
	console.log("Setting Connection Values");
	document.getElementById('providerName').innerHTML = providerName;
	document.getElementById('serviceName').innerHTML = serviceName;
	document.getElementById('timeOnline').innerHTML = timeOnline;
	setServerIP(serverIP);
	document.getElementById('dataTransferred').innerHTML = dataTransferred;
}





// process response received from online check validation
function onlineStatusResponseCheck(request) {
	console.log("onlineStatusResponseCheck " + request.status);
	
	console.log(response);
	
	if (request.status == 200) {
		var response = JSON.parse(request.response);
		
		setServerIP(response.ip);
		
		updateBadge(true);
		
		// increase interval for checks if last request was successfull and recursively call to the function
		setOnlineTimerCheck(6 * defaultOnlineCheckTimeout);
	}
	else if (request.status == 0) {
		updateBadge(false);
		
		setServerIP(stringNotAvailable);
		
		// reset interval for checks if last request was unsuccessfull and recursively call to the function
		resetOnlineTimerCheck();
	}
	
	showLoadingScreen(false);
}

// listener for alarm to trigger online check validation
browser.alarms.onAlarm.addListener((alarm) => {
	checkOnlineStatus();
});




// check if extension is online
function checkOnlineStatus() {
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			console.log("Response received after checking for connectivity");
			
			onlineStatusResponseCheck(xmlhttp);
			// this is in miliseconds, not sure why!
			//setTimeout(checkOnlineStatus(), 100000000000);
		}
	}
	
	xmlhttp.open("GET", geoip_URL, true);
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();
}




/* communication with content script begin */
function connected(p) {
	console.log("Connected to content script");
	
	portFromCS = p;
	
	portFromCS.onMessage.addListener(function(m) {
		console.log("In background script, received message from content script")
		console.log(m);
		
		// we received a method request from the background thread
		if (m.method != undefined) {
			processReceivedMessage(m);
		}
	});
	
	if (pendingMessages.length != 0) {
		console.log("We have messages pending processing");

		pendingMessages.forEach(function(element) {
			console.log(element);
			portFromCS.postMessage(element);
		});
		
		pendingMessages = [];
		
	}
}


// send server ip to content script
function setServerIP(serverIP) {
	var message = {method: "ip", parms: [ serverIP ]};
	
	if (portFromCS == null || portFromCS.disconnected) {
		console.log("No Connection to content script");
		pendingMessages.push(message);
		return;
	}
	
	portFromCS.postMessage(message);
}


function showLoadingScreen(state) {
	var message = {method: "loading", parms: [ state ]};
	
	if (portFromCS == null || portFromCS.disconnected) {
		console.log("No Connection to content script");
		pendingMessages.push(message);
		return;
	}
	
	portFromCS.postMessage(message);
}

function processReceivedMessage(m) {
	if (m.method == 'timer') {
		resetOnlineTimerCheck();
	}
}


browser.runtime.onConnect.addListener(connected);
/* communication with content script end */




// activate method to check if we are online
resetOnlineTimerCheck();


//updateProxyStats();
