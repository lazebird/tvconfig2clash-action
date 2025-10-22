[English](README.md) | [中文](README_zh.md)

# tvconfig2clash-action

一个用于从 tvconfig JSON 配置中自动提取所有域名，并生成符合 Clash/OpenClash rule provider 规范（behavior: domain）的 YAML 文件的工具。核心实现位于 src/main.js，可独立执行，亦可作为 GitHub Action 使用（提供 action.yml）。

## 在 GitHub Actions 中使用
从 Marketplace 直接使用本 Action（无需访问源码）：
```yaml
name: 生成 Clash Rule Provider
on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: 生成规则提供者
        uses: lazebird/tvconfig2clash-action@v1
        with:
          config_path: path/to/tvconfig.json
          output_path: path/to/output/site.yaml

      - name: 上传制品
        uses: actions/upload-artifact@v4
        with:
          name: clash-rule-provider
          path: path/to/output/site.yaml
```

## 功能概述
- 读取指定的 tvconfig JSON（示例字段：`api_site`）。
- 从各站点的 `api` 与 `detail` 字段中解析 URL，提取主机名。
- 自动归一化：
  - 统一为小写；
  - 过滤 IPv4 地址；
  - 生成基础域名（如 `api.example.com` → `example.com`）；
  - 常见前缀剥离（`api.`, `collect.`, `m3u8.`, `cj.`, `caiji.`）。
- 生成 Clash/OpenClash rule provider 文件，行为为 `domain`，`payload` 中按字典序稳定输出域名，短域名自动加 `+.` 前缀以覆盖一级泛域。

## 输入输出
- 输入：tvconfig JSON 文件，示例结构（仅说明关键字段）：
  ```json
  {
    "api_site": {
      "siteKey1": { "api": "https://api.example.com/xxx", "detail": "https://www.example.com/yyy" },
      "siteKey2": { "api": "http://collect.foo.bar/api", "detail": "http://foo.bar" }
    }
  }
  ```
- 输出：Clash/OpenClash rule provider YAML 文件，例如：
  ```yaml
  behavior: domain
  payload:
    - +.example.com
    - api.example.com
    - foo.bar
  ```

## 环境要求
- Node.js（建议 LTS 版本）
- 运行环境：Linux/macOS/Windows（脚本无平台特性依赖）

## 安装与使用
### 作为独立脚本运行
1. 克隆或下载本项目。
2. 在项目根目录执行：
   ```bash
   node src/main.js <输入JSON路径> -o <输出YAML路径>
   ```

### 命令行参数
- `-h, --help`：查看帮助。
- `<输入JSON路径>`：tvconfig JSON 文件路径（可省略）。
- `-o <输出YAML路径>`：输出 YAML 文件路径（可省略）。

当参数省略时：
- 默认输入：`config.json`（相对于 src 目录）。
- 默认输出：`dist/site.yaml`。

### 使用示例
```bash
# 指定输入与输出
node src/main.js ./test/config.json -o ./dist/site.yaml

# 使用默认路径（需保证默认输入存在）
node src/main.js
```

## 在 GitHub Actions 中使用
从 Marketplace 使用发布的 Action：
```yaml
name: 生成 Clash Rule Provider
on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: 生成规则提供者
        uses: lazebird/tvconfig2clash-action@v1
        with:
          config_path: path/to/tvconfig.json
          output_path: path/to/output/site.yaml

      - name: 上传制品
        uses: actions/upload-artifact@v4
        with:
          name: clash-rule-provider
          path: path/to/output/site.yaml
```
## 实现原理与规则
- URL 解析使用 Node.js 原生 `URL` 类，仅接受有效 URL。
- 主机名提取与标准化：统一小写、去除空白。
- 域名归约：
  - 基础域名启发式规则：保留最后两个标签（如 `sub.example.com` → `example.com`）。
  - 常见前缀剥离：遇到 `api.`、`collect.`、`m3u8.`、`cj.`、`caiji.` 时会剥离并加入集合。
- 过滤：剔除纯 IPv4（如 `1.2.3.4`）。
- 稳定输出：按字典序排序，避免输出抖动。
- YAML 安全：移除空白、统一小写，短域名（标签数≤2且不以 `+.` 开头）加 `+.` 前缀以匹配子域。

## 边界与注意事项
- 基础域名规则为启发式（非 PSL 感知），多段 TLD（如 `*.co.uk`）可能不完全精确。
- 仅解析 `api_site` 下对象的 `api` 与 `detail` 两个字段，其它字段不参与。
- 输入必须为有效 URL 字符串；非 URL、空字符串将被忽略。
- 输出可能覆盖同名文件，请谨慎指定 `-o` 路径。

## 目录结构
```
.
├── src/
│   ├── lib.js        # 核心库（域名提取 + YAML 生成）
│   └── main.js       # CLI 入口；读取输入并写出输出
├── LICENSE           # 许可证
├── action.yml        # GitHub Action 定义（Composite）
├── .gitignore        # Git 忽略规则
└── docs/
    └── STRUCTURE.md  # 英文文档（结构与规则）
```

## 许可证
本项目采用与仓库中 LICENSE 文件一致的开源许可证（请参阅 LICENSE）。