// default variables, initialization

var flag = 2;

var defaultHost = "localhost";
var defaultPort = "8181";

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


// interval between each online check. Increase if successfull, decrease if unsuccessfull
var defaultOnlineCheckTimeout = 5000;
var onlineCheckTimeout = 5000;
var onlineTimeoutID = 0; // id of the latest timeout so we can reset it if needed

// interval between each connection information check. currently it does not increase nor decrease
var defaultConnectionInformationCheckTimeout = 10000;
var connectionInformationCheckTimeout = 10000;
var connectionInformationTimeoutID = 0; // id of the latest timeout so we can reset it if needed

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
	console.log(Date.now() + " " + newExecution);
	
	// recall online validation with new timeout
	browser.alarms.clear("checkOnlineStatus");
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






// reset the timeout for validating connectionInformation
function resetTimeoutConnectionInformation() {
	console.log("Clearing ConnectionInformation timeout ID " + connectionInformationTimeoutID);
	
	// timeout
	var newExecution = Date.now() + connectionInformationCheckTimeout;
	console.log(Date.now() + " " + newExecution);
	
	// recall online validation with new timeout
	browser.alarms.clear("checkConnectionInformation");
	browser.alarms.create("checkConnectionInformation", {
		when: newExecution
	});
}


// reset intervals between connection checks and call the method again
function resetConnectionInformationTimerCheck() {
	connectionInformationCheckTimeout = defaultConnectionInformationCheckTimeout;
	resetTimeoutConnectionInformation();
}





// setup localStorage variables
// set default value in storage
if (localStorage.getItem('proxyHost') == null) {
	localStorage.setItem('proxyHost', defaultHost);
}
if (localStorage.getItem('proxyPort') == null) {
	localStorage.setItem('proxyPort', defaultPort);
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






// listener for alarms to trigger online check validation
browser.alarms.onAlarm.addListener((alarm) => {
	console.log("Received alarm");
	if (alarm.name == "checkOnlineStatus") {
		checkOnlineStatus();
	}
	else if (alarm.name == "checkConnectionInformation") {
		checkProxyStats();
		checkProxyProvider();
	}
	else {
		console.log("Unhandled alarm!");
	}
});







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
	// TODO - what to do in case of other status
	
	showLoadingScreen(false);
}




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


// check proxy stats
function checkProxyStats() {
	var haproxyHost = localStorage.getItem('proxyHost');
	var haproxyPort = parseInt(localStorage.getItem('proxyPort'), 10);
	
	// return and check later if host or port is invalid
	if (haproxyHost == "" || isNaN(haproxyPort)) {
		console.log("Invalid HaProxy Host (" + haproxyHost + ") or Port (" + haproxyPort + ")");
		
		resetConnectionInformationTimerCheck();
		
		return;
	}
	
	
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			console.log("Response received after checking proxy stats");
			
			proxyStatsResponseCheck(xmlhttp);
		}
	}


	var url = "http://" + haproxyHost + ":8181/stats;csv";
	
	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();
}

function csvToArray( strData, strDelimiter ){
  strDelimiter = (strDelimiter || ",");
  var objPattern = new RegExp(
      (
          // Delimiters.
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
      "gi"
      );

  var arrData = [[]];

  var arrMatches = null;
  while (arrMatches = objPattern.exec( strData )){

      var strMatchedDelimiter = arrMatches[ 1 ];
      if (
          strMatchedDelimiter.length &&
          strMatchedDelimiter !== strDelimiter
          ){
          arrData.push( [] );

      }

      var strMatchedValue;
      if (arrMatches[ 2 ]){
          strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
              );

      } else {
          strMatchedValue = arrMatches[ 3 ];
      }

      arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  return( arrData );
}


function timer(time) {
  secs = parseFloat(time)
  console.log(secs + " my secs ------------")
  var h = secs/60/60
  var m = (secs/60)%60
  var s = secs%60
  var array = [h,m,s].map(Math.floor)
  var value = ''
  for(x = 0; x < array.length; x++){
      if(array[x] < 10){
          array[x] = "0" + array[x]
      }else{
          array[x] = array[x]
      }
      function getCom(y){
          if(y < 2){return ":"}else{return ""}
      }
      var c = getCom(x)
      value = value + array[x] + c
  }

  return value

}



// update connection stats if we are indeed connected
function proxyStatsResponseCheck(response) {	
	console.log("proxyStatsResponseCheck " + response.status);
	
	console.log(response);
	
	if (response.status == 200) {
		var haproxyStats = csvToArray(response.responseText);
		haproxyStats = JSON.stringify(haproxyStats[1]);
		console.log(haproxyStats + "my haproxyStats")
		haproxyStats = haproxyStats.split(',');
		haproxyStats[8] = haproxyStats[8].replace('"', '');
		haproxyStats[9] = haproxyStats[9].replace('"', '');
		
		var data = "D: " + formatBytes(parseInt(haproxyStats[9])) + " U: " + formatBytes(parseInt(haproxyStats[8]));
		console.log("Download: " + formatBytes(parseInt(haproxyStats[8])) + " / Upload: "+ formatBytes(parseInt(haproxyStats[9])));
		// parse time online from /stats;csv
		haproxyStats = csvToArray(response.responseText);
		haproxyStats = JSON.stringify(haproxyStats[3]);
		console.log(haproxyStats + "my haproxyStats")
		haproxyStats = haproxyStats.split(',');
		haproxyStats[23] = haproxyStats[23].replace('"', '');

		var timeOnline = haproxyStats[23];
		
		setProxyStats(timeOnline, data);
		
		//setProxyStats(timeOnline, "D: " + download + " U: " + upload);
	}
	else {
		setProxyStats("ERROR", "ERROR");
	}
}





// check proxy stats
function checkProxyProvider() {
	var haproxyHost = localStorage.getItem('proxyHost');
	var haproxyPort = parseInt(localStorage.getItem('proxyPort'), 10);
	
	// return and check later if host or port is invalid
	if (haproxyHost == "" || isNaN(haproxyPort)) {
		console.log("Invalid HaProxy Host (" + haproxyHost + ") or Port (" + haproxyPort + ")");
		
		resetConnectionInformationTimerCheck();
		
		return;
	}
	
	
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			console.log("Response received after checking proxy stats");
			
			proxyProviderResponseCheck(xmlhttp);
		}
	}
	
	var urlProvider = "http://127.0.0.1:8182/provider";
	xmlhttp.open("GET", urlProvider, true);
	xmlhttp.responseType = 'json';
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();
}



// update connection stats if we are indeed connected
function proxyProviderResponseCheck(response) {	
	console.log("proxyProviderResponseCheck " + response.status);
	
	console.log(response);
	
	if (response.status == 200) {
		console.log(response.responseText);
		var providerStats = JSON.parse(response.responseText);
		console.log(providerStats.provider + " my provider 0")
		console.log(providerStats.service + " my provider 0")
		//document.getElementById("providerName").innerText = providerStats.provider;
		//document.getElementById("serviceName").innerText = providerStats.service;
		setProxyProvider(providerStats.provider, providerStats.service);
		
		//setProxyProvider(response.provider, response.service);
	}
	else {
		setProxyProvider("ERROR", "ERROR");
	}
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
	var message = {method: "stats", parms: [ onlineTime, transferredData ]};
	
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

// process received messages from content script
function processReceivedMessage(m) {
	if (m.method == 'timer') {
		resetOnlineTimerCheck();
	}
}


browser.runtime.onConnect.addListener(connected);
/* communication with content script end */







// activate method to check if we are online
resetOnlineTimerCheck();

// activate method to check connection information
resetConnectionInformationTimerCheck();