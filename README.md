# RM Embedded C

RoboMaster Summer Camp 2026 嵌入式 C 开发课件合集。

本仓库使用 [Slidev](https://sli.dev/) 维护多个课程幻灯片。每个课件都是一个独立的 deck，放在 `decks/<slug>/` 下，并通过统一的首页构建和发布。

## 当前课件

- `foundation-of-embedded-c-development`：嵌入式 C 开发基础，覆盖 Git、C 工程构建、嵌入式工具链、EIDE、外设寄存器、CubeMX 生成项目和 C 语言 OOP 写法。

## 仓库结构

```text
.
├── decks/
│   └── foundation-of-embedded-c-development/
│       ├── deck.json          # deck 排序、路由和可见性
│       └── slides.md          # Slidev 课件入口
├── schemas/
│   └── deck.schema.json       # deck.json 校验说明
├── scripts/                   # 多 deck 开发、构建和导出脚本
├── site/                      # 课件索引页模板和样式
├── package.json               # 项目脚本和依赖
├── pnpm-lock.yaml             # 依赖锁定
└── .github/workflows/
    └── deploy-pages.yml       # GitHub Pages 自动部署
```

## 环境要求

- Node.js 22
- pnpm 11.8.0

如果本机已启用 Corepack，可以直接使用仓库声明的 pnpm 版本：

```bash
corepack enable
pnpm install
```

## 本地开发

安装依赖后启动完整课件站点：

```bash
pnpm run dev
```

访问课件索引：

```text
http://localhost:3030
```

只开发某一个 deck 时，可以传入 deck slug：

```bash
pnpm run dev foundation-of-embedded-c-development
```

## 构建

构建首页、404 页面和所有 `listed` deck：

```bash
pnpm run build
```

构建产物位于 `dist/`。

预览构建产物：

```bash
pnpm run preview
```

## 导出 PDF

导出指定 deck：

```bash
pnpm run export foundation-of-embedded-c-development
```

PDF 导出依赖 Playwright 的 Chromium。如果导出时报浏览器缺失，可以先安装浏览器：

```bash
pnpm exec playwright install chromium
```

## 部署

仓库已配置 GitHub Pages 工作流：

- push 到 `main` 分支会自动构建并部署
- 也可以在 GitHub Actions 页面手动触发 `Deploy Pages`
- 非 `*.github.io` 仓库会自动使用 `/<repo-name>/` 作为 base path

部署入口见 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)。

## 新增课件

1. 在 `decks/` 下创建小写 slug 目录，例如 `decks/stm32-peripheral-registers/`。
2. 添加 `slides.md`，并在文件开头写 Slidev frontmatter。首页卡片会读取其中的 `title` 和 `info`。
3. 添加 `deck.json`：

```json
{
  "$schema": "../../schemas/deck.schema.json",
  "order": 2
}
```

4. 运行 `pnpm run dev` 检查首页卡片和 deck 路由。

`deck.json` 支持：

- `order`：首页排序，数字越小越靠前。
- `route`：可选公开路由；不填时使用目录 slug。
- `visibility`：可选值为 `listed`、`hidden`、`disabled`；不填时为 `listed`。

slug 和 route 只能使用小写字母、数字和单连字符。

## 维护建议

- deck 标题和简介写在 `slides.md` frontmatter 的 `title` 和 `info` 中。
- deck 排序、路由和发布状态写在同目录的 `deck.json` 中。
- 提交前至少运行 `pnpm run fmt:check` 和 `pnpm run build`。
