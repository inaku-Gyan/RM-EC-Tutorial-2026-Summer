# Lec 1 Foundation

RoboMaster Summer Camp 2026 第一讲课件：嵌入式 C 开发基础。

本仓库使用 [Slidev](https://sli.dev/) 维护课程幻灯片，内容覆盖 Git 基础、桌面端 C 工程构建、嵌入式工具链、EIDE、外设寄存器、CubeMX 生成项目，以及 C 语言中的 OOP 写法。

## 课程内容

- Git 本地历史、分支、远程仓库和 GitHub 工作流
- 桌面端 C 工程的预处理、编译、汇编、链接流程
- 头文件搜索、链接错误、静态库和构建产物
- 从桌面端 C 程序迁移到裸机 ARM 固件
- startup code、linker script、ELF、BIN、HEX 的基本关系
- EIDE 项目配置和手写编译命令的对应关系
- STM32CubeMX 生成工程、HAL/CMSIS 目录结构和 `USER CODE` 区域
- 嵌入式 C 中的 `struct + ops + base` 风格封装

## 仓库结构

```text
.
├── slides.md                  # Slidev 主课件
├── content.md                 # 课程内容设计和讲课备注
├── memo.md                    # 上课准备备忘
├── package.json               # Slidev 脚本和依赖
├── pnpm-lock.yaml             # 依赖锁定文件
└── .github/workflows/
    └── deploy-pages.yml       # GitHub Pages 自动部署
```

## 环境要求

- Node.js 22
- pnpm 11.6.0

如果本机已启用 Corepack，可以直接使用仓库声明的 pnpm 版本：

```bash
corepack enable
pnpm install
```

## 本地开发

安装依赖后启动 Slidev：

```bash
pnpm run dev
```

默认会打开本地预览页面。也可以手动访问：

```text
http://localhost:3030
```

需要在局域网内分享预览时使用：

```bash
pnpm run serve
```

## 构建

生成静态站点：

```bash
pnpm run build
```

构建产物位于 `dist/`。

GitHub Pages 部署使用专门的脚本，它会根据仓库名设置正确的 base path：

```bash
pnpm run build:pages
```

## 导出 PDF

```bash
pnpm run export
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

## 维护建议

- 课件主体改 `slides.md`
- 课程设计和讲解顺序先记录到 `content.md`
- 临时上课准备事项放到 `memo.md`
- 提交前至少运行一次 `pnpm run build`
