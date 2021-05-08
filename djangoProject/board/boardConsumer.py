import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class BoardConsumer(WebsocketConsumer):
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
    def board_modify(self, event):
        data_type = event['data_type']
        data = event['data_json']
        print(type(data_type))
        print(type(data))
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'data_json': json.dumps(data),
            'data_type': data_type
        }))

    def receive(self, text_data):
        data_json = json.loads(text_data)
        m_data = data_json['data_json']
        data_type = data_json['data_type']
        print("Receive: received object", "type = " + data_type, "data_json:", m_data)

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.board_group_name,
            {
                'type': 'board_modify',
                'data_json': m_data,
                'data_type': data_type
            }
        )
