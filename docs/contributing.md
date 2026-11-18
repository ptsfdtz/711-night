# 维护场景目录

1. 将场景和资源放在 `models/<模型名称>/<版本>/`，例如 `models/gpt/6.2-astra/`。
2. 在 `models/scenes.json` 填写展示名称 `name` 和相对于 `models/` 的目录 `dir`。默认入口为 `index.html`，可用 `entry` 指定同目录下的其他 HTML 文件。需要在首页展示说明时填写 `note`。
3. 从仓库根目录运行 `node tools/sync-catalog.cjs` 更新首页目录。
4. 安装工具依赖并启动静态服务器。另开终端生成预览图，然后校验目录。

```sh
npm install
python -m http.server 18990 --bind 127.0.0.1
```

```sh
node tools/capture-previews.cjs gpt/6.2-astra
node tools/sync-catalog.cjs --check
```

截图保存到 `docs/previews/<模型名称>-<版本>.png`。省略目录参数可截取全部场景。Windows 上使用本机 Chrome，其他平台可运行 `npx playwright install chromium` 安装浏览器。
