from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.generic import CreateView, DetailView, ListView, DeleteView, FormView
from .models import Board, User
from .invite import handle_invite
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django import forms

# Create your views here.

@login_required
def disp_profiles(request):
    return render(request, 'profile.html')


def about(request):
    return render(request, 'about.html')


def canvas(request):
    return render(request, 'canvas.html')

@login_required
def disp_board_settings(request, pk):
    try:
        b = Board.objects.get(pk=pk)
    except:
       messages.error("Board not found!", request)

       return disp_profiles(request)

    if request.user != b.admin_user_b:
        messages.error("You don't have permissions to edit this board settings!", request)

        return disp_profiles(request)

    return render(request, 'board/board_settings.html', context={'board': b})


class UserBoardsView(LoginRequiredMixin, ListView):
    model = Board
    template_name = 'profile.html'
    context_object_name = 'all_user_boards'

    def get_queryset(self):
        return Board.objects.filter(admin_user_b=self.request.user)

def dispBoard(request, pk):
    b = Board.objects.get(pk=pk)

    if not request.user.is_authenticated:
        return redirect('login')

    if (not request.user == b.admin_user_b) and (not request.user in b.guests_b.all()):
        messages.error(request, "You don't have permissions to acces this board, please contact with the owner.")
        return redirect('disp_profile')

    return render(request, 'board/board_detail.html', context={'object': b})

class BoardDetailView(LoginRequiredMixin, DetailView, UserPassesTestMixin):
    model = Board

    def test_func(self):
        board = self.get_object()
        print(board.admin_user_b + "<<<")
        print(self.request.user + ">>>>>")
        if self.request.user == board.admin_user_b:
            return True
        return False

# TODO jak to się dzieje że bartek nie musi tu dać templatki...
class BoardCreateView(LoginRequiredMixin, CreateView):
    model = Board
    fields = ['title']
    def form_valid(self, form):
        form.instance.admin_user_b = self.request.user
        return super().form_valid(form)

# TODO redirect URL
# https://stackoverflow.com/questions/13412924/how-to-get-txt-file-content-from-filefield
class ImportBoardForm(forms.Form):
    title = forms.CharField(min_length=1, max_length=100)
    importedBoardFile = forms.FileField()
    def read_from_file_and_insert(self, user):
        print("READING FROM FILE!")
        file = self.cleaned_data.get('importedBoardFile')
        file.open(mode='rb')
        lines = file.read()
        print("LINES\n" + str(lines))
        file.close()
        Board.objects.create(board_string=lines, admin_user_b=user, title=self.cleaned_data.get('title'))
        return

    class Meta:
        fields = {'title', 'importedBoardFile'}

class ImportBoardFormView(LoginRequiredMixin, FormView):
    form_class = ImportBoardForm
    template_name = "import_board_template.html"
    success_url = '/profile/'
    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        # form.instance.admin_user_b = self.request.user
        form.read_from_file_and_insert(self.request.user)
        return super(ImportBoardFormView, self).form_valid(form)

class BoardDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Board
    success_url = '/profile/'

    def test_func(self):
        board = self.get_object()

        if self.request.user == board.admin_user_b:
            return True

        return False

def save_canvas(request):
    str_canvas = request.POST['canvas_']
    board_id = request.POST['board_id']

    board = Board.objects.filter(pk=board_id).first()

    board.board_string = str_canvas

    board.save()

    #Clear the messages.
    old_messages = messages.get_messages(request)
    old_messages.used = True

    messages.success(request, 'Board updated!')

    data_text = 'Reply'

    return JsonResponse({'data': data_text})


def use_invite(request, g_code=""):
    if request.user.is_authenticated:
        if g_code != "":
            board = handle_invite(g_code)
        elif request.method == "POST":
            board = handle_invite(request.POST.get('bc', ""))
        else:
            board = -1

        if board == -1:
            messages.error(request, 'Invalid invitation code. Please try again.')
        else:
            b = Board.objects.get(pk=board)
            if request.user in b.guests_b.all():
                messages.warning(request, 'You\'ve already joined the board!')
            elif request.user == b.admin_user_b:
                messages.warning(request, 'You are the owner of this board!')
            else:
                b.guests_b.add(request.user)
                messages.success(request, "You've been successfully added to the board.")

        return redirect('disp_profile')
    else:
        return redirect('login')


def gen_invite(request, pk):
    if request.method == "POST":
        number = request.POST.get("number", 999)
    else:
        number = 999

    invite_code = Board.objects.get(pk=pk).create_link
    invite_code.usage = number
    invite_code.save()

    print(invite_code.usage)

    response = invite_code.code + "_" + str(pk)

    return HttpResponse(response)

def del_invite(request, pk):
    b = Board.objects.get(pk=pk)

    b.invite_codes.all().delete()

    messages.success(request, "Links are now deactivated.")

    return redirect('board_settings', pk)

def kick_user(request, b_pk):
    if not request.user.is_authenticated:
        return redirect('login')

    if request.method == "POST":
        b = Board.objects.get(pk=b_pk)
        u_pk = int(request.POST.get('user_id', ""))

        print(u_pk)

        user = User.objects.get(pk=u_pk)

        if request.user == b.admin_user_b and user != b.admin_user_b:
            b.guests_b.remove(user)
            messages.success(request, "User was kicked succesfully!")

            return redirect('board_settings', b_pk)

    messages.error(request, "Something went wrong...")

    return redirect('disp_profile')


