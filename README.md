# Yoi English 部署与使用教程

本教程将指导你如何使用 `cli.py` 命令行工具初始化和管理 Yoi English 项目。

## 前置准备

在使用本 CLI 工具之前，请确保你已经安装了以下软件：

* **Python 3:**  Python 3 是运行本 CLI 工具的基础环境。
* **pip:**  Python 的包管理器，用于安装必要的 Python 库。
* **Node.js (>= 18.18.2):**  构建前端环境需要 Node.js 和 npm (Node 包管理器)。
* **conda:**  推荐使用 conda 管理 Python 环境，后端服务依赖 conda 环境。
* **Homebrew (macOS/Linux):**  安装 LiveKit Server 需要 Homebrew (仅限 macOS 和 Linux 系统)。
* **nginx (可选):** 如果需要部署前端到生产环境并使用 HTTPS，则需要安装 nginx。

## CLI 命令概览

`cli.py` 提供了以下命令来帮助你快速搭建和管理 Yoi English 项目：

* `-f` 或 `--build-frontend`: 使用 node.js 构建前端生产环境。
* `-b` 或 `--start-backend`: 使用 Python 启动后端服务器。
* `-e` 或 `--initialize-backend-env`: 使用 Python 为后端服务器设置环境 (创建 conda 环境)。
* `-l` 或 `--install-livekit-server`: 安装 LiveKit 服务器。
* `-i` 或 `--run-livekit-server`: 使用默认配置运行 LiveKit 服务器。

你可以通过运行 `./cli.py -h` 或 `./cli.py --help` 查看所有可用的命令和帮助信息。

## 初始化流程及命令详解

以下步骤将指导你如何使用 CLI 工具初始化 Yoi English 项目的不同部分。

### 1. 设置后端环境 (`--initialize-backend-env`)

**命令:**

```bash
./cli.py -e
# 或
./cli.py --initialize-backend-env
```

**前置条件:**

* **conda 已安装:**  脚本会检查 `conda` 命令是否可用。如果未安装，会提示安装 conda。



1. **执行命令:** 运行上述命令后，脚本会开始设置后端环境。
2. **检查 conda:** 脚本首先检查系统中是否安装了 `conda`。
   - 如果 `conda` 未安装，程序会输出错误信息 "Conda 未安装。请安装 conda 后重试。" 并停止执行。
   - 如果 `conda` 已安装，程序会继续执行。
3. **检查 conda 环境:** 脚本会检查当前是否激活了名为 `YoiEnglish` 的 conda 环境。
   - 如果环境变量 `CONDA_DEFAULT_ENV` 不是 `YoiEnglish`，脚本会输出提示信息 "未找到名为 YoiEnglish 的默认 conda 环境。尝试使用当前环境。"  但这并不会阻止环境初始化，脚本会继续尝试创建 `YoiEnglish` 环境。
4. **创建 conda 环境:** 脚本会尝试在 `server` 目录下使用 `conda_env.txt` 文件创建一个名为 `YoiEnglish` 的 conda 环境。执行的命令是：
   ```bash
   conda create -n YoiEnglish --file conda_env.txt
   ```
   -  `conda_env.txt` 文件应该位于 `server` 目录下，并列出了后端服务所需的 Python 包及其版本。
5. **激活 conda 环境 (仅输出提示):**  脚本会尝试输出激活 conda 环境的命令，但 **不会实际激活当前 shell 的 conda 环境**。 执行的命令是：
   ```bash
   conda activate YoiEnglish
   ```
   -  这个命令只是为了在终端输出提示，告诉你如何手动激活环境。
6. **完成提示:** 脚本会输出以下信息，表示后端环境设置完成：
   ```
   Conda 环境已创建。
   Conda 环境已激活。
   后端环境设置完成。你可以通过在 server 目录下运行 'python app.py' 来启动服务器，或者直接使用命令行工具。
   重要提示：你需要相应地设置 AIDub 中间件以获得最佳后端体验。
   ```
   -  **注意:**  脚本创建了 conda 环境，但你需要 **手动** 激活 `YoiEnglish` 环境才能正确运行后端服务。激活命令提示已经给出。

### 2. 构建前端 (`--build-frontend`)

**命令:**

```bash
./cli.py -f
# 或
./cli.py --build-frontend
```

**前置条件:**

* **Node.js (>= 18.18.2) 和 npm 已安装:** 脚本会检查 `node` 命令是否可用。如果未安装，会提示安装 Node.js。



1. **执行命令:** 运行上述命令后，脚本会开始构建前端。
2. **检查 Node.js:** 脚本首先检查系统中是否安装了 `node`。
   - 如果 `node` 未安装，程序会输出错误信息 "Node.js 未安装。请安装 Node.js (>= 18.18.2) 后重试。" 并停止执行。
   - 如果 `node` 已安装，程序会继续执行。
3. **运行 `npm install`:** 脚本会在 `frontend` 目录下执行 `npm install` 命令，安装前端项目所需的 npm 包。
   ```bash
   npm install
   ```
   -  `frontend` 目录应包含前端项目的 `package.json` 文件。
4. **运行 `npm run build`:** 脚本会在 `frontend` 目录下执行 `npm run build` 命令，构建前端生产环境代码。
   ```bash
   npm run build
   ```
   -  `package.json` 文件的 `scripts` 部分应包含 `build` 命令，用于执行前端构建过程 (例如，使用 React 或 Vue.js 的构建工具)。 构建后的文件通常会输出到 `frontend/build` 目录。
5. **用户交互 (自定义安装):**  脚本会提示用户进行自定义前端安装配置，通过 `ask` 函数与用户交互，询问以下问题：
   -  **将前端安装到系统目录（例如 /var/www/html）。(是/否) (默认值: 否)**
   -  **从模板为前端创建一个 nginx 配置文件。(是/否) (默认值: 是)**
   用户可以输入 "yes" 或 "no" 以及回车来选择，或直接回车使用默认值。
6. **根据用户选择执行安装和配置:**
   - **如果用户选择安装到系统目录 (yes):**
     -  脚本会将 `frontend/build` 目录下的所有文件复制到 `/var/www/html/yoi-english` 目录。
     -  输出 "前端已安装到 /var/www/html/yoi-english。"
   - **如果用户选择创建 nginx 配置文件 (yes):**
     -  脚本会读取 `nginx.conf.template` 文件的内容。
     -  将内容写入 `/etc/nginx/sites-available/yoi-english` 文件。
     -  输出 "Nginx 配置文件已创建在 /etc/nginx/sites-available/yoi-english，内容如下：" 并打印配置文件内容。
     -  输出 "重要提示：请相应地修改 ssl_certificate 和 ssl_certificate_key 的路径。" 提醒用户配置 SSL 证书路径。
     -  使用 `sudo` 命令创建符号链接，启用 nginx 配置：
        ```bash
        sudo ln -s /etc/nginx/sites-available/yoi-english /etc/nginx/sites-enabled/yoi-english
        ```
     -  输出 "Nginx 配置已启用。"
     -  使用 `sudo` 命令重启 nginx 服务：
        ```bash
        sudo systemctl restart nginx
        ```
     -  输出 "Nginx 已重启。"

### 3. 启动后端服务器 (`--start-backend`)

**命令:**

```bash
./cli.py -b
# 或
./cli.py --start-backend
```

**前置条件:**

* **conda 已安装:** 脚本会检查 `conda` 命令是否可用。如果未安装，会提示安装 conda。
* **后端环境已设置:**  建议先运行 `--initialize-backend-env` 命令设置好后端环境，并 **手动激活 `YoiEnglish` conda 环境**。



1. **执行命令:** 运行上述命令后，脚本会尝试启动后端服务器。
2. **检查 conda:** 脚本首先检查系统中是否安装了 `conda`。
   - 如果 `conda` 未安装，程序会输出错误信息 "Conda 未安装。请安装 conda 后重试。" 并停止执行。
   - 如果 `conda` 已安装，程序会继续执行。
3. **检查 conda 环境 (提示):** 脚本会检查环境变量 `CONDA_DEFAULT_ENV` 是否为 `YoiEnglish`。
   - 如果不是，脚本会输出提示信息 "未找到名为 YoiEnglish 的默认 conda 环境。尝试使用当前环境。"  但这并不会阻止程序运行，脚本会继续尝试启动后端。 **强烈建议手动激活 `YoiEnglish` 环境。**
4. **启动后端应用:** 脚本会在 `server` 目录下执行 `python app.py` 命令，启动后端 Python 应用。
   ```bash
   python app.py
   ```
   -  `server` 目录应包含后端 Python 应用的入口文件 `app.py`。

### 4. 安装 LiveKit 服务器 (`--install-livekit-server`)

**命令:**

```bash
./cli.py -l
# 或
./cli.py --install-livekit-server
```

**前置条件:**

* **Homebrew 已安装 (macOS/Linux):** 脚本会检查 `brew` 命令是否可用。如果未安装，会提示安装 Homebrew。
   -  **Windows 用户:**  LiveKit Server 的安装可能需要不同的方式，本脚本的此命令可能不适用。请参考 LiveKit 官方文档获取 Windows 安装指南。



1. **执行命令:** 运行上述命令后，脚本会尝试安装 LiveKit 服务器。
2. **检查 Homebrew:** 脚本首先检查系统中是否安装了 `brew`。
   - 如果 `brew` 未安装，程序会输出错误信息 "Homebrew 未安装。请安装 Homebrew 后重试。" 并停止执行。
   - 如果 `brew` 已安装，程序会继续执行.
3. **使用 Homebrew 安装 LiveKit:** 脚本会执行 `brew install livekit` 命令，使用 Homebrew 安装 LiveKit Server。
   ```bash
   brew install livekit
   ```
4. **完成提示:** 脚本会输出 "LiveKit 服务器已安装。" 表示安装完成。

### 5. 运行 LiveKit 服务器 (`--run-livekit-server`)

**命令:**

```bash
./cli.py -i
# 或
./cli.py --run-livekit-server
```

**前置条件:**

* **LiveKit Server 已安装:**  建议先运行 `--install-livekit-server` 命令安装 LiveKit Server。



1. **执行命令:** 运行上述命令后，脚本会尝试运行 LiveKit 服务器。
2. **检查 LiveKit Server:** 脚本首先检查系统中是否安装了 `livekit-server` 命令。
   - 如果 `livekit-server` 未安装，程序会输出错误信息 "LiveKit 服务器未安装。请安装 LiveKit 服务器后重试。" 并停止执行。
   - 如果 `livekit-server` 已安装，程序会继续执行.
3. **运行 LiveKit Server:** 脚本会在当前目录下执行 `livekit-server --config livekit.yaml` 命令，使用 `livekit.yaml` 配置文件启动 LiveKit Server。
   ```bash
   livekit-server --config livekit.yaml
   ```
   -  `livekit.yaml` 文件应位于当前目录下，包含 LiveKit Server 的配置信息。
4. **完成提示:** 脚本会输出 "LiveKit 服务器正在运行。" 表示 LiveKit Server 已经启动。