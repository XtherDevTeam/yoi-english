# Yoi English Client 编译部署指南

## 前置条件

- NVM 管理 Node.js 版本
- Node.js 18.18.2 以上版本
- Git
- Android SDK

## 编译安装

1. 克隆项目到本地

```sh
git clone http://www.xiaokang00010.top:4001/xiaokang00010/YoiEnglish.git
```

2. 安装依赖

```sh
cd YoiEnglish
nvm use 18.18.2
npm install
```

3. 编译安装

```sh
npx eas build --platform android --profile production --local
```

## 注意事项

- 请确保已安装 Android SDK，并配置环境变量
- 请确保已安装 NVM，并配置环境变量
- 请确保已安装 Node.js 18.18.2 以上版本
- 请确保已安装 Git
- 请确保已安装 Android Studio，并配置环境变量