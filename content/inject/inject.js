console.log("Injected!");

var post_btn_class="_42ft _4jy0 _11b _4jy3 _4jy1 selected _51sy";
// var stat_el_id="u_0_11";
var stat_el_id="mentionsInput";
// var stat_txt_area_id="u_0_19";
var stat_txt_area_class="uiTextareaAutogrow input autofocus _34z- mentionsTextarea textInput";

var stat_txt_area;
var post_btn;
var curr_url;
var prev_url;
var checked_flag=0;
var timer_flag=0;

var status_txt="";
var nudge_type="Timer";
var stat_st_time;
// var reaction="Published";

function listener(){
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
	var now=new Date();
	stat_st_time=now.getSeconds();
	
	//Normal post
	if(checked_flag==1){
		removeTimer();
		console.log("Normal post");
		checked_flag=0;
		timer_flag=0;
		var now=new Date();
		var dur=now.getSeconds()-stat_st_time;
		addStatus("Published",dur);
		return;
	}

	//Intercepted check
	e.preventDefault();
	console.log("Interception!");
	timer_flag=1;
	checked_flag=1;
	post_btn.innerHTML="Post Now";

	var txt_areas = document.getElementsByClassName(stat_txt_area_class);
	for(var i = 0; i < txt_areas.length; i++)
	{
   		var ta=txt_areas.item(i);
   		if(ta.getAttribute("title")=="What's on your mind?"){
   			stat_txt_area=ta;
   			break;
   		}
	}

	// insertTimer();

	query=getPostTxt();
	if(query!=""){
		status_txt=query;
		// addStatus(query);
		getPostSentiment(query);
		// fetchTweets(query);
		// classifyDanger(query);
	}
}

function addStatus(reaction,duration){
	chrome.runtime.sendMessage({
	    action: 'db',
	    data: status_txt,
	    nudge: nudge_type,
	    rxn: reaction,
	    dur:duration
	}, function(responseText) {
	    console.log(responseText);
	    // insertClassification(responseText)
	    /*Callback function to deal with the response*/
	});
}

function getPostTxt(){
	// var stat_txt_area=document.getElementById(stat_txt_area_id);
	var val = stat_txt_area.value;
    if (val != "") {
    	console.log(val);
        return val;
    }
    return ""
}

function editPost(e){
	removeTimer();
	removeSentiment();
	removeTweets();
	removeClassification();
	console.log("Edit");
	timer_flag=0;
	checked_flag=0;
	post_btn.innerHTML="Check";

	// var stat_txt_area=document.getElementById(stat_txt_area_id);
	stat_txt_area.focus();

	var now=new Date();
	var dur=now.getSeconds()-stat_st_time;
	addStatus("Edited",dur);
}

function cancelPost(e){
	console.log("Cancel");
	timer_flag=0;
	checked_flag=0;
	removeTimer();
	removeSentiment();
	removeTweets();
	removeClassification();
	post_btn.innerHTML="Check";

	// var stat_txt_area=document.getElementById(stat_txt_area_id);
	stat_txt_area.value = "";

	var now=new Date();
	var dur=now.getSeconds()-stat_st_time;
	addStatus("Cancelled",dur);
}


function insertTimer(){

	var html = '<p style="float:left;font-size: 12px">Your post will be published in '
	html +='<b id="time_left" style="color:#b82222">10</b>';
	html += ' <b style="color:#b82222">seconds</b></p>';
	//Edit Button
	html +='<button id="edit_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #f6f7f8;color: #4e5665;border-color: #cccccc;">Edit</button>';
	//Cancel Button
	html +='<button id="cancel_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #ffffff;color: #4e5665;border-color: #cccccc;">Cancel Post</button>';

	var div = document.createElement('div');
	div.setAttribute("id", "TimerDiv");
	div.innerHTML = html;
	div.style.height="41px";
	div.style.width="491px";
	div.style.padding="5px";

	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
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
	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
	
	if(timer_div!=null){
		stat_el.removeChild(timer_div);
	}
}

function startTimer(ss){
	var today=new Date();
	var curr_secs=today.getSeconds();

	var dur=30;

	t=dur-(curr_secs-ss);

	var time_left=document.getElementById('time_left');
	
	//Stop timer condition
	if(t<=-1 || t>dur || timer_flag==0){
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

function insertLoader(){
	var html = '<img src="https://media.giphy.com/media/ToMjGpBODSELuQDrKSs/giphy.gif" style="width:16px;height:16px;">'
	
	var div = document.createElement('div');
	div.setAttribute("id", "LoaderDiv");
	div.innerHTML = html;
	// div.style.height="128px";
	// div.style.width="128px";
	div.style.padding="10px";

	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;

	stat_el.appendChild(div);

	console.log('insterted loader')
}

function removeLoader(){
	var loader_div=document.getElementById("LoaderDiv");
	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
	
	if(loader_div!=null){
		console.log('loader removed')
		stat_el.removeChild(loader_div);
	}
}

function getPostSentiment(query){
	nudge_type="Sentiment";

	//var api = "http://localhost:8000/backend/analyse-sentiment/";
	// var api = "http://192.168.1.6:1235/backend/analyse-sentiment/";
	var api="http://multiosn.iiitd.edu.in/backend/analyse-sentiment/";
	// console.log(query)
	query=query.replace(/#/g,'');
	console.log(query)
	var dat="?q="+query;
	var uri=encodeURI(api+dat);
	console.log(uri);
	
	insertLoader()

	chrome.runtime.sendMessage({
	    method: 'GET',
	    action: 'xhttp',
	    url: uri,
	    data: null
	}, function(responseText) {
	    console.log(responseText);
	    insertSentiment(responseText);
	    /*Callback function to deal with the response*/
	});

	// removeLoader()
}

function insertSentiment(txt){
	obj = JSON.parse(txt);
	console.log(obj);
	var score="";
	var sentiment="";
	var subjectivity="";
	var irony="";

	// if (typeof obj.score!='undefined') {
	// 	score=obj.score;
	// };
	if(typeof obj.score_tag!='undefined') {
		sentiment=obj.score_tag;
	};
	if (typeof obj.subjectivity!='undefined') {
		subjectivity=obj.subjectivity.toLowerCase();
	};
	if (typeof obj.irony!='undefined') {
		irony=obj.irony.toLowerCase();
	};

	sentiment_tag=""
	if(sentiment.includes('+')){
		sentiment_tag="strongly "
	}

	if(sentiment.includes('P')){
		sentiment_tag+="positive"
	}
	else if(sentiment=='NEU'){
		sentiment_tag="neutral"
	}
	else if(sentiment=='N' || sentiment=='N+'){
		sentiment_tag+="negative"
	}
	else{
		sentiment_tag="neutral"
	}

	color_hex='ffd249'

	if(sentiment=='P' || sentiment=='P+'){
		color_hex='#00a770'
	}
	else if(sentiment=='N' || sentiment=='N+'){
		color_hex='#ba2600'
	}
	else{
		color_hex='#ffd249'
	}

	var html='<div>'
	html += '<p style="float:left;font-size: 12px">Your post is '
	html +='<b id="sentiment" style="color:#ffffff;border: 1px solid;border-radius: 5px;; border-color:#ffffff;background-color:'+color_hex+';padding: 2px">'+sentiment_tag+'</b>';
	// html +=' with a score of <b id="score">'+score+'</b>';
	html += ' <b id="subjectivity" style="color:#ffffff;border: 2px solid;border-radius: 10px;; border-color:#38619a;background-color:#38619a;padding: 2px">'+subjectivity+'</b>';
	html += ' <b id="irony" style="color:#ffffff;border: 2px solid;border-radius: 10px;; border-color:#38619a;background-color:#38619a;padding: 2px">'+irony+'</b></p>';
	html += '</div>'
	//Indicator
	// html +='<input id="indicator" type="range" min="1" max="100" step="1" value="15 style="float:left">'
	//Edit Button
	html += '<div>'
	html +='<button id="edit_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #f6f7f8;color: #4e5665;border-color: #cccccc;">Edit</button>';
	//Cancel Button
	html +='<button id="cancel_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #ffffff;color: #4e5665;border-color: #cccccc;">Cancel Post</button>';
	html += '</div>'

	score=Math.abs(score*100)	

	// html +='<div style="width:300px;height:10px;margin:2px;background:#CCC;border-radius:5px;float:left;">'
 //    html+='<div style="width:'+score+'%;height:10px;background:'+color_hex+';border-radius:5px;text-align:center;"><span></span></div></div>'

	var div = document.createElement('div');
	div.setAttribute("id", "SentimentDiv");
	div.innerHTML = html;
	div.style.height="61px";
	div.style.width="auto";
	div.style.padding="5px";
	// div.style.border = "solid #0000FF";

	removeLoader()

	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
	stat_el.appendChild(div);

	// document.getElementById("indicator").disabled = true;

	var edit_btn=document.getElementById("edit_status");
	edit_btn.addEventListener("click",editPost, false);
	var cancel_btn=document.getElementById("cancel_status");
	cancel_btn.addEventListener("click",cancelPost, false);
}

function removeSentiment(){
	var sentiment_div=document.getElementById("SentimentDiv");
	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
	
	if(sentiment_div!=null){
		stat_el.removeChild(sentiment_div);
	}
}

function fetchTweets(query){
	nudge_type="Related posts";

	//var api = "http://localhost:8000/backend/feed-search/";
	// var api = "http://192.168.1.6:1235/backend/feed-search/";
	var api="http://multiosn.iiitd.edu.in/backend/feed-search/";
	query=query.replace(/#/g,'');
	console.log(query)
	var dat="?q="+query;
	var uri=encodeURI(api+dat);
	console.log(uri);

	insertLoader();	

	chrome.runtime.sendMessage({
	    method: 'GET',
	    action: 'xhttp',
	    url: uri,
	    data: null
	}, function(responseText) {
	    // console.log(responseText);
	    insertTweets(responseText)
	    /*Callback function to deal with the response*/
	});
}

function insertTweets(txt){
	obj = JSON.parse(txt);
	// console.log(obj);
	tweets = obj.tweets;
	// console.log(tweets);
	keywords = obj.keywords;
	// console.log(keywords);
	var html=''
	//Edit Button
	html += '<div>'
	html +='<button id="edit_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #f6f7f8;color: #4e5665;border-color: #cccccc;">Edit</button>';
	//Cancel Button
	html +='<button id="cancel_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #ffffff;color: #4e5665;border-color: #cccccc;">Cancel Post</button>';
	html += '</div>'

	html+='<div>'
	html += '<p style="color:#4f4f4f;float:left;font-size: 14px">Other posts talking about '
	html +='<b>'+keywords+'</b> :</p>';

	html +='<ul style="float:left">'
	for (var i=0; i<tweets.length;i++){
		// console.log(tweets[i].score_tag)
		post_txt=tweets[i].post
		replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
		post_txt=post_txt.replace( replacePattern1 , '<a href="$1" target="_blank">$1</a>' )

		html+='<li style="color:#4f4f4f;margin-bottom: 20px">'+post_txt

		sentiment_tag="neutral"
		color_hex="#ffd249"

		if(typeof(tweets[i].score_tag)==='undefined'){
			sentiment_tag="neutral"
			color_hex='#ffd249'
		}
		else{
			sentiment=tweets[i].score_tag
			console.log('defined:')
			if(sentiment.includes('P')){
				sentiment_tag="positive"
				color_hex='#00a770'
			}
			else if(sentiment=='NEU'){
				sentiment_tag="neutral"
				color_hex='#ffd249'
			}
			else if(sentiment=='N' || sentiment=='N+'){
				sentiment_tag="negative"
				color_hex='#ba2600'
			}
		}

		// console.log(tweets[i].score_tag)

		html += ' <b style="color:#ffffff;border: 1px solid;border-radius: 5px; border-color:#ffffff;padding: 2px;background-color:'+color_hex+'">'+sentiment_tag+'</b></li>';
	
	}
	html +='</ul>'
	html += '</div>'
	
	

	var div = document.createElement('div');
	div.setAttribute("id", "TweetsDiv");
	div.innerHTML = html;
	div.style.height="61px";
	div.style.width="auto";
	div.style.padding="5px";
	// div.style.border = "solid #0000FF";

	removeLoader()

	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;

	stat_el.appendChild(div);

	// document.getElementById("indicator").disabled = true;

	var edit_btn=document.getElementById("edit_status");
	edit_btn.addEventListener("click",editPost, false);
	var cancel_btn=document.getElementById("cancel_status");
	cancel_btn.addEventListener("click",cancelPost, false);
}

function removeTweets(){
	var tweets_div=document.getElementById("TweetsDiv");
	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;

	
	if(tweets_div!=null){
		stat_el.removeChild(tweets_div);
	}
}

function classifyDanger(query){
	nudge_type="Classification"

	//var api = "http://localhost:8000/backend/classify/";
	var api="http://multiosn.iiitd.edu.in/backend/classify/";
	query=query.replace(/#/g,'');
	console.log(query)
	var dat="?q="+query;
	var uri=encodeURI(api+dat);
	console.log(uri);

	insertLoader();	

	chrome.runtime.sendMessage({
	    method: 'GET',
	    action: 'xhttp',
	    url: uri,
	    data: null
	}, function(responseText) {
	    //console.log(responseText);
	    insertClassification(responseText)
	    /*Callback function to deal with the response*/
	});
}

function insertClassification(txt){
	obj = JSON.parse(txt);
	tag = obj.tag;
	polarity = obj.polarity;
	keywords = obj.words;
	// console.log(keywords);

	message_header="Your post "
	message_q1=""
	message_q2=""
	sentiment=""
	message_q3=""
	if(tag=='safe'){
		if(polarity<0){
			message_q1="is probably "
			message_q2=" but it has a"
			sentiment="negative sentiment"
		}
		else{
			message_q1="is "
		}
		if(keywords.length>0){
			message_q3=". Be careful when you're talking about: "
		}
	}
	else{
		tag='dangerous'
		if(polarity<0){
			message_q1="might be considered "
			message_q2=" because it has a"
			sentiment="negative sentiment"
		}
		else{
			message_q1="is "
		}
		if(keywords.length>0){
			message_q3=". Please be cautious and sensitive when you're talking about the following: "
		}
	}
	
	if(tag=='safe'){
		color_hex='#00a770'
	}
	else{
		color_hex='#ba2600'
	}
	
	tag_decoration=' <b style="color:#ffffff;border: 1px solid;border-radius: 5px; border-color:#ffffff;padding: 2px;background-color:'+color_hex+'">'+tag+'</b>'
	
	if(sentiment == "negative sentiment"){
		color_hex='#ba2600'
	}
	else{
		color_hex=""
	}

	sentiment_decoration=' <b style="color:#ffffff;border: 1px solid;border-radius: 5px; border-color:#ffffff;padding: 2px;background-color:'+color_hex+'">'+sentiment+'</b>'
	
	words_decoration= '<b>'+keywords+'</b>'

	message=message_header+message_q1+tag_decoration+message_q2+sentiment_decoration+message_q3+words_decoration

	var html=''
	//Edit Button
	html += '<div>'
	html +='<button id="edit_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #f6f7f8;color: #4e5665;border-color: #cccccc;">Edit</button>';
	//Cancel Button
	html +='<button id="cancel_status" style="padding-right:16px;padding-left:16px;margin:5px;-webkit-border-radius:2px;border: 1px solid;font-weight: bold;font-size: 12px;background-color: #ffffff;color: #4e5665;border-color: #cccccc;">Cancel Post</button>';
	html += '</div>'

	html+='<div>'
	html += '<p style="color:#4f4f4f;float:left;font-size: 14px">'+message+'</p>';
	html += '</div>'

	var div = document.createElement('div');
	div.setAttribute("id", "ClassificationDiv");
	div.innerHTML = html;
	div.style.height="61px";
	div.style.width="auto";
	div.style.padding="5px";
	// div.style.border = "solid #0000FF";

	removeLoader()

	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
	stat_el.appendChild(div);

	// document.getElementById("indicator").disabled = true;

	var edit_btn=document.getElementById("edit_status");
	edit_btn.addEventListener("click",editPost, false);
	var cancel_btn=document.getElementById("cancel_status");
	cancel_btn.addEventListener("click",cancelPost, false);
}

function removeClassification(){
	var classification_div=document.getElementById("ClassificationDiv");
	// var stat_el=document.getElementById(stat_el_id);
	var stat_el=stat_txt_area.parentNode;
	
	if(classification_div!=null){
		stat_el.removeChild(classification_div);
	}
}