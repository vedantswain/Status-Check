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
	read_file="training_posts.txt"
	vocab_doc="vocabulary.txt"
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
			## Bag of words method
			# print(tabsep[0])
			# print(txt)
			# wiki=TextBlob(txt)
			# tags=wiki.tags
			# words=[]
			# forbidden = ['IN','DT','CC','PRP'] # getting rid of pronouns, prepositions, determinants and conjunctions
			# for tag in tags:
			# 	if tag[1] not in forbidden:
			# 		words.append(tag[0]) #left side contains the tag
			# for word in words:
			# 	list_tuples.append((word.lower(),tabsep[0]))
			## Automatic feature extractor method
			list_tuples.append((txt,tabsep[0]))
		r.close()
	entire_data=list_tuples
	print "It took "+str(time.time()-a)+" seconds to import data"
	print 'data imported'
	# train=entire_data
	accuracy_results=[]
	for i in range(0,1000):
		# accuracy_results.append(train_nbc(entire_data,vocabulary))
		accuracy_results.append(train_svm(entire_data,vocabulary))
	print accuracy_results
	# post="Awks kejru moment while convocating"
	# classify(post,cl)
	# post="Mondays, you've met your match."
	# classify(post,cl)
	# post="Russia Celebrates it. India calls it a political gimmick. Incredible India."
	# classify(post,cl)
	# post="NARSEEMOONJEEE , yaaay this is really happening :')"
	# classify(post,cl)
	# post="A true friendship can't be broken by anything, not even DLC"
	# classify(post,cl)
	
	return HttpResponse(response)

def train_nbc(entire_data,vocabulary):
	random.seed()
	random.shuffle(entire_data)
	list_len=len(entire_data)
	break_point=int(math.floor(list_len*0.9))
	train = entire_data[:break_point-1]	#splitting data into training and testing sets
	test = entire_data[break_point:]
	# print 'training data'
	a = time.time()
	# cl = NaiveBayesClassifier(train)
	## Training with custom features
	# print 'extracting features'
	feature_set = [({i:(i in TextBlob(data_point[0].lower()).words) for i in vocabulary},data_point[1]) for data_point in train]
	test_set =  [({i:(i in TextBlob(data_point[0].lower()).words) for i in vocabulary},data_point[1]) for data_point in test]
	# print feature_set
	cl = nbc.train(feature_set)
	# print "It took "+str(time.time()-a)+" seconds to train data"
	# print 'data trained, now checking accuracy:'
	a = time.time()
	# accuracy = cl.accuracy(test)
	accuracy = nltk.classify.accuracy(cl, test_set)
	print "accuracy: "+str(round(accuracy*100, 2))+"%"
	# print "It took "+str(time.time()-a)+" seconds to test accuracy"
	return accuracy*100

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
	count_vect = CountVectorizer()
	train_data = [data_point[0] for data_point in train]
	train_target = [data_point[1] for data_point in train]
	X_train_counts = count_vect.fit_transform(train_data)
	tf_transformer = TfidfTransformer(use_idf=False).fit(X_train_counts)
	X_train_tf = tf_transformer.transform(X_train_counts)
	# print X_train_tf.shape
	cl = Pipeline([('vect', CountVectorizer()),('tfidf', TfidfTransformer()),('cl', SGDClassifier(loss='hinge', penalty='l2',alpha=1e-3, n_iter=5, random_state=42)),])
	cl.fit(train_data,train_target)
	test_data = [data_point[0] for data_point in test]
	test_target = [data_point[1] for data_point in test]
	predicted = cl.predict(test_data)
	accuracy=np.mean(predicted == test_target)            
	# # print "It took "+str(time.time()-a)+" seconds to train data"
	# # print 'data trained, now checking accuracy:'
	# a = time.time()
	print "accuracy: "+str(round(accuracy*100, 2))+"%"
	return round(accuracy*100, 2)

def classify(post,cl):
	prob_dist = cl.prob_classify(post)
	tag=prob_dist.max()
	print post
	print "There are "+str(round(prob_dist.prob(tag)*100, 2))+"%"+" chances this post is "+tag

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