var statusCheckDB={};
statusCheckDB.webdb={};

statusCheckDB.webdb.open=function() {
  var dbSize = 1 * 1024 * 1024; // 1MB
  statusCheckDB.webdb.db = openDatabase("StatusCheckDB", "1", "Status Log manager", dbSize);
  console.log("Opened DB");
}

statusCheckDB.webdb.onError = function(tx, e) {
  alert("There has been an error: " + e.message);
}

statusCheckDB.webdb.onSuccess = function(tx, r) {
	// re-render the data.
	// loadTodoItems is defined in Step 4a
	statusCheckDB.webdb.getAllStatusItems(loadStatusItems);
}

statusCheckDB.webdb.createTable = function() {
  var db = statusCheckDB.webdb.db;
  db.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                  "StatusCheck(ID INTEGER PRIMARY KEY ASC, status TEXT, added_on DATETIME, nudge TEXT, reaction TEXT, duration INTEGER)", []);
  });
  console.log("Created Table");
}

statusCheckDB.webdb.getAllStatusItems = function(renderFunc) {
  var db = statusCheckDB.webdb.db;
  db.transaction(function(tx) {
    tx.executeSql("SELECT * FROM StatusCheck ORDER BY ID DESC", [], renderFunc,
        statusCheckDB.webdb.onError);
  });
  console.log("Retrieved Statuses");
}

function loadStatusItems(tx, rs) {
	console.log("Loaded Statuses = "+rs.rows.length);
  var rowOutput = "";
  var statusItems = document.getElementById("statusItems");
  for (var i=0; i < rs.rows.length; i++) {
    rowOutput += renderStatus(rs.rows.item(i));
  }

  var header="<tr><td><b>Post</b></td><td><b>Time</b></td><td><b>Nudge</b></td><td><b>Response</b></td><td><b>Duration</b></td></tr>";
  statusItems.innerHTML = header+rowOutput;

  // Deletes all status items
 //  for (var i=0; i < rs.rows.length; i++) {
 //    var row=rs.rows.item(i);
 //    var list_el=document.getElementById("item_"+row.ID);
	// list_el.addEventListener("click",statusCheckDB.webdb.deleteStatus(row.ID));	
 //  }

 // Setup Download as CSV
 var csv="status,added_on,nudge,reaction,duration\n";
 for (var i=0; i < rs.rows.length; i++) {
    var row= rs.rows.item(i);
    console.log(row);
    csv+=row.status+","+row.added_on+","+row.nudge+","+row.reaction+","+row.duration+"\n";
    // console.log(csv);
  }
  var data= new Blob([csv]);
	var statusLog=document.getElementById("statusLog");
	statusLog.href=URL.createObjectURL(data); 
}

function renderStatus(row) {
	// console.log("Status");
	console.log(row);
   	li="<tr>" +"<td>"+ row.status+"</td><td>"+row.added_on+"</td><td>"+row.nudge+"</td><td>"+row.reaction+"</td><td>"+row.duration + "</td></tr>";
   	// "<button id=item_"+row.ID+">Delete</button>

	return li;
}

statusCheckDB.webdb.deleteStatus = function(id) {
  console.log("Deleted: "+id);
  var db = statusCheckDB.webdb.db;
  db.transaction(function(tx){
    tx.executeSql("DELETE FROM StatusCheck WHERE ID=?", [id],
        statusCheckDB.webdb.onSuccess,
        statusCheckDB.webdb.onError);
    });
}

function initDB() {
  statusCheckDB.webdb.open();
  statusCheckDB.webdb.createTable();
  statusCheckDB.webdb.getAllStatusItems(loadStatusItems);
}

document.addEventListener('DOMContentLoaded', function() {
	// initIFrame();
	initDB();
});

// function initIFrame() {
// 	chrome.tabs.query({
// 		active : true,
// 		currentWindow : true
// 	}, function(tabs) {
// 		var expiry = new Date(parseInt(localStorage.expiryTime));
// 		var now = new Date();
// 		if (localStorage.accessToken && now < expiry) {
// 			var logstring="Retrieved accessToken="+ encodeURIComponent(localStorage.accessToken);
// 			console.log(logstring);
// 			$('#frame').show();
// 			chrome.browserAction.setBadgeBackgroundColor({ color: [0, 255, 0, 125] });
// 			chrome.browserAction.setBadgeText({text: "on"});
// 			// alert("Login successful");
// 		} else {
// 			chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 125] });
// 			chrome.browserAction.setBadgeText({text: "off"});
// 			$('#frame').hide();
// 			console.log("Logging in ...");
// 			// alert("Logging in ...");
// 			loginfacebook(initIFrame);
// 		}
// 	});
// }