import threading
from .models import BoardInviteCode, ClassInviteCode

board_mutex = threading.Lock()
class_mutex = threading.Lock()


def parse_code(code_name):
    i = 1

    while i < len(code_name) and code_name[-i] != '_':
        print(code_name[-i])
        i += 1

    if (i == len(code_name)):
        raise Exception("Invalid code!")

    i -= 1

    object_pk = int(code_name[-i:])
    code_val = code_name[:len(code_name) - i - 1]

    return (object_pk, code_val)


def handle_invite(code_name):
    if code_name == "":
        return -1

    try:
        (board_pk, code_val) = parse_code(code_name)
    except:
        return -1

    board_mutex.acquire()
    code_obj_list = BoardInviteCode.objects.filter(code=code_val)

    if len(code_obj_list) > 0:
        try:
            code_obj = code_obj_list.get(pk=code_obj_list[0].pk)
        except:
            return -1

        code_obj.usage -= 1
        print(code_obj.usage)

        if code_obj.usage == 0:
            code_obj.delete()

        board_mutex.release()

        return board_pk

    board_mutex.release()

    return -1


def handle_invite_class(code_name):
    if code_name == "":
        return -1

    try:
        (class_pk, code_val) = parse_code(code_name)
    except:
        return -1

    board_mutex.acquire()
    code_obj_list = ClassInviteCode.objects.filter(code=code_val)

    if len(code_obj_list) > 0:
        try:
            code_obj = code_obj_list.get(pk=code_obj_list[0].pk)
        except:
            return -1

        code_obj.usage -= 1
        print(code_obj.usage)

        if code_obj.usage == 0:
            code_obj.delete()

        board_mutex.release()

        return class_pk

    board_mutex.release()

    return -1
