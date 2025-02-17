#!/usr/bin/env python3
import argparse
import os
import clint
import requests
import pathlib
import tempfile
import shutil
import subprocess
import sys

parser = argparse.ArgumentParser(description='Yoi English 命令行工具')

parser.add_argument('-f', '--build-frontend', help='使用 node.js 构建前端生产环境', action='store_true')
parser.add_argument('-b', '--start-backend', help='使用 Python 启动后端服务器', action='store_true')
parser.add_argument('-e', '--initialize-backend-env', help='使用 Python 为后端服务器设置环境', action='store_true')
parser.add_argument('-l', '--install-livekit-server', help='安装 LiveKit 服务器', action='store_true')
parser.add_argument('-i', '--run-livekit-server', help='使用默认配置运行 LiveKit 服务器', action='store_true')


def tempFilepathProvider(ext: str):
    return pathlib.Path(tempfile.mkstemp(suffix=ext)[1])


def downloader(url: str, filename: str):
    if os.path.exists(filename):
        print(f"{filename} 已存在。跳过下载。")
        return
    print(f"正在下载 {url} 到 {filename}...")
    response = requests.get(url, stream=True)
    with open(filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
        print(f"下载完成。已保存到 {filename}。")

    return pathlib.Path(filename)


def ask(preprompt: str, arg_desp: dict[str, dict]) -> dict[str, str]:
    print(preprompt)
    result = {}
    for arg, info in arg_desp.items():
        prompt = f"{arg}: {info['description']}"
        if 'default' in info:
            prompt += f" (默认值: {info['default']})"
        result[arg] = input(prompt) or info.get('default', '')
    return result


def build_frontend():
    print("正在构建前端...")
    # check if node.js is installed
    if shutil.which("node") is None:
        print("Node.js 未安装。请安装 Node.js (>= 18.18.2) 后重试。")
        return

    # run npm install
    subprocess.run(["npm", "install"], cwd=pathlib.Path.cwd() / "admin", shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())
    # run npm build
    subprocess.run(["npm", "run", "build"], cwd=pathlib.Path.cwd() / "admin", shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())
    args = {
        "install_to_var": {
            "description": "将前端安装到系统目录（例如 /var/www/html）。(是/否)",
            "default": "no"
        },
        "create_nginx_config": {
            "description": "从模板为前端创建一个 nginx 配置文件。(是/否)",
            "default": "yes"
        }
    }
    args = ask("自定义你的前端安装：", args)
    if args['install_to_var'].lower() == "yes":
        # copy build files to /var/www/html
        shutil.copytree(pathlib.Path.cwd() / "frontend" / "build", "/var/www/html/yoi-english")
        print("前端已安装到 /var/www/html/yoi-english。")
    if args['create_nginx_config'].lower() == "yes":
        # create nginx config file
        nginx_config_path = "/etc/nginx/sites-available/yoi-english"
        nginx_config_template_path = pathlib.Path.cwd() / "nginx.conf.template"
        config_template = nginx_config_template_path.read_text()
        nginx_config_path.write_text(config_template)
        print(f"Nginx 配置文件已创建在 {nginx_config_path}，内容如下：")
        print(config_template)
        print('重要提示：请相应地修改 ssl_certificate 和 ssl_certificate_key 的路径。')
        # enable nginx config
        subprocess.run(["sudo", "ln", "-s", nginx_config_path, "/etc/nginx/sites-enabled/yoi-english"], shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())
        print("Nginx 配置已启用。")
        # restart nginx
        subprocess.run(["sudo", "systemctl", "restart", "nginx"], shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())
        print("Nginx 已重启。")


def start_backend():
    print("正在启动后端服务器...")
    # check if python is installed
    if shutil.which("conda") is None:
        print("Conda 未安装。请安装 conda 后重试。")
        return

    # check if conda environment exists
    if os.environ.get('CONDA_DEFAULT_ENV', '') != 'YoiEnglish':
        print("未找到名为 YoiEnglish 的默认 conda 环境。尝试使用当前环境。")

    subprocess.run(["python", "app.py"], cwd=pathlib.Path.cwd() / "server", shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())


def initialize_backend_env():
    print("正在设置后端环境...")
    # check if python is installed
    if shutil.which("conda") is None:
        print("Conda 未安装。请安装 conda 后重试。")
        return

    # check if conda environment exists
    if os.environ.get('CONDA_DEFAULT_ENV', '') != 'YoiEnglish':
        print("未找到名为 YoiEnglish 的默认 conda 环境。尝试使用当前环境。")

    # create conda environment
    subprocess.run(["conda", "create", "-n", "YoiEnglish", "--file", "conda_env.txt"], cwd=pathlib.Path.cwd() / "server", shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())
    print("Conda 环境已创建。")

    # activate conda environment
    subprocess.run(["conda", "activate", "YoiEnglish"], shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())
    print("Conda 环境已激活。")

    print("后端环境设置完成。你可以通过在 server 目录下运行 'python app.py' 来启动服务器，或者直接使用命令行工具。")
    print("重要提示：你需要相应地设置 AIDub 中间件以获得最佳后端体验。")


def install_livekit_server():
    print("正在安装 LiveKit 服务器...")
    # check if brew is installed
    if shutil.which("brew") is None:
        print("Homebrew 未安装。请安装 Homebrew 后重试。")
        return

    # install livekit server
    subprocess.run(["brew", "install", "livekit"], shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())

    print("LiveKit 服务器已安装。")


def run_livekit_server():
    print("正在运行 LiveKit 服务器...")
    # check if livekit is installed
    if shutil.which("livekit-server") is None:
        print("LiveKit 服务器未安装。请安装 LiveKit 服务器后重试。")
        return

    # run livekit server
    subprocess.run(["livekit-server", "--config", "livekit.yaml"], cwd=pathlib.Path.cwd(), shell=False, stdout=sys.stdout.fileno(), stderr=sys.stderr.fileno(), stdin=sys.stdin.fileno())

    print("LiveKit 服务器正在运行。")


if __name__ == '__main__':
    args = parser.parse_args()
    if args.build_frontend:
        build_frontend()
    elif args.start_backend:
        start_backend()
    elif args.initialize_backend_env:
        initialize_backend_env()
    elif args.install_livekit_server:
        install_livekit_server()
    elif args.run_livekit_server:
        run_livekit_server()
    else:
        parser.print_help()