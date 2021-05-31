from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return HttpResponse("Hello, world. You're at the polls indsex.")


from django.http import JsonResponse
from django.db import connection


def process(request):
    with connection.cursor() as cursor:
        cursor.execute("select * from users")
        columns = [col[0] for col in cursor.description]
        return JsonResponse([
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ], safe=False)

# Create your views here.
