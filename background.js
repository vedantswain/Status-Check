var statusCheckDB={};
statusCheckDB.webdb={};

statusCheckDB.webdb.open=function() {
  var dbSize = 1 * 1024 * 1024; // 1MB
  statusCheckDB.webdb.db = openDatabase("StatusCheck", "1", "Status Log manager", dbSize);
  console.log("Opened DB");
}

statusCheckDB.webdb.onError = function(tx, e) {
  console.log("There has been an error: " + e.message);
}

statusCheckDB.webdb.onSuccess = function(tx, r) {
    // re-render the data.
    // loadTodoItems is defined in Step 4a
    // statusCheckDB.webdb.getAllStatusItems(loadStatusItems);
    console.log("DB Success");
}

statusCheckDB.webdb.createTable = function() {
  var db = statusCheckDB.webdb.db;
  db.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                  "StatusCheck(ID INTEGER PRIMARY KEY ASC, status TEXT, added_on DATETIME)", []);
  });
  console.log("Created Table");
}

statusCheckDB.webdb.addStatus = function(statusText) {
  var db = statusCheckDB.webdb.db;
  db.transaction(function(tx){
    var addedOn = new Date();
    tx.executeSql("INSERT INTO StatusCheck(status, added_on) VALUES (?,?)",
        [statusText, addedOn],
        statusCheckDB.webdb.onSuccess,
        statusCheckDB.webdb.onError);
   });
}

statusCheckDB.webdb.getAllStatusItems = function(renderFunc) {
  var db = statusCheckDB.webdb.db;
  db.transaction(function(tx) {
    tx.executeSql("SELECT * FROM StatusCheck", [], renderFunc,
        statusCheckDB.webdb.onError);
  });
  console.log("Retrieved Statuses");
}

function loadStatusItems(tx, rs) {
    console.log("Loaded Statuses = "+rs.rows.length);
  // var rowOutput = "";
  // var statusItems = document.getElementById("statusItems");
  for (var i=0; i < rs.rows.length; i++) {
    renderStatus(rs.rows.item(i));
  }

  // statusItems.innerHTML = rowOutput;
}

function renderStatus(row) {
    console.log("Status");
    console.log(row.status);
  // return "<li>" + row.status + 
  //        " [<a href='javascript:void(0);' onclick=\'statusCheckDB.webdb.deleteTodo(" + 
  //        row.ID +");\'>Delete</a>]</li>";
}

function initDB() {
  statusCheckDB.webdb.open();
  statusCheckDB.webdb.createTable();
  statusCheckDB.webdb.getAllStatusItems(loadStatusItems);
}

initDB();

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request.action=="db"){
        console.log("DB transaction begins");
        statusCheckDB.webdb.addStatus(request.data);
        callback("DB Success");
        return true;
    }
    
    if (request.action == "xhttp") {
        console.log("API contact begins")
        var xhttp = new XMLHttpRequest();
        var method = request.method ? request.method.toUpperCase() : 'GET';

        xhttp.onload = function() {
            callback(xhttp.responseText);
        };
        xhttp.onerror = function() {
            // Do whatever you want on error. Don't forget to invoke the
            // callback to clean up the communication port.
            console.log("Callback error");
            callback();
        };
        xhttp.open(method, request.url, true);
        if (method == 'POST') {
            xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        // alert(request.data);
        xhttp.send(request.data);
        return true; // prevents the callback from being called too early on return
    }
});