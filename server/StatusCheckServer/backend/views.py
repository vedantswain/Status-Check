#!/usr/bin/python
# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import HttpResponse
import urllib, urllib2,json
from TwitterSearch import *


# Create your views here.

def index(request):
    return HttpResponse("Hello, world. You're at the StatusCheck index."
                        )

def feedSearch(request):
    response = "You're looking at the results of search: ..."

    query="In case you missed it, a new era of Need for Speed has arrived!"

    keywords=keywordExtract(query)
    print (keywords)
    tweetFetch(keywords)
    
    return HttpResponse(response)

def keywordExtract(query):
	keywords=[]
	url = 'http://api.meaningcloud.com/topics-1.2'
	key = 'ce2985beb498d6efb14dfccb5e617334'
	txt = query
	of = 'json'
	lang = 'en'
	tt = 'ec'
	values = dict(key=key, txt=txt, of=of,lang=lang,tt=tt)
	data = urllib.urlencode(values)
	req = urllib2.Request(url, data)
	rsp = urllib2.urlopen(req)
	content = rsp.read()
	json_dict=json.loads(content)
	entity_list=json_dict.get('entity_list')
	for entity in entity_list:
		keywords.append(str(entity.get('form')))

	concept_list=json_dict.get('concept_list')
	for concept in concept_list:
		keywords.append(str(concept.get('form')))

	return keywords

def tweetFetch(keywords):
	try:
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
	        print tweet['text']
	        count+=1
	        if(count>tweet_limit):
	        	break

	except TwitterSearchException, e:

	    print e  # take care of all those ugly errors if there are some