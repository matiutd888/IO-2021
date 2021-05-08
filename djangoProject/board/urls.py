from django.conf.urls import include, url
from django.urls import path
from board.views import (
    disp_profiles,
    about,
    canvas,
    BoardCreateView,
    BoardDetailView,
    BoardDeleteView,
    UserBoardsView,
    save_canvas,
    use_invite,
    gen_invite,
    del_invite,
    kick_user,
    disp_board_settings,
    dispBoard)

urlpatterns = [
    url('profile/', UserBoardsView.as_view(), name='disp_profile'),
    url('about/', about, name='about'),
    url('canvas/', canvas, name='canvas'),
    url('board/new/', BoardCreateView.as_view(), name='board-create'),
    path('board/<int:pk>/', dispBoard, name='board-detail'),
    url('board/update/', save_canvas, name='save_canvas'),
    url(r'^board/join/$', use_invite, name='join'),
    path('board/join/<str:g_code>', use_invite, name='join_get'),
    path('board/<int:pk>/geninvite', gen_invite, name='gen_invite'),
    path('board/<int:pk>/delinvite', del_invite, name='del_invites'),
    path('board/<int:pk>/settings', disp_board_settings, name='board_settings'),
    path('board/<int:b_pk>/kick', kick_user, name='kick_user'),
    url('', disp_profiles),
    path('board/<int:pk>/delete/', BoardDeleteView.as_view(), name='board-delete'),
    url('board/update/', save_canvas, name='save_canvas'),
    url('', disp_profiles, name='disp-boards'),
]
