from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^feed-search/$', views.feedSearch, name='feed search'),
    url(r'^analyse-sentiment/$', views.analyseSentiment, name='analyse sentiment'),
]