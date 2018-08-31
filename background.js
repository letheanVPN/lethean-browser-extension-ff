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
	
	oReq.addEventListener("load", transferComplete);
	oReq.addEventListener("error", transferFailed);
	oReq.addEventListener("abort", transferCanceled);
	oReq.open("GET", "http://google.com");
	oReq.send();

	//setTimeout(getHaproxyStats(), 15000);

}
//document.getElementById("proxyTypeManual").addEventListener('click', getHaproxyStats());
