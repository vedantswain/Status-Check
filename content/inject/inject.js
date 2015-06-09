console.log("Injected!");

var post_btn_class="_42ft _4jy0 _11b _4jy3 _4jy1 selected _51sy";
var stat_el_id="u_0_11";
var stat_txt_area_id="u_0_19";

var post_btn;
var curr_url;
var prev_url;
var checked_flag=0;
var timer_flag=0;

function listener()
{
	curr_url=window.location.href;

	if(curr_url!=prev_url){
		console.log("changed");
		post_btn=null;
	}

	var x = document.getElementsByClassName(post_btn_class);
	
    if (x!=null) {
    	getPostBtn();
    }

    prev_url=curr_url;
}

//To handle Facebook's dynamic ajax based page loading
document.addEventListener("DOMSubtreeModified", listener, false);

//Get status 'Post' button
function getPostBtn(){
	var x = document.getElementsByClassName(post_btn_class);
	var i;
	for (i = 0; i < x.length; i++) {
		if(post_btn==null){
			console.log("Found the post button at "+curr_url);	
		}
		post_btn=x[i];
	}

	if(post_btn!=null){
			insertCheckBtn();
	}
}

function insertCheckBtn(){
	if(checked_flag==0){
		post_btn.innerHTML="Check";
	}
	post_btn.addEventListener("click",interceptPost, false);
}

function interceptPost(e){
	//Normal post
	if(checked_flag==1){
		removeTimer();
		console.log("Normal post");
		checked_flag=0;
		timer_flag=0;
		return;
	}

	//Intercepted check
	e.preventDefault();
	console.log("Interception!");
	timer_flag=1;
	checked_flag=1;
	post_btn.innerHTML="Post Now";
	insertTimer();

	query=getPostTxt();
	if(query!=""){
		fetchTweets(query);
	}
}

function getPostTxt(){
	var stat_txt_area=document.getElementById(stat_txt_area_id)
	var val = stat_txt_area.value;
    if (val != "") {
    	console.log(val);
        return val;
    }
    return ""
}

function editPost(e){
	removeTimer();
	console.log("Edit");
	timer_flag=0;
	checked_flag=0;
	post_btn.innerHTML="Check";

	var stat_txt_area=document.getElementById(stat_txt_area_id);
	stat_txt_area.focus();
}

function cancelPost(e){
	console.log("Cancel");
	timer_flag=0;
	checked_flag=0;
	removeTimer();
	post_btn.innerHTML="Check";

	var stat_txt_area=document.getElementById(stat_txt_area_id);
	stat_txt_area.value = "";
}


function insertTimer(){

	var html = '<p style="float:left;font-size: 12px">Your post will be published in '
	html +='<b id="time_left" style="color:#b82222">10</b>';
	html += ' <b style="color:#b82222">seconds</b></p>';
	//Edit Button
	html +='<button id="edit_status" style="padding-right:16px;padding-left:16px;float:right;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #f6f7f8;color: #4e5665;border-color: #cccccc;">Edit</button>';
	//Cancel Button
	html +='<button id="cancel_status" style="padding-right:16px;padding-left:16px;float:right;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #ffffff;color: #4e5665;border-color: #cccccc;">Cancel Post</button>';

	var div = document.createElement('div');
	div.setAttribute("id", "TimerDiv");
	div.innerHTML = html;
	div.style.height="41px";
	div.style.width="491px";
	div.style.padding="5px";

	var stat_el=document.getElementById(stat_el_id);
	stat_el.appendChild(div);
	
	var edit_btn=document.getElementById("edit_status");
	edit_btn.addEventListener("click",editPost, false);
	var cancel_btn=document.getElementById("cancel_status");
	cancel_btn.addEventListener("click",cancelPost, false);

	var today=new Date();
	var start_secs=today.getSeconds();
	
	startTimer(start_secs);	
}

function removeTimer(){
	var timer_div=document.getElementById("TimerDiv");
	var stat_el=document.getElementById(stat_el_id);
	
	if(timer_div!=null){
		stat_el.removeChild(timer_div);
	}
}

function startTimer(ss){
	var today=new Date();
	var curr_secs=today.getSeconds();

	t=10-(curr_secs-ss);

	var time_left=document.getElementById('time_left');
	
	//Stop timer condition
	if(t<=-1 || t>10 || timer_flag==0){
		if(time_left!=null){
		time_left.innerHTML = 0;	
		}
		if(checked_flag==1){
			post_btn.click();	
		}
		return;
	}

	if(time_left!=null){
		time_left.innerHTML = t;	
	}
	var t = setTimeout(function(){startTimer(ss)},1000);
}

function fetchTweets(query){
	var api = "http://localhost:8000/backend/feed-search/";
	query=query.replace(/#/g,'');
	console.log(query)
	var dat="?q="+query;
	var uri=encodeURI(api+dat);
	console.log(uri);
	
	chrome.runtime.sendMessage({
	    method: 'GET',
	    action: 'xhttp',
	    url: uri,
	    data: null
	}, function(responseText) {
	    console.log(responseText);
	    /*Callback function to deal with the response*/
	});
}