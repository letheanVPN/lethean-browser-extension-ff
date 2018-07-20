$(document).ready(function() {
	console.log(Storage + "my storage ------------------")
	if(typeof(Storage) == "undefined"){
		localStorage.proxyConfig = "system";
		console.log("add to storage ----------")
	}

	var pconfig = localStorage.getItem("proxyConfig")
	console.log(pconfig + "------------------")
	if(pconfig == 'system'){
		let proxySettings = {
		  proxyType: "system"
		};

		browser.proxy.settings.set({value: proxySettings})
		localStorage.proxyConfig = "system";
		$("#system").attr("hidden", "hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");

		document.getElementById('proxyHostHttp').value = "localhost";
        document.getElementById('proxyPortHttp').value = "6666"
	}else if(pconfig == 'manual'){
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
		
		/*
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
		*/
	}

	$('input[id=proxyTypeSystem]').click(function() {
		$("#system").attr("hidden", "hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");
		let proxySettings = {
		  proxyType: "system"
		};
		browser.proxy.settings.set({value: proxySettings})
		localStorage.proxyConfig = "system";
		document.getElementById('proxyHostHttp').value = "localhost";
        document.getElementById('proxyPortHttp').value = "6666"
		
	});
	
	$('input[id=proxyTypeManual]').click(function() {
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
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

	var flag = 2
	$("#settingsConfig").click(function(){
		if(flag == 2){
			$("#proxyHost").show();
			flag = 1;
		}else{
			$("#proxyHost").hide();
			flag = 2;
		}
	});

	// make following action fire when radio button changes
    $('input[type=radio]').click(function(){
    	setTimeout(function(){
		  $('input[type=submit]').click();
		}, 300);
      	
    });

});