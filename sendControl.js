var flag = 2;

var defaultHost = "127.0.0.1";
var defaultPort = "8180";

var pconfig = localStorage.getItem("proxyConfig");

var GREEN = [124, 252, 0, 255];
var RED = [255, 0, 0, 255];
var YELLOW = [255, 205, 0, 255];

var connectionStatus = null;

// url to get current IP address
var geoip_URL = "http://geo.geosurf.io/";
// url to get transferred stats
var haproxy_stats_URL = "/stats";
// url to get provider and plan
var haproxy_provider_URL = "/provider";

// string when values to be shown are not available
var stringNotAvailable = "[not available]";

// setup localStorage variables
// set default value in storage
if (localStorage.getItem('proxyHost') == null) {
	localStorage.setItem('proxyHost', defaultHost);
}
if (localStorage.getItem('proxyPort') == null) {
	localStorage.setItem('proxyPort', defaultPort);
}


function showLoadingScreen(state) {
	if (state == true) {
		document.getElementById("loadingScreen").removeAttribute("hidden");
	}
	else {
		document.getElementById("loadingScreen").setAttribute("hidden", "hidden");
	}
}

function updateBadge(connected) {
	// if we don't check connection status extension will report connected with clients default ip address
	if (connected == false || connectionStatus == false) {
		browser.browserAction.setBadgeText({ text: "X" });
		browser.browserAction.setBadgeBackgroundColor({color: RED});
	}
	else if(connected == true){
		browser.browserAction.setBadgeText({ text: "O" });
		browser.browserAction.setBadgeBackgroundColor({color: GREEN});
	}else{
		browser.browserAction.setBadgeText({ text: "" });
		browser.browserAction.setBadgeBackgroundColor({color: null});
	}
}

// check proxy stats
function checkProxyStats() {
	var haproxyHost = localStorage.getItem('proxyHost');
	var haproxyPort = parseInt(localStorage.getItem('proxyPort'), 10);
	
	// return and check later if host or port is invalid
	if (haproxyHost == "" || isNaN(haproxyPort)) {
		console.log("Invalid HaProxy Host (" + haproxyHost + ") or Port (" + haproxyPort + ")");
		
		//resetConnectionInformationTimerCheck();
		
		return;
	}
	
	
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var haproxyStats = csvToArray(xmlhttp.responseText);
				haproxyStats = JSON.stringify(haproxyStats[1]);
				haproxyStats = haproxyStats.split(',');
				haproxyStats[8] = haproxyStats[8].replace('"', '');
				haproxyStats[9] = haproxyStats[9].replace('"', '');
				
				var data = "D: " + formatBytes(parseInt(haproxyStats[9])) + " U: " + formatBytes(parseInt(haproxyStats[8]));
				// parse time online from /stats;csv
				haproxyStats = csvToArray(xmlhttp.responseText);
				haproxyStats = JSON.stringify(haproxyStats[3]);
				haproxyStats = haproxyStats.split(',');
				haproxyStats[23] = haproxyStats[23].replace('"', '');

				var timeOnline = haproxyStats[23];
				
				setProxyStats(timeOnline, data);

			}
			else {
				setProxyStats("ERROR", "ERROR");
			}
		}
	}


	var url = "http://127.0.0.1:8181/stats;csv";
	
	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();

	setTimeout(function() {
		checkProxyStats();
	}, 1000);
}

// get the ip server to show in dashboard
function getIp() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var response = JSON.parse(xmlhttp.responseText);
				setServerIP(response.ip);
			}
		}
	}

	xmlhttp.open("GET", geoip_URL, true);
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();

	setTimeout(function() {
		getIp();
	}, 5000);
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
  //console.log(secs + " my secs ------------")
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

// format a bytes number depending on the amount
function formatBytes(bytes,decimals) {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
	  dm = decimals || 2,
	  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
	  i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// check proxy stats
function checkProxyProvider() {
	var haproxyHost = localStorage.getItem('proxyHost');
	var haproxyPort = parseInt(localStorage.getItem('proxyPort'), 10);
	
	// return and check later if host or port is invalid
	if (haproxyHost == "" || isNaN(haproxyPort)) {
		//resetConnectionInformationTimerCheck();
		
		return;
	}
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var providerStats = JSON.parse(xmlhttp.responseText);
				setProxyProvider(providerStats.provider, providerStats.service);
			}
			else {
				setProxyProvider("ERROR", "ERROR");
			}
		}
	}
	
	var urlProvider = "http://127.0.0.1:8182/provider";
	xmlhttp.open("GET", urlProvider, true);
	//xmlhttp.responseType = 'json';
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();

	setTimeout(function() {
		checkProxyProvider();
	}, 10000);
}


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
	
	connectionStatus = null;
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
	
	//resetOnlineTimerCheck();
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


// dashboard page updates - ip
function setServerIP(ip) {
	console.log("Setting server IP to " + ip);
	document.getElementById('serverIP').innerHTML = ip;
}

// dashboard page updates - stats - received from background script
function setProxyStats(onlineTime, transferredData) {
	console.log("Setting Online time to " + onlineTime + " and transferred data to " + transferredData);
	
	document.getElementById('timeOnline').innerHTML = timer(onlineTime);
	document.getElementById('dataTransferred').innerHTML = transferredData;
}

// dashboard page updates - provider - received from background script
function setProxyProvider(provider, service) {
	console.log("Setting Provider to " + provider + " and serviceName to " + service);
	
	document.getElementById('providerName').innerHTML = provider;
	document.getElementById('serviceName').innerHTML = service;
}



/* communication with background script BEGIN */

var myPort = browser.runtime.connect({name:"port-from-cs"});

// array of pending messages to be sent between background and content script
var pendingMessages = [];

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
	if (m.method == 'stats') {
		document.getElementById("connectedMsg").innerText = "CONNECTION ERROR";
		document.getElementById("tryAgainMsg").innerText = "TRY AGAIN";
		document.getElementById("imgError").removeAttribute('hidden', 'hidden');
		document.getElementById("dataValue").setAttribute('hidden', 'hidden');

		document.getElementById("settingsConfig").setAttribute('hidden', 'hidden');

		// switch visible sections, hiding welcome screen and showing the other where error is shown
		document.getElementById("fixed_servers").setAttribute('hidden', 'hidden');
		document.getElementById("system").removeAttribute('hidden', 'hidden');

		document.getElementById("dataValue").setAttribute('hidden', 'hidden');
	}else if (m.method == 'loading') {
		showLoadingScreen(m.parms[0]);
	}
}


/* communication with background script END */


// hide loading screen after startup
showLoadingScreen(false);
checkProxyStats();
checkProxyProvider();
getIp();