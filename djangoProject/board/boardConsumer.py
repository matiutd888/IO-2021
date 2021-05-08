import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

class BoardConsumer(WebsocketConsumer):
    def connect(self):
        print("Connecting!")
        self.accept()

    def disconnect(self, close_code):
        print("Disconnecting")
        pass

    def receive(self, data):
        text_data_json = json.loads(data)
        message = text_data_json['message']

        self.send(data=json.dumps({
            'message': message
        }))



class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.board_pk = self.scope['url_route']['kwargs']['boardPK']
        self.board_group_name = 'board_%s' % self.board_pk
        print(self.board_pk)
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.board_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.board_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.board_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message
        }))
