---
description: BAChat v0.1 product feature inventory and scope decisions for the lean core edition / BAChat v0.1 精简核心版产品功能清单与范围决策
---

# BAChat Feature List v0.1 / BAChat 功能清单 v0.1

This document defines the target product scope for the BAChat lean edition.
The goal is a desktop AI workspace centered on **work, chat, translation, and
knowledge bases**, with local-first data storage and optional cloud or local
models.

本文定义 BAChat 精简版的目标产品范围。目标是以**工作、对话、翻译和知识库**为核心，
采用本地优先的数据存储，并支持可选的云端或本地模型。

## Scope Labels / 范围标签

| Label / 标签 | Meaning / 含义 |
| --- | --- |
| Keep / 保留 | Part of the v0.1 product and supported long term. / 属于 v0.1 产品范围，长期支持。 |
| Supporting / 支撑 | Required by a kept capability but not a standalone product area. / 是保留能力所需的支撑，不是独立产品模块。 |
| Optional / 可选 | Retain only when its dependency and maintenance cost is justified. / 仅在依赖与维护成本合理时保留。 |
| Remove / 移除 | Exclude from the lean edition and remove code, UI, services, and dependencies in stages. / 从精简版排除，并分阶段删除代码、UI、服务和依赖。 |

## v0.1 Core / v0.1 核心功能

Mark one option in **Your choice / 你的选择** for every feature. /
请为每项功能在**你的选择 / Your choice**中勾选一个选项。

| Area / 模块 | Capabilities / 能力 | Network requirement / 联网要求 | Decision / 决策 | Your choice / 你的选择 |
| --- | --- | --- | --- | --- |
| Chat / 对话 | Assistants, conversations and topics, streaming replies, attachments, Markdown rendering, import/export, global search. / 助手、会话和话题、流式回复、附件、Markdown 渲染、导入导出、全局搜索。 | A cloud model needs internet; Ollama and LM Studio can run locally. / 云端模型需要联网；Ollama 和 LM Studio 可本地运行。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| Work / 工作 | Agents, workspaces, sessions, tasks, tool approval, file context. / 智能体、工作区、会话、任务、工具审批、文件上下文。 | Depends on the selected model and tools. / 取决于所选模型和工具。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| Translation / 翻译 | Text translation, language detection, translation history. / 文本翻译、语言检测、翻译历史。 | Uses the selected cloud or local model. / 使用选定的云端或本地模型。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| Knowledge base / 知识库 | Local file and directory ingestion, document extraction, chunking, vector indexing, retrieval-augmented chat, knowledge tools. / 本地文件和目录导入、文档提取、分块、向量索引、检索增强对话、知识库工具。 | Local indexing can be offline; remote embeddings, reranking, OCR, and URL import need network access. / 本地索引可离线；远程嵌入、重排序、OCR 和 URL 导入需要联网。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |

## Supporting Capabilities / 支撑能力

| Area / 模块 | Capabilities / 能力 | Decision / 决策 | Your choice / 你的选择 |
| --- | --- | --- | --- |
| Model configuration / 模型配置 | OpenAI-compatible endpoints, Ollama, LM Studio, API keys, models, proxy configuration. / OpenAI-compatible 端点、Ollama、LM Studio、API Key、模型、代理配置。 | Keep; reduce cloud provider families over time. / 保留；逐步收敛云端供应商类型。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Local data / 本地数据 | SQLite database, preferences, cache, file storage, migrations, local backup and restore. / SQLite 数据库、偏好设置、缓存、文件存储、迁移、本地备份与恢复。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| Desktop shell / 桌面壳层 | Windows, tabs, notifications, shortcuts, system tray, themes, language settings. / 窗口、标签页、通知、快捷键、系统托盘、主题、语言设置。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| File processing / 文件处理 | Local PDF, Word, Excel, PowerPoint, text, image extraction and preview. / 本地 PDF、Word、Excel、PowerPoint、文本和图片提取及预览。 | Keep only the paths needed for chat attachments and knowledge ingestion. / 仅保留对话附件和知识库导入所需的处理路径。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Local inference / 本地推理 | Local embedding models and their download/runtime support. / 本地嵌入模型及其下载与运行时支持。 | Keep for offline knowledge bases. / 为离线知识库保留。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Prompts / 提示词 | Prompt library, quick phrases, prompt variables. / 提示词库、快捷短语、提示词变量。 | Optional; low cost and useful for chat/work. / 可选；成本低，对对话和工作有帮助。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| MCP runtime / MCP 运行时 | Manual local stdio MCP configuration and tool approval. / 手工配置本地 stdio MCP 与工具审批。 | Optional; keep only if the work flow needs external tools. / 可选；仅在工作流需要外部工具时保留。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |

## Features to Remove / 建议移除的功能

| Area / 模块 | Included capabilities / 包含能力 | Why it is outside v0.1 / 不属于 v0.1 的原因 | Your choice / 你的选择 |
| --- | --- | --- | --- |
| Web search / 联网搜索 | Search-provider settings, web lookup tools, webpage fetching, citations and citation previews. / 搜索服务商设置、网页检索工具、网页抓取、引用与引用预览。 | Network-only feature not required by the four core areas. / 仅依赖网络，四项核心功能并不需要。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| MCP marketplace / MCP 市场 | Marketplace, remote catalog, npx search, remote install, OAuth setup. / 市场、远程目录、npx 搜索、远程安装、OAuth 配置。 | Adds network, package-install, and maintenance surface. / 增加联网、安装包和维护面。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Mini apps / 迷你应用 | Mini app catalog, installation, Webview runtime, permissions, network APIs, activity logs. / 迷你应用目录、安装、Webview 运行时、权限、网络 API、活动日志。 | Separate application platform with a large security and maintenance surface. / 属于独立应用平台，安全和维护成本高。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Image generation / 图片生成 | Drawing page, image generation forms, history, templates, image download. / 绘图页、图片生成表单、历史、模板、图片下载。 | Separate model API feature. / 独立的模型 API 功能。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| CodeMate / 代码助手 | Code execution page, Claude Code, DeepSeek Harness, OpenClaw, Hermes Dashboard, CLI configuration. / 代码执行页、Claude Code、DeepSeek Harness、OpenClaw、Hermes Dashboard、CLI 配置。 | Separate developer-tool product area. / 属于独立开发者工具产品领域。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| External channels / 外部渠道 | Telegram, Discord, Slack, Feishu, QQ, WeChat adapters. / Telegram、Discord、Slack、飞书、QQ、微信适配器。 | Network-only integrations unrelated to the core desktop workflow. / 仅联网的集成，与核心桌面工作流无关。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Cloud sync and third-party imports / 云同步与第三方导入 | WebDAV, S3, Nutstore, Notion, Joplin, Yuque, Siyuan. / WebDAV、S3、坚果云、Notion、Joplin、语雀、思源。 | Retain local backup, Markdown export, and JSON import/export instead. / 改为保留本地备份、Markdown 导出和 JSON 导入导出。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Update and telemetry services / 更新与遥测 | Automatic update, provider registry update, analytics, diagnostic upload, remote telemetry. / 自动更新、供应商注册表更新、分析、诊断上传、远程遥测。 | Keep local diagnostics/export only. / 仅保留本地诊断与导出。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| API gateway / API 网关 | Local OpenAI/Anthropic-compatible HTTP gateway and its external access. / 本地 OpenAI/Anthropic-compatible HTTP 网关及外部访问。 | Not needed unless BAChat is explicitly used as a server. / 除非明确将 BAChat 用作服务端，否则不需要。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| LAN transfer / 局域网传输 | mDNS discovery, local-network pairing, transfer protocol. / mDNS 发现、局域网配对、传输协议。 | Separate sync feature. / 独立的同步功能。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Notes / 笔记 | Rich-text notes, note tree, note settings. / 富文本笔记、笔记树、笔记设置。 | Knowledge bases continue to accept files without an independent note product. / 知识库无需独立笔记产品仍可接收文件。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| File workspace / 文件工作区 | Standalone files page and file preview tabs. / 独立文件页和文件预览标签页。 | Keep only attachment and knowledge-base file handling. / 仅保留附件和知识库的文件处理。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Usage and release pages / 用量和发布页面 | Usage dashboard and release notes page. / 用量仪表盘和发布说明页。 | Nonessential for the lean product. / 对精简产品不是必要功能。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |
| Advanced capture / 高级采集 | Screenshot tools, selection assistant, quick assistant. / 截图工具、划词助手、快速助手。 | Optional productivity feature; not required for v0.1. / 可选效率工具，不是 v0.1 必需项。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |

## Knowledge Base Boundary / 知识库边界

The knowledge base remains a core feature with these limits:

知识库作为核心功能，遵循以下边界：

1. Accept local files and directories first. / 优先接收本地文件和目录。
2. Use local embedding when an offline installation is required. / 需要离线安装时使用本地嵌入模型。
3. Keep local document readers needed by supported file types. / 保留支持文件类型所需的本地文档读取器。
4. Remove URL ingestion and remote document processors by default. / 默认移除 URL 导入和远程文档处理器。
5. Treat OCR and PDF translation as optional extensions, not core requirements. / 将 OCR 和 PDF 翻译作为可选扩展，而非核心要求。

## Model Boundary / 模型边界

The target provider set is:

目标供应商集合如下：

| Provider path / 供应商路径 | Purpose / 用途 | Decision / 决策 | Your choice / 你的选择 |
| --- | --- | --- | --- |
| OpenAI-compatible / OpenAI-compatible | Generic cloud endpoint and self-hosted gateways. / 通用云端端点和自托管网关。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| Ollama | Local chat and embedding models. / 本地对话和嵌入模型。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| LM Studio | Local chat models. / 本地对话模型。 | Keep / 保留 | - [ ] Keep / 保留<br>- [ ] Remove / 移除 |
| All provider-specific SDKs / 所有供应商专用 SDK | Vendor-specific cloud integrations. / 厂商专用云端集成。 | Remove unless a product requirement names the vendor. / 除非产品需求明确指定该厂商，否则移除。 | - [ ] Keep / 保留<br>- [ ] Optional / 可选<br>- [ ] Remove / 移除 |

## Removal Phases / 移除阶段

1. **Phase 1 — UI and entry points / UI 与入口**: Hide or remove routes,
   sidebar entries, settings pages, commands, and onboarding references. The
   initial core navigation reduction is already complete. / 隐藏或移除路由、
   侧边栏入口、设置页、命令和引导引用。初步核心导航收敛已完成。
2. **Phase 2 — isolated features / 独立功能**: Remove mini apps, image
   generation, web search, external channels, cloud sync/imports, telemetry,
   updater, LAN transfer, and nonessential pages. / 移除迷你应用、图片生成、
   联网搜索、外部渠道、云同步/导入、遥测、更新器、局域网传输和非必要页面。
3. **Phase 3 — developer and marketplace features / 开发者与市场功能**:
   Remove CodeMate, marketplace/catalog flows, remote MCP installation, and
   API gateway unless explicitly retained. / 移除 CodeMate、市场/目录流程、
   远程 MCP 安装和 API 网关，除非明确保留。
4. **Phase 4 — dependency reduction / 依赖收敛**: Remove unused provider
   SDKs, agent runtimes, document processors, frontend chunks, native modules,
   migrations, preference keys, and tests after each feature removal. /
   在每项功能移除后，删除未使用的供应商 SDK、Agent 运行时、文档处理器、前端
   分包、原生模块、迁移、偏好设置键和测试。

## Acceptance Criteria / 验收标准

A v0.1 build must:

v0.1 构建必须满足：

- launch into the core product without exposing removed features; / 启动后进入
  核心产品，不暴露已移除功能；
- create, continue, search, import, and export chat conversations; / 可创建、
  继续、搜索、导入和导出对话；
- run the retained work/agent flow; / 可运行保留的工作/Agent 流程；
- translate text and retain translation history; / 可翻译文本并保留翻译历史；
- create and query a local-file knowledge base; / 可创建和查询本地文件知识库；
- support a configured OpenAI-compatible, Ollama, or LM Studio model; / 支持
  已配置的 OpenAI-compatible、Ollama 或 LM Studio 模型；
- work without internet after required local models and dependencies are
  installed, except for explicitly selected cloud model calls. / 在所需本地
  模型和依赖已安装后，除明确选择的云端模型调用外，可在无网络环境工作。
