#!/usr/bin/env python3
# -*- coding:utf-8 -*-
# @Author:      thepoy
# @Email:       thepoy@163.com
# @File Name:   upx.py
# @Created At:  2023-03-19 21:31:57
# @Modified At: 2023-04-01 22:58:06
# @Modified By: thepoy

import shutil
import json
import tempfile
import sys
import platform
import zipfile
import os
import subprocess

from pathlib import Path
from urllib import request


def download_file(url: str, dest: Path):
    print("upx: downlaoding", url, "->", dest)

    resp = request.urlopen(url)

    with dest.open("wb") as f:
        f.write(resp.read())

    print("upx: downloaded", dest)


def cmd_exists(cmd: str):
    if shutil.which(cmd) is not None:
        return True

    return False


def get_latest() -> str:
    url = "https://api.github.com/repos/upx/upx/releases/latest"
    resp = request.urlopen(url)
    body = json.load(resp)

    print("upx: got latest verion", body["tag_name"])

    return body["tag_name"][1:]


def download_upx(version: str, url: str):
    temp_dir = Path(tempfile.gettempdir()) / "chatgpt-client"
    if not temp_dir.exists():
        temp_dir.mkdir()

    url = f"{url}/upx/upx/releases/download/v{version}/upx-"

    if sys.platform == "darwin":
        print("macOS 不支持自动下载 upx")
        return
    elif sys.platform == "linux":
        print("linux 尚不支持自动下载 upx")
        return
    elif sys.platform == "win32":
        exe_file = temp_dir / "upx.exe"
        if exe_file.exists():
            return exe_file

        arch = platform.architecture()[0]
        if arch == "64bit":
            url += f"{version}-win64.zip"
            folder = f"upx-{version}-win64"
        else:
            url += f"{version}-win32.zip"
            folder = f"upx-{version}-win32"

        temp_file = temp_dir / "upx.zip"

        download_file(url, temp_file)

        with zipfile.ZipFile(temp_file, "r") as zf:
            zf.extract(f"{folder}/upx.exe", temp_dir)

        shutil.move(temp_dir / folder / "upx.exe", temp_dir)
        shutil.rmtree(temp_dir / folder)
        os.remove(temp_file)

        return exe_file


def compress():
    NPM_LIFECYCLE_SCRIPT = os.getenv("NPM_LIFECYCLE_SCRIPT")
    if NPM_LIFECYCLE_SCRIPT and NPM_LIFECYCLE_SCRIPT.startswith("tauri build "):
        return

    if cmd_exists("upx"):
        print("使用环境变量中的 upx 命令")
        cmd = "upx"
    else:
        print("环境变量中未找到 upx ，即将自动下载")

        if mirror := os.getenv("GITHUB_MIRROR"):
            url = mirror
        else:
            url = "https://github.com"

        version = get_latest()
        if not version:
            version = "4.0.2"

        cmd = str(download_upx(version, url))

    cmd += " -9 src-tauri/target/release/"

    if sys.platform in ("darwin", "linux"):
        cmd += "chatgpt-client"
    elif sys.platform == "win32":
        cmd += "chatgpt-client.exe"
    else:
        raise Exception("未处理的平台 %s" % platform)

    execute(cmd)


def execute(cmd: str):
    print(f"upx: exucuting '{cmd}'")
    output = subprocess.check_output(cmd)
    print(output.decode())


if __name__ == "__main__":
    compress()
