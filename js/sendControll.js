$(document).ready(function() {

	let pStorage = browser.storage.local.get()
	console.log(pStorage)
	if(typeof pStorage ===  "undefined" || pStorage == "system"){
		

		let proxySettings = {
		  proxyType: "system"
		};

		browser.proxy.settings.set({value: proxySettings})
	
		browser.storage.local.set({
		  proxyConfig: {type:"system"}
		});

		$("#system").attr("hidden", "hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");

		console.log(proxySettings.proxyType + "--------------------------------1")
		console.log(proxySettings.httpProxyAll + "--------------------------------1")

		document.getElementById('proxyHostHttp').value = "localhost";
        document.getElementById('proxyPortHttp').value = "6666"
	}else{
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
		let proxySettings = {
		  proxyType: "manual",
		  http: "127.0.0.1:6666",
		  socksVersion: 4,
		  //passthrough: ".example.org"
		  httpProxyAll: true
		};
		browser.proxy.settings.set({value: proxySettings})
		browser.storage.local.set({
		  proxyConfig: {type:"manual"}
		});
		console.log(proxySettings.proxyType + "--------------------------------2")
		console.log(proxySettings.httpProxyAll + "--------------------------------2")

		
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
		browser.storage.local.set({
		  proxyConfig: {type:"system"}
		});
		console.log(proxySettings.proxyType + "--------------------------------3")
		console.log(proxySettings.httpProxyAll + "--------------------------------3")

		
	});
	
	$('input[id=proxyTypeManual]').click(function() {
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
		
		let proxySettings = {
		  proxyType: "manual",
		  http: "127.0.0.1:6666",
		  socksVersion: 4,
		  //passthrough: ".example.org"
		  httpProxyAll: true
		};
		browser.proxy.settings.set({value: proxySettings})
		browser.storage.local.set({
		  proxyConfig: {type:"manual"}
		});
		console.log(proxySettings.proxyType + "--------------------------------4")
		console.log(proxySettings.httpProxyAll + "--------------------------------4")

		
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