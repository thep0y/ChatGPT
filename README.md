# ChatGPT
ChatGPT 客户端

## 1 安装

在最新 [releases](https://github.com/thep0y/ChatGPT/releases/latest) 中选择对应自己平台的安装包，下载即可运行或安装。

## 2 配置

现在的版本是通过环境变量使用 **OPEN_API_KEY** 的。

假设你的 OPEN_API_KEY 是`123456`，需要做如下配置：

**Linux**

```bash
# bash
echo 'export OPEN_API_KEY=123456' >> ~/.bashrc
# zsh
echo 'export OPEN_API_KEY=123456' >> ~/.zshenv
# fish
echo 'set -x OPEN_API_KEY 123456' >> ~/.config/fish/config.fish
```

**Windows**

Windows 平台中无法使用命令快速固化环境变量，需要通过**系统属性 > 环境变量 > 用户变量**添加，如下图：

![image-20230324215543612](https://i.imgtg.com/2023/03/24/93DtN.png)

## 3 运行

如果你使用的是便携版，则需要通过终端或文件管理器进入其所在目录运行。

如果你使用的是安装版，在程序坞或开始菜单点击 **ChatGPT 客户端** 图标即可运行。
