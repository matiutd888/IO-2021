from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.generic import CreateView, DetailView, ListView, DeleteView, FormView
from .models import Board, User, ClassRoom
from .invite import handle_invite, handle_invite_class
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django import forms

# Create your views here.

@login_required
def disp_profiles(request):
    return render(request, 'profile.html')


def disp_classes(request):
    context = {
        'classroom': True
    }
    return render(request, 'profile_classroom.html', context)


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
        if b.belonging is not None:
            print("CHECKING STUDENTS!\n")
            student_list = ClassRoom.objects.get(pk=b.belonging_id).students
            if request.user in student_list.all():
                return render(request, 'board/board_detail.html', context={'object': b})

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


@login_required
def createBoardForClassroom(request, pk):
    if request.method == "POST":
        if 'board_title' in request.POST:
            classroom = ClassRoom.objects.get(pk=pk)
            print(request.POST['board_title'])
            new_board = Board(title=request.POST['board_title'], admin_user_b=classroom.author, belonging=classroom)
            new_board.save()

            messages.success(request, "Board created!")

            return redirect('disp_classrooms')

    messages.warning(request, "Something went wrong...")
    return redirect('disp_classrooms')


class ClassRoomCreateView(LoginRequiredMixin, CreateView):
    model = ClassRoom
    fields = ['title']

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


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
        file.open(mode='r')
        lines = file.read()
        # print("LINES\n" + str(lines))
        file.close()
        Board.objects.create(board_string=lines.decode('utf-8'), admin_user_b=user, title=self.cleaned_data.get('title'))
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


def use_invite_classroom(request, g_code=""):
    if request.user.is_authenticated:
        if g_code != "":
            classroom = handle_invite_class(g_code)
        elif request.method == "POST":
            classroom = handle_invite_class(request.POST.get('bc', ""))
        else:
            classroom = -1

        if classroom == -1:
            messages.error(request, 'Invalid invitation code. Please try again.')
        else:
            b = ClassRoom.objects.get(pk=classroom)
            if request.user in b.students.all():
                messages.warning(request, 'You\'ve already joined the class!')
            elif request.user == b.author:
                messages.warning(request, 'You are the owner of this class!')
            else:
                b.students.add(request.user)
                messages.success(request, "You've been successfully added to the class.")

        return redirect('disp_classrooms')
    else:
        return redirect('login')


def classroom_settings(request, pk):
    try:
        classroom = ClassRoom.objects.get(pk=pk)
        context = {
            'class': classroom,
            'classroom': True,
        }
        return render(request, 'board/classroom_settings.html', context)
    except:
        messages.error(request, "Please provide valid classroom.")
        return redirect('disp_classrooms')


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


def gen_classroom_invite(request, pk):
    print("ESSA")
    if request.method == "POST":
        number = request.POST.get("number", 999)
    else:
        number = 999

    invite_code = ClassRoom.objects.get(pk=pk).create_link
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

        if u_pk == -1:
            messages.warning(request, "Please pick valid user first.")
            return redirect('board_settings', b_pk)

        print(u_pk)

        user = User.objects.get(pk=u_pk)

        if request.user == b.admin_user_b and user != b.admin_user_b:
            b.guests_b.remove(user)
            messages.success(request, "User was kicked succesfully!")

            return redirect('board_settings', b_pk)

    messages.error(request, "Something went wrong...")

    return redirect('disp_profile')


def kick_user_from_class(request, c_pk):
    if not request.user.is_authenticated:
        return redirect('login')

    if request.method == "POST":
        c = ClassRoom.objects.get(pk=c_pk)
        u_pk = int(request.POST.get('user_id', ""))

        if u_pk == -1:
            messages.warning(request, "Please pick valid user first.")
            return redirect('class_settings', c_pk)

        print(u_pk)

        user = User.objects.get(pk=u_pk)

        if request.user == c.author and user != c.author:
            c.students.remove(user)
            messages.success(request, "User was kicked succesfully!")

            return redirect('class_settings', c_pk)

    messages.error(request, "Something went wrong...")

    return redirect('disp_classrooms')

