from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.generic import CreateView, DetailView, ListView
from .models import Board
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import  messages
from django.http import JsonResponse


# Create your views here.

@login_required
def disp_profiles(request):
    return render(request, 'profile.html')


def about(request):
    return render(request, 'about.html')


def canvas(request):
    return render(request, 'canvas.html')

class UserBoardsView(ListView):
    model = Board
    template_name = 'profile.html'
    context_object_name = 'all_user_boards'

    def get_queryset(self):
        return Board.objects.filter(admin_user_b=self.request.user)

class BoardDetailView(DetailView, UserPassesTestMixin):
    model = Board

    def test_func(self):
        board = self.get_object()
        if self.request.user == board.admin_user_b:
            return True
        return False

class BoardCreateView(LoginRequiredMixin, CreateView):
    model = Board
    fields = ['title']

    def form_valid(self, form):
        form.instance.admin_user_b = self.request.user
        return super().form_valid(form)

def save_canvas(request):
    str_canvas = request.POST['canvas_']
    board_id = request.POST['board_id']

    board = Board.objects.filter(pk=board_id).first()

    board.board_string = str_canvas

    board.save()

    messages.success(request, 'Board updated!')

    data_text = 'Reply'

    return JsonResponse({'data': data_text})
