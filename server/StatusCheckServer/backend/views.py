#!/usr/bin/python
# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import urllib, urllib2,json,os,time,random, math,nltk,numpy as np
from TwitterSearch import *
from textblob import TextBlob
from textblob.classifiers import NaiveBayesClassifier
from nltk import NaiveBayesClassifier as nbc
from sklearn import svm
from sklearn.feature_extraction.text import CountVectorizer,TfidfTransformer
from sklearn.feature_extraction import DictVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.linear_model import SGDClassifier

# Create your views here.

def index(request):
    return HttpResponse("Hello, world. You're at the StatusCheck index."
                        )

@csrf_exempt
def train(request):
	response = "training over"
	__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
	read_file="training_posts_2.txt"
	vocab_doc="vocabulary_2.txt"
	list_tuples = []
	print 'importing data...'
	a = time.time()
	with open(os.path.join(__location__, vocab_doc),"r") as d:
		for line in d:
			vocabulary = line.strip().split('\t')
	# print vocabulary
	with open(os.path.join(__location__, read_file),"r") as r:
		for line in r:
			tabsep = line.strip().split('\t')
			txt = tabsep[1] #right side of line contains the message
			txt = unicode(txt, 'utf-8')
			list_tuples.append((txt,tabsep[0]))
		r.close()
	entire_data=list_tuples
	print "It took "+str(time.time()-a)+" seconds to import data"
	print 'data imported'
	# train=entire_data
	accuracy_results=[]
	b=time.time()
	for i in range(0,1):
		# accuracy_results.append(train_nbc(entire_data,vocabulary))
		a=time.time()
		accuracy_results.append(train_svm(entire_data,vocabulary))
		print str(i)+"th iteration: "+str(time.time()-a)+" seconds to train data"
	print "It took "+str(time.time()-b)+" seconds total"
	print accuracy_results
	print "mean accuracy: "
	print sum(accuracy_results)/float(len(accuracy_results))
	
	return HttpResponse(response)

def train_svm(entire_data,vocabulary):
	random.seed()
	random.shuffle(entire_data)
	list_len=len(entire_data)
	break_point=int(math.floor(list_len*0.9))
	train = entire_data[:break_point-1]	#splitting data into training and testing sets
	# random.shuffle(entire_data)
	test = entire_data[break_point:]
	# test = train
	# print 'training data'
	a = time.time()
	## Training with custom features
	# count_vect = CountVectorizer()
	# train_data = [data_point[0] for data_point in train]
	feature_set = [{i:(i in TextBlob(data_point[0].lower()).words) for i in vocabulary} for data_point in train]
	for feat,data_point in zip(feature_set,train):
		feat['polarity']=TextBlob(data_point[0].lower()).sentiment.polarity
		# feat['subjectivity']=TextBlob(data_point[0].lower()).sentiment.subjectivity
		# print data_point[1]+" - "+str(feat['polarity'])
	train_target = [data_point[1] for data_point in train]
	cl = Pipeline([('vect', DictVectorizer()),('cl', SGDClassifier(loss='hinge', penalty='l2',alpha=1e-3, n_iter=5, random_state=42)),])
	cl.fit(feature_set,train_target)
	
	test_feature_set = [{i:(i in TextBlob(data_point[0].lower()).words) for i in vocabulary} for data_point in test]
	for feat,data_point in zip(test_feature_set,test):
		feat['polarity']=TextBlob(data_point[0].lower()).sentiment.polarity
		# feat['subjectivity']=TextBlob(data_point[0].lower()).sentiment.subjectivity
	test_target = [data_point[1] for data_point in test]
	# test_feature_set=feature_set
	# test_target=train_target
	predicted=cl.predict(test_feature_set)
	accuracy=0
	accuracy=np.mean(predicted == test_target)            

	global svm_cl
	svm_cl=cl

	print "accuracy: "+str(round(accuracy*100, 2))+"%"
	return round(accuracy*100, 2)

@csrf_exempt
def classify(request):
	post=request.GET.get('q')
	print post
	__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
	vocab_doc="vocabulary_2.txt"
	with open(os.path.join(__location__, vocab_doc),"r") as d:
		for line in d:
			vocabulary = line.strip().split('\t')
	test_feature_set = [{i:(i in TextBlob(post.lower()).words) for i in vocabulary}]
	for feat in test_feature_set:
		feat['polarity']=TextBlob(post.lower()).sentiment.polarity

	try:
		svm_cl
	except NameError:
		print "SVM not defined. Starting training"
		accuracy=0
		while (True):
			accuracy=train(request)
			if accuracy>84:
				break

	predicted=svm_cl.predict(test_feature_set)
	print predicted[0]

	resp_dict={}
	resp_dict['tag']=predicted[0]
	words=[]
	for key in test_feature_set[0]:
		if (test_feature_set[0][key]==True):
			words.append(test_feature_set[0][key])
	resp_dict['polarity']=test_feature_set[0]['polarity']
	resp_dict['words']=words

	response=resp_dict

	return HttpResponse(json.dumps(response),content_type='application/json')

@csrf_exempt
def feedSearch(request):
    response = "You're looking at the results of search: ..."
    # query="IIIT-Delhi students ‪#‎HigherEducation‬ ‪#‎Research‬ Update"
    query=request.GET.get('q')
    print query
    keywords=keywordExtract(query)
    print (keywords)
    tweet_dict=tweetFetch(keywords)

    resp={}
    resp['tweets']=tweet_dict
    resp['keywords']=keywords
    
    return HttpResponse(json.dumps(resp),content_type='application/json')

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

@csrf_exempt
def analyseSentiment(request):
	query=request.GET.get('q')
	response=sentimentAnalysis(query)
	return HttpResponse(json.dumps(response),content_type='application/json')

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
	resp_dict={}
	resp_dict['status']=txt
	print txt
	if json_dict.get('score') is not None:
		resp_dict['score']=json_dict.get('score')
		print "Score: "+json_dict.get('score')
	if json_dict.get('score_tag') is not None:
		resp_dict['score_tag']=json_dict.get('score_tag')
		print "Tag: "+json_dict.get('score_tag')
	if json_dict.get('subjectivity') is not None:
		resp_dict['subjectivity']=json_dict.get('subjectivity')
		print "Subjectivity: "+json_dict.get('subjectivity')
	if json_dict.get('irony') is not None:
		resp_dict['irony']=json_dict.get('irony')
		print "Irony: "+json_dict.get('irony')
	# print "sentimentAnalysis"
	return resp_dict

def tweetFetch(keywords):
	filtered_tweets=[]
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
	    tweet_limit=9 #limit to first 10 results

	    for tweet in ts.search_tweets_iterable(tso):
	        # print tweet['text']
	        sent_resp=sentimentAnalysis(tweet['text'])
	        count+=1
	        tweet_object={}
	        tweet_object['post']=tweet['text']
	        if 'score_tag' in sent_resp:
	        	tweet_object['score_tag']=sent_resp['score_tag']
	        if(tweet_object not in filtered_tweets):
	        	filtered_tweets.append(tweet_object)
	        print count
	        if(count>tweet_limit):
	        	break

	except TwitterSearchException, e:

	    print e  # take care of all those ugly errors if there are some

	return filtered_tweets
