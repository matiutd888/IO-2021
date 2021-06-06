import random
import string

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse


class ClassRoom(models.Model):
    title = models.CharField(max_length=100)
    author = models.ForeignKey(User, related_name='admin_classes', on_delete=models.CASCADE)
    students = models.ManyToManyField(User, related_name='students_classes')

    @property
    def create_link(self):
        code_ = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        inv = ClassInviteCode(code=code_, related_class=self, usage=999)
        inv.save()

        return inv

    def get_absolute_url(self):
        return reverse('disp_classrooms')


class ClassInviteCode(models.Model):
    code = models.TextField(max_length=10)
    related_class = models.ForeignKey(ClassRoom, related_name='class_invite_codes', on_delete=models.CASCADE)
    usage = models.IntegerField()


# Create your models here.
class Board(models.Model):
    title = models.CharField(max_length=100)
    date_created = models.DateTimeField(default=timezone.now)
    admin_user_b = models.ForeignKey(User, related_name='administrator', on_delete=models.CASCADE)
    belonging = models.ForeignKey(ClassRoom, related_name='belonging_boards', on_delete=models.CASCADE, null=True, blank=True)
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
