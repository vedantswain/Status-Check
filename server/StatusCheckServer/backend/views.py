#!/usr/bin/python
# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import urllib, urllib2,json
from TwitterSearch import *


# Create your views here.

def index(request):
    return HttpResponse("Hello, world. You're at the StatusCheck index."
                        )

@csrf_exempt
def feedSearch(request):
    response = "You're looking at the results of search: ..."
    # query="IIIT-Delhi students ‪#‎HigherEducation‬ ‪#‎Research‬ Update"
    query=request.GET.get('q')
    print query
    keywords=keywordExtract(query)
    print (keywords)
    tweetFetch(keywords)
    
    return HttpResponse(response)

def keywordExtract(query):
	keywords=[]
	url = 'http://api.meaningcloud.com/topics-1.2'
	key = 'ce2985beb498d6efb14dfccb5e617334'
	txt = query.encode('utf-8')
	of = 'json'
	lang = 'en'
	tt = 'eu'
	values = dict(key=key, txt=txt, of=of,lang=lang,tt=tt)
	data = urllib.urlencode(values)
	req = urllib2.Request(url, data)
	rsp = urllib2.urlopen(req)
	content = rsp.read()
	json_dict=json.loads(content)
	entity_list=json_dict.get('entity_list')
	for entity in entity_list:
		keywords.append(str(entity.get('form')))
		# keywords.append('OR')

	# keywords.pop()

	return keywords

def sentimentAnalysis(query):
	url = 'http://api.meaningcloud.com/sentiment-1.2'
	key = 'ce2985beb498d6efb14dfccb5e617334'
	txt = query.encode('utf-8')
	of = 'json'
	model = 'en-general'
	values = dict(key=key, txt=txt, of=of,model=model)
	# print txt
	data = urllib.urlencode(values)
	req = urllib2.Request(url, data)
	rsp = urllib2.urlopen(req)
	content = rsp.read()
	json_dict=json.loads(content)
	print txt
	if json_dict.get('score') is not None:
		print "Score: "+json_dict.get('score')
	if json_dict.get('score_tag') is not None:
		print "Tag: "+json_dict.get('score_tag')
	if json_dict.get('subjectivity') is not None:
		print "Subjectivity: "+json_dict.get('subjectivity')
	if json_dict.get('irony') is not None:
		print "Irony: "+json_dict.get('irony')
	# print "sentimentAnalysis"

def tweetFetch(keywords):
	try:
	    print "fetching from Twitter"
	    tso = TwitterSearchOrder()  # create a TwitterSearchOrder object
	    tso.set_keywords(keywords)  # let's define all words we would like to have a look for
	    tso.set_count(10)
	    # tso.set_result_type("popular")
	    tso.set_language('en')  # we want to see English tweets only
	    tso.set_include_entities(False)  # and don't give us all those entity information

	    # it's about time to create a TwitterSearch object with our secret tokens

	    ts = TwitterSearch(consumer_key='GML650EJDB9kGTmLOV1fmiKnE',
	                       consumer_secret='Lssnyk1dDmPYS86USSCjD8SBV3HAJPjUJQNemAhowv6jCwIVez'
	                       ,
	                       access_token='3223420976-qydbZ9X79cLsKhUVdqTBOs7Rg9sh3sTjUNzuc3B'
	                       ,
	                       access_token_secret='bs4LDtdKkkCTpTZyqm49hSF1o2igfFkw2eSHvYbLigAsM'
	                       )

	     # this is where the fun actually starts :)
	    count=0
	    tweet_limit=10 #limit to first 10 results

	    for tweet in ts.search_tweets_iterable(tso):
	        # print tweet['text']
	        sentimentAnalysis(tweet['text'])
	        count+=1
	        print count
	        if(count>tweet_limit):
	        	break

	except TwitterSearchException, e:

	    print e  # take care of all those ugly errors if there are some