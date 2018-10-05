// default variables, initialization
var GREEN = [124, 252, 0, 255];
var RED = [255, 0, 0, 255];
var YELLOW = [255, 205, 0, 255];

var connectionStatus = false;

// url to get current IP address
var geoip_URL = "https://geoip.nekudo.com/api/";
// url to get transferred stats
var haproxy_stats_URL = "/stats";
// url to get provider and plan
var haproxy_provider_URL = "/provider";

// connection port
var portFromCS = null;

// array of pending messages to be sent between background and content script
var pendingMessages = [];

if (typeof(Storage) == "undefined") {
	localStorage.proxyConfig = "system";
	browser.browserAction.setBadgeText({ text: "" });
}

// check if extension is online
function checkOnlineStatus() {
	console.log("checkStatus")
	var xmlhttp = new XMLHttpRequest();
	var pconfig = localStorage.getItem("proxyConfig");
	if(pconfig == 'manual') {
		console.log("get status only in manual")
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status == 200) {
					var response = JSON.parse(xmlhttp.response);
					console.log(response + " my response")
					console.log(response.ip + " my IP response")
					//setServerIP();
					//updateBadge(true);
					console.log("get IP")
					//document.getElementById('serverIP').innerHTML = response.ip;
					browser.browserAction.setBadgeText({ text: "O" });
					browser.browserAction.setBadgeBackgroundColor({color: GREEN});

					var message = {method: "ip", parms: response.ip};
					sendMessageToContentScript(message);
					
					// increase interval for checks if last request was successfull and recursively call to the function
					//setOnlineTimerCheck(6 * defaultOnlineCheckTimeout);
				}
				else if (xmlhttp.status == 0) {
					console.log("getERROR")
					browser.browserAction.setBadgeText({ text: "X" });
					browser.browserAction.setBadgeBackgroundColor({color: RED});
					//updateBadge(false);
					//setServerIP(stringNotAvailable);
					// reset interval for checks if last request was unsuccessfull and recursively call to the function
					//resetOnlineTimerCheck();

					var message = {method: "stats", parms: "error"};
					sendMessageToContentScript(message);

				}
				// TODO - what to do in case of other status
				console.log("call show loading false")
				showLoadingScreen(false);
				
			}
		}
	}

	setTimeout(function() {
		checkOnlineStatus();
	}, 5000);

	xmlhttp.open("GET", geoip_URL, true);
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();	
}

checkOnlineStatus();



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
	

	portFromCS.onDisconnect.addListener(function(m) {
		console.log("Content script has disconnected");
		portFromCS = null;
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


// send generic message to content script
function sendMessageToContentScript(message) {
	if (portFromCS == null) {
		console.log("No Connection to content script");
		pendingMessages.push(message);
		return;
	}
	
	portFromCS.postMessage(message);
}

// send server ip to content script
function setServerIP(serverIP) {
	var message = {method: "ip", parms: [ serverIP ]};
	
	sendMessageToContentScript(message);
}

// send proxy stats to content script
function setProxyStats(onlineTime, transferredData) {
	var message = {method: "stats", parms: [ timer(onlineTime), transferredData ]};
	
	sendMessageToContentScript(message);
}

// send provider details to content script
function setProxyProvider(provider, service) {
	var message = {method: "provider", parms: [ provider, service ]};
	
	sendMessageToContentScript(message);
}

// send loading screen update to content script
function showLoadingScreen(state) {
	var message = {method: "loading", parms: [ state ]};
	
	sendMessageToContentScript(message);
}

browser.runtime.onConnect.addListener(connected);
/* communication with content script end */
