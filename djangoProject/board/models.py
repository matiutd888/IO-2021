import random
import string

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse


# Create your models here.
class Board(models.Model):
    title = models.CharField(max_length=100)
    date_created = models.DateTimeField(default=timezone.now)
    admin_user_b = models.ForeignKey(User, on_delete=models.CASCADE)
    guests_b = models.ManyToManyField(User, related_name='invited_users')
    board_string = models.TextField()

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('board-detail', kwargs={'pk': self.pk})

    @property
    def create_link(self):
        code_ = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        inv = BoardInviteCode(code=code_, related_board=self, usage=999)
        inv.save()

        return inv

class BoardInviteCode(models.Model):
    code = models.TextField(max_length=10)
    related_board = models.ForeignKey(Board, related_name='invite_codes', on_delete=models.CASCADE)
    usage = models.IntegerField()
