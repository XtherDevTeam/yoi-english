import time

def TimeProvider() -> str:
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())


def DateProvider() -> str:
    return time.strftime('%Y-%m-%d', time.localtime())