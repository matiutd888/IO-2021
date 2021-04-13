from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse

# Create your models here.
class Board(models.Model):
    title = models.CharField(max_length=100)
    date_created = models.DateTimeField(default=timezone.now)
    admin_user_b = models.ForeignKey(User, on_delete=models.CASCADE)
    board_string = models.TextField()

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('board-detail', kwargs={'pk': self.pk})