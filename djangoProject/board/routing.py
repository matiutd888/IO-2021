from django.urls import re_path

from . import boardConsumer

websocket_urlpatterns = [
    re_path(r'ws/board/(?P<boardPK>\w+)/$', boardConsumer.BoardConsumer.as_asgi()),
]
