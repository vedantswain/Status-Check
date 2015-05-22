function initIFrame() {
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(tabs) {
		var expiry = new Date(parseInt(localStorage.expiryTime));
		var now = new Date();
		if (localStorage.accessToken && now < expiry) {
			var logstring="Retrieved accessToken="+ encodeURIComponent(localStorage.accessToken);
			console.log(logstring);
			$('#frame').show();
			chrome.browserAction.setBadgeBackgroundColor({ color: [0, 255, 0, 125] });
			chrome.browserAction.setBadgeText({text: "on"});
			// alert("Login successful");
		} else {
			chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 125] });
			chrome.browserAction.setBadgeText({text: "off"});
			$('#frame').hide();
			console.log("Logging in ...");
			// alert("Logging in ...");
			loginfacebook(initIFrame);
		}
	});
}

document.addEventListener('DOMContentLoaded', function() {
	initIFrame();
});