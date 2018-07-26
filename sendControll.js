var flag = 2

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
	console.log("http://"+host+":"+port+"/haproxy_stats;csv");
	//oReq.addEventListener("progress", updateProgress);
	oReq.addEventListener("load", transferComplete);
	oReq.addEventListener("error", transferFailed);
	oReq.addEventListener("abort", transferCanceled);
	oReq.open("GET", "http://"+host+":"+port+"/haproxy_stats;csv");
	oReq.send();

	//setTimeout(getHaproxyStats(), 15000);

	/*
	var Request = require("sdk/request").Request;
	var quijote = Request({
		url: "http://"+host+":"+port+"/haproxy_stats",
		contentType: "application/json",
		//overrideMimeType: "text/plain; charset=latin1",
		onComplete: function (response) {
			console.log(response.text);
			if(response.status == 200){
				alert("Proxy working")
        		setTimeout(getHaproxyStats(), 5000);	
			}else{
				alert("Error Proxy");
			}
			
		}
	});

	quijote.get();

	/*
    var url = "http://"+host+":"+port+"/haproxy_stats"
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

        	alert("Proxy working")
        	setTimeout(getHaproxyStats(), 5000);

        }else if(xmlhttp.status != 200){
            alert("Error Proxy");

        }
    }

    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Access-Control-Allow-Origin","*")
    xmlhttp.send();
    */
}

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
	//document.getElementsByClassName("proxyFailMsg").classList.add("nonDisplay");
	//document.getElementsByClassName("proxyFailMsg").classList.remove("visible");
/*
	$("#system").attr("hidden", "hidden");
	$("#fixed_servers").removeAttr("hidden");
	$(".proxyFailMsg").removeClass('visible');
	$(".proxyFailMsg").addClass('nonDisplay');
	$("#settingsConfig").removeAttr("hidden");
*/
	document.getElementById('proxyHostHttp').value = "localhost";
    document.getElementById('proxyPortHttp').value = "6666"
}else if(pconfig == 'manual'){
	document.getElementById("fixed_servers").setAttribute("hidden", "hidden");
	document.getElementById("system").removeAttribute("hidden")
	document.getElementById("settingsConfig").setAttribute("hidden", "hidden");

	/*
	$("#fixed_servers").attr("hidden", "hidden");
	$("#system").removeAttr("hidden");
	$("#settingsConfig").attr("hidden", "hidden");
	*/
}

//$('input[id=proxyTypeSystem]').click(function() {
document.getElementById("proxyTypeSystem").addEventListener('click', function() {
	document.getElementById("system").setAttribute("hidden", "hidden");
	document.getElementById("fixed_servers").removeAttribute("hidden")
	document.getElementById("settingsConfig").removeAttribute("hidden")	
	//document.getElementsByClassName("proxyFailMsg").classList.add("nonDisplay");
	//document.getElementsByClassName("proxyFailMsg").classList.remove("visible");
	/*
	$("#system").attr("hidden", "hidden");
	$("#fixed_servers").removeAttr("hidden");
	$(".proxyFailMsg").removeClass('visible');
	$(".proxyFailMsg").addClass('nonDisplay');
	$("#settingsConfig").removeAttr("hidden");
	*/
	let proxySettings = {
	  proxyType: "system"
	};
	browser.proxy.settings.set({value: proxySettings})
	localStorage.proxyConfig = "system";
	document.getElementById('proxyHostHttp').value = "localhost";
    document.getElementById('proxyPortHttp').value = "6666"
	
});

//$('input[id=proxyTypeManual]').click(function() {
document.getElementById("proxyTypeManual").addEventListener('click', function() {
	document.getElementById("fixed_servers").setAttribute("hidden", "hidden");
	document.getElementById("system").removeAttribute("hidden")
	document.getElementById("settingsConfig").setAttribute("hidden", "hidden");
	/*
	$("#fixed_servers").attr("hidden", "hidden");
	$("#system").removeAttr("hidden");
	$("#settingsConfig").attr("hidden", "hidden");
	*/
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

	getHaproxyStats(host,port);
	

});


//$("#settingsConfig").click(function(){
document.getElementById("settingsConfig").addEventListener('click', function() {
	if(flag == 2){
		
		document.getElementById("proxyHost").removeAttribute("hidden")
		//$("#proxyHost").show();
		flag = 1;
	}else{
		document.getElementById("proxyHost").setAttribute("hidden", "hidden");
		//$("#proxyHost").hide();
		flag = 2;
	}
});

