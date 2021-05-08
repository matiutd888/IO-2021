import threading
from .models import BoardInviteCode, Board

mutex = threading.Lock()


def handle_invite(code_name):
    if code_name == "":
        return -1

    i = 1

    while i <= len(code_name) and code_name[-i] != '_':
        print(code_name[-i])
        i += 1

    i -= 1

    board_pk = int(code_name[-i:])
    code_val = code_name[:len(code_name) - i - 1]
    mutex.acquire()
    code_obj_list = BoardInviteCode.objects.filter(code=code_val)

    if len(code_obj_list) > 0:
        code_obj = code_obj_list.get(pk=code_obj_list[0].pk)
        code_obj.usage -= 1
        print(code_obj.usage)

        if code_obj.usage == 0:
            code_obj.delete()

        mutex.release()

        return board_pk

    mutex.release()

    return -1
