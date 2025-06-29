# 变更日志 (CHANGE.MD)

## 项目概述
MCP Shrimp Task Manager - 基于MCP协议的任务管理工具

## 主要变更记录

### 🔧 工具参数优化
- **自动项目路径检测**: 所有需要dataDir参数的工具现在使用`cmd cd`命令自动获取项目路径
- **提示词改进**: 添加"The dataDir parameter required by tools uses cmd to execute cd to obtain the project path"提示，确保AI调用时自动带上项目地址
- **参数一致性**: 统一了所有工具的dataDir参数设计，确保工具调用的一致性

### 📁 数据存储结构重构
- **项目隔离**: 在项目根目录创建`.shrimp_task`目录，实现项目级别的数据隔离
- **需求分层管理**: 支持按需求创建子目录结构，每个需求拥有独立的任务空间
- **目录结构**:
  ```
  .shrimp_task/
  ├── requirement.json          # 需求列表和统计信息
  ├── 需求A/
  │   └── tasks.json           # 需求A的任务列表
  ├── 需求B/
  │   └── tasks.json           # 需求B的任务列表
  └── memory/                  # 记忆文件目录
      └── *.md
  ```

**目录结构示意图**:
![目录结构](1751212765652.png)
*图: 项目目录结构 - 按需求分层管理的文件组织方式*

### 🎯 任务管理功能增强
- **层次化任务结构**: 支持父任务和子任务的层次关系，形成清晰的任务归属
- **需求级别组织**: 任务按需求分组管理，每个需求可包含多个相关任务
- **requirementName必传**: 所有任务必须在指定需求目录下创建，确保数据组织的规范性
- **任务状态跟踪**: 支持任务状态的完整生命周期管理

### 🌐 WebGUI界面改进
- **需求概览页面**: WebGUI.md首先展示所有需求的概览信息
- **分层导航**: 点击具体需求后进入对应的任务列表(Shrimp Task Manager)
- **项目级管理**: 针对每个项目单独管理，可查看该项目下所有需求及相关任务
- **数据展示**: 在WebGUI.md中展示需求列表、任务数、完成数等统计信息
- **交互优化**: 支持需求选择和任务列表的动态加载

**WebGUI界面展示**:
![WebGUI界面](1751212625570.jpg)
*图: WebGUI管理界面 - 项目级需求和任务管理视图*

### 🔍 功能特性
- **多语言支持**: 优先支持简体中文(zh-CN)本地化
- **路径处理统一**: 所有工具统一使用`.shrimp_task`子目录进行数据存储
- **并发安全**: 支持MCP并发调用时的路径隔离，防止路径冲突
- **自动目录创建**: 当dataDir参数提供时，系统自动创建`.shrimp_task`子目录

### 📋 工具集成
- **任务创建**: 支持创建需求和子任务
- **任务分解**: 支持将复杂任务分解为子任务
- **状态管理**: 支持任务状态的更新和跟踪
- **数据查询**: 支持按需求查询任务列表
- **WebGUI生成**: 自动生成项目级别的Web管理界面

### 🛠 技术改进
- **参数验证**: 增强了工具参数的验证机制
- **错误处理**: 改进了错误处理和用户反馈
- **性能优化**: 优化了数据读写和界面渲染性能
- **代码结构**: 重构了代码结构，提高了可维护性

### 📚 文档更新
- **README.md**: 保持原有功能文档的完整性
- **使用指南**: 更新了工具使用指南和最佳实践
- **API文档**: 完善了工具API的参数说明

## 界面展示

### 📁 目录结构
![目录结构示意图](1751212765652.png)
*项目目录结构 - 展示了按需求分层管理的文件组织方式，包括requirement.json、各需求子目录和memory目录*

### 🌐 WebGUI管理界面
![WebGUI管理界面](1751212625570.jpg)
*WebGUI管理界面 - 展示了项目级需求概览和任务管理功能，支持需求选择和任务列表查看*

## 兼容性说明
- 保持向后兼容，现有项目可平滑迁移到新的目录结构
- 支持从旧版本数据格式自动升级到新格式
- WebGUI界面保持用户习惯的操作方式

## 未来规划
- 继续优化用户体验和界面交互
- 增强任务管理的高级功能
- 支持更多的项目管理场景
- 提升系统的稳定性和性能

---

[English](README.md) | [中文](docs/zh/README.md)

## 目錄

- [✨ Features](#features1)
- [🧭 Usage Guide](#usage-guide)
- [🔬 Research Mode](#research-mode)
- [🧠 Task Memory Function](#task-memory-function)
- [📋 Project Rules Initialization](#project-rules)
- [🌐 Web GUI](#web-gui)
- [📚 Documentation Resources](#documentation)
- [🔧 Installation and Usage](#installation)
- [🔌 Using with MCP-Compatible Clients](#clients)
- [💡 System Prompt Guidance](#prompt)
- [🛠️ Available Tools Overview](#tools)
- [📄 License](#license)
- [🤖 Recommended Models](#recommended)

# MCP Shrimp Task Manager

[![Shrimp Task Manager Demo](/docs/yt.png)](https://www.youtube.com/watch?v=Arzu0lV09so)

[![smithery badge](https://smithery.ai/badge/@cjo4m06/mcp-shrimp-task-manager)](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager)

> 🚀 An intelligent task management system based on Model Context Protocol (MCP), providing an efficient programming workflow framework for AI Agents.

<a href="https://glama.ai/mcp/servers/@cjo4m06/mcp-shrimp-task-manager">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@cjo4m06/mcp-shrimp-task-manager/badge" alt="Shrimp Task Manager MCP server" />
</a>

Shrimp Task Manager guides Agents through structured workflows for systematic programming, enhancing task memory management mechanisms, and effectively avoiding redundant and repetitive coding work.

## ✨ <a id="features1"></a>Features

- **Task Planning and Analysis**: Deep understanding and analysis of complex task requirements
- **Intelligent Task Decomposition**: Automatically break down large tasks into manageable smaller tasks
- **Dependency Management**: Precisely handle dependencies between tasks, ensuring correct execution order
- **Execution Status Tracking**: Real-time monitoring of task execution progress and status
- **Task Completeness Verification**: Ensure task results meet expected requirements
- **Task Complexity Assessment**: Automatically evaluate task complexity and provide optimal handling suggestions
- **Automatic Task Summary Updates**: Automatically generate summaries upon task completion, optimizing memory performance
- **Task Memory Function**: Automatically backup task history, providing long-term memory and reference capabilities
- **Research Mode**: Systematic technical research capabilities with guided workflows for exploring technologies, best practices, and solution comparisons
- **Project Rules Initialization**: Define project standards and rules to maintain consistency across large projects
- **<a id="web-gui"></a>Web GUI**: Provides an optional web-based graphical user interface for task management. Enable by setting `ENABLE_GUI=true` in your `.env` file. When enabled, a `WebGUI.md` file containing the access address will be created in your `DATA_DIR`.
- **Multi-Instance Support**: Supports concurrent execution of multiple MCP instances with isolated data directories and file locking mechanisms to prevent data conflicts.

## 🧭 <a id="usage-guide"></a>Usage Guide

Shrimp Task Manager offers a structured approach to AI-assisted programming through guided workflows and systematic task management.

### What is Shrimp?

Shrimp is essentially a prompt template that guides AI Agents to better understand and work with your project. It uses a series of prompts to ensure the Agent aligns closely with your project's specific needs and conventions.

### Research Mode in Practice

Before diving into task planning, you can leverage the research mode for technical investigation and knowledge gathering. This is particularly useful when:

- You need to explore new technologies or frameworks
- You want to compare different solution approaches
- You're investigating best practices for your project
- You need to understand complex technical concepts

Simply tell the Agent "research [your topic]" or "enter research mode for [technology/problem]" to begin systematic investigation. The research findings will then inform your subsequent task planning and development decisions.

### First-Time Setup

When working with a new project, simply tell the Agent "init project rules". This will guide the Agent to generate a set of rules tailored to your project's specific requirements and structure.

### Task Planning Process

To develop or update features, use the command "plan task [your description]". The system will reference the previously established rules, attempt to understand your project, search for relevant code sections, and propose a comprehensive plan based on the current state of your project.

### Feedback Mechanism

During the planning process, Shrimp guides the Agent through multiple steps of thinking. You can review this process and provide feedback if you feel it's heading in the wrong direction. Simply interrupt and share your perspective - the Agent will incorporate your feedback and continue the planning process.

### Task Execution

When you're satisfied with the plan, use "execute task [task name or ID]" to implement it. If you don't specify a task name or ID, the system will automatically identify and execute the highest priority task.

### Continuous Mode

If you prefer to execute all tasks in sequence without manual intervention for each task, use "continuous mode" to automatically process the entire task queue.

### Token Limitation Note

Due to LLM token limits, context may be lost during lengthy conversations. If this occurs, simply open a new chat session and ask the Agent to continue execution. The system will pick up where it left off without requiring you to repeat the task details or context.

### Prompt Language and Customization

You can switch the language of system prompts by setting the `TEMPLATES_USE` environment variable. It supports `en` (English) and `zh` (Traditional Chinese) by default. Furthermore, you can copy an existing template directory (e.g., `src/prompts/templates_en`) to the location specified by `DATA_DIR`, modify it, and then point `TEMPLATES_USE` to your custom template directory name. This allows for deeper prompt customization. For detailed instructions.

## 🔬 <a id="research-mode"></a>Research Mode

Shrimp Task Manager includes a specialized research mode designed for systematic technical investigation and knowledge gathering.

### What is Research Mode?

Research Mode is a guided workflow system that helps AI Agents conduct thorough and systematic technical research. It provides structured approaches to exploring technologies, comparing solutions, investigating best practices, and gathering comprehensive information for programming tasks.

### Key Features

- **Systematic Investigation**: Structured workflows ensure comprehensive coverage of research topics
- **Multi-Source Research**: Combines web search and codebase analysis for complete understanding
- **State Management**: Maintains research context and progress across multiple sessions
- **Guided Exploration**: Prevents research from becoming unfocused or going off-topic
- **Knowledge Integration**: Seamlessly integrates research findings with task planning and execution

### When to Use Research Mode

Research Mode is particularly valuable for:

- **Technology Exploration**: Investigating new frameworks, libraries, or tools
- **Best Practices Research**: Finding industry standards and recommended approaches
- **Solution Comparison**: Evaluating different technical approaches or architectures
- **Problem Investigation**: Deep-diving into complex technical challenges
- **Architecture Planning**: Researching design patterns and system architectures

### How to Use Research Mode

Simply tell the Agent to enter research mode with your topic:

- **Basic usage**: "Enter research mode for [your topic]"
- **Specific research**: "Research [specific technology/problem]"
- **Comparative analysis**: "Research and compare [options A vs B]"

The system will guide the Agent through structured research phases, ensuring thorough investigation while maintaining focus on your specific needs.

### Research Workflow

1. **Topic Definition**: Clearly define the research scope and objectives
2. **Information Gathering**: Systematic collection of relevant information
3. **Analysis and Synthesis**: Processing and organizing findings
4. **State Updates**: Regular progress tracking and context preservation
5. **Integration**: Applying research results to your project context

> **💡 Recommendation**: For the best research mode experience, we recommend using **Claude 4 Sonnet**, which provides exceptional analytical capabilities and comprehensive research synthesis.

## 🧠 <a id="task-memory-function"></a>Task Memory Function

Shrimp Task Manager has long-term memory capabilities, automatically saving task execution history and providing reference experiences when planning new tasks.

### Key Features

- The system automatically backs up tasks to the memory directory
- Backup files are named in chronological order, in the format tasks_backup_YYYY-MM-DDThh-mm-ss.json
- Task planning Agents automatically receive guidance on how to use the memory function

### Advantages and Benefits

- **Avoid Duplicate Work**: Reference past tasks, no need to solve similar problems from scratch
- **Learn from Successful Experiences**: Utilize proven effective solutions, improve development efficiency
- **Learning and Improvement**: Identify past mistakes or inefficient solutions, continuously optimize workflows
- **Knowledge Accumulation**: Form a continuously expanding knowledge base as system usage increases

Through effective use of the task memory function, the system can continuously accumulate experience, with intelligence level and work efficiency continuously improving.

## 📋 <a id="project-rules"></a>Project Rules Initialization

The Project Rules feature helps maintain consistency across your codebase:

- **Standardize Development**: Establish consistent coding patterns and practices
- **Onboard New Developers**: Provide clear guidelines for project contributions
- **Maintain Quality**: Ensure all code meets established project standards

> **⚠️ Recommendation**: Initialize project rules when your project grows larger or undergoes significant changes. This helps maintain consistency and quality as complexity increases.

Use the `init_project_rules` tool to set up or update project standards when:

- Starting a new large-scale project
- Onboarding new team members
- Implementing major architectural changes
- Adopting new development conventions

### Usage Examples

You can easily access this feature with simple natural language commands:

- **For initial setup**: Simply tell the Agent "init rules" or "init project rules"
- **For updates**: When your project evolves, tell the Agent "Update rules" or "Update project rules"

This tool is particularly valuable when your codebase expands or undergoes significant structural changes, helping maintain consistent development practices throughout the project lifecycle.

## 📚 <a id="documentation"></a>Documentation Resources

- [Prompt Customization Guide](docs/en/prompt-customization.md): Instructions for customizing tool prompts via environment variables
- [Changelog](CHANGELOG.md): Record of all notable changes to this project

## 🔧 <a id="installation"></a>Installation and Usage

### Installing via Smithery

To install Shrimp Task Manager for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager):

```bash
npx -y @smithery/cli install @cjo4m06/mcp-shrimp-task-manager --client claude
```

### Manual Installation

```bash
# Install dependencies
npm install

# Build and start service
npm run build
```

## 🔌 <a id="clients"></a>Using with MCP-Compatible Clients

Shrimp Task Manager can be used with any client that supports the Model Context Protocol, such as Cursor IDE.

### Configuration in Cursor IDE

Shrimp Task Manager offers two configuration methods: global configuration and project-specific configuration.

#### Global Configuration

1. Open the Cursor IDE global configuration file (usually located at `~/.cursor/mcp.json`)
2. Add the following configuration in the `mcpServers` section:

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "false"
      }
    }
  }
}


or

{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "npx",
      "args": ["-y", "mcp-shrimp-task-manager"],
      "env": {
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "false"
      }
    }
  }
}
```

> ⚠️ Please replace `/mcp-shrimp-task-manager` with your actual path.

#### Project-Specific Configuration

You can also set up dedicated configurations for each project to use independent data directories for different projects:

1. Create a `.cursor` directory in the project root
2. Create an `mcp.json` file in this directory with the following content:

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "false"
      }
    }
  }
}


or

{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "npx",
      "args": ["-y", "mcp-shrimp-task-manager"],
      "env": {
        "DATA_DIR": "/path/to/project/data", // Must use absolute path
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "false"
      }
    }
  }
}
```

### ⚠️ Important Configuration Notes

**重要变更**: `DATA_DIR` 环境变量已被移除。现在所有工具都必须通过 `dataDir` 参数明确指定数据目录，这确保了更好的项目隔离和数据安全性。

> **注意**:
>
> - 所有工具调用时都必须提供 `dataDir` 参数
> - 数据将存储在 `dataDir/.shrimp_task/` 目录中
> - 不同项目使用完全独立的数据目录
> - 提高了系统的可预测性和安全性

### 🔧 Environment Variable Configuration

Shrimp Task Manager supports customizing prompt behavior through environment variables, allowing you to fine-tune AI assistant responses without modifying code. You can set these variables in the configuration or through an `.env` file:

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "MCP_PROMPT_PLAN_TASK": "Custom planning guidance...",
        "MCP_PROMPT_EXECUTE_TASK_APPEND": "Additional execution instructions...",
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "false"
      }
    }
  }
}
```

There are two customization methods:

- **Override Mode** (`MCP_PROMPT_[FUNCTION_NAME]`): Completely replace the default prompt
- **Append Mode** (`MCP_PROMPT_[FUNCTION_NAME]_APPEND`): Add content to the existing prompt

Additionally, there are other system configuration variables:

- **TEMPLATES_USE**: Specifies the template set to use for prompts. Defaults to `en`. Currently available options are `en` and `zh`. 如需自定义模板，请直接修改内置模板文件。

For detailed instructions on customizing prompts, including supported parameters and examples, see the [Prompt Customization Guide](docs/en/prompt-customization.md).

## 💡 <a id="prompt"></a>System Prompt Guidance

### Cursor IDE Configuration

You can enable Cursor Settings => Features => Custom modes, and configure the following two modes:

#### TaskPlanner Mode

```
You are a professional task planning expert. You must interact with users, analyze their needs, and collect project-related information. Finally, you must use "plan_task" to create tasks. When the task is created, you must summarize it and inform the user to use the "TaskExecutor" mode to execute the task.
You must focus on task planning. Do not use "execute_task" to execute tasks.
Serious warning: you are a task planning expert, you cannot modify the program code directly, you can only plan tasks, and you cannot modify the program code directly, you can only plan tasks.
```

#### TaskExecutor Mode

```
You are a professional task execution expert. When a user specifies a task to execute, use "execute_task" to execute the task.
If no task is specified, use "list_tasks" to find unexecuted tasks and execute them.
When the execution is completed, a summary must be given to inform the user of the conclusion.
You can only perform one task at a time, and when a task is completed, you are prohibited from performing the next task unless the user explicitly tells you to.
If the user requests "continuous mode", all tasks will be executed in sequence.
```

> 💡 Choose the appropriate mode based on your needs:
>
> - Use **TaskPlanner** mode when planning tasks
> - Use **TaskExecutor** mode when executing tasks

### Using with Other Tools

If your tool doesn't support Custom modes, you can:

- Manually paste the appropriate prompts at different stages
- Or directly use simple commands like `Please plan the following task: ......` or `Please start executing the task...`

## 🛠️ <a id="tools"></a>Available Tools Overview

After configuration, you can use the following tools:

### Multi-Instance Support

All data-access tools now require a mandatory `dataDir` parameter for multi-instance deployment:

- **Purpose**: Allows multiple MCP instances to run concurrently with isolated data directories
- **Usage**: Must provide `"dataDir": "/path/to/your/data"` in all tool calls
- **Requirement**: `dataDir` parameter is now mandatory for all tools
- **Concurrency**: File locking mechanisms prevent data conflicts during concurrent access

For detailed information, see [Tool Parameter Design Guide](docs/zh/tool-parameter-design.md).

| Category                     | Tool Name            | Description                                      |
| ---------------------------- | -------------------- | ------------------------------------------------ |
| **Task Planning**            | `plan_task`          | Start planning tasks                             |
| **Task Analysis**            | `analyze_task`       | In-depth analysis of task requirements           |
|                              | `process_thought`    | Step-by-step reasoning for complex problems      |
| **Solution Assessment**      | `reflect_task`       | Reflect and improve solution concepts            |
| **Research & Investigation** | `research_mode`      | Enter systematic technical research mode         |
| **Project Management**       | `init_project_rules` | Initialize or update project standards and rules |
| **Task Management**          | `split_tasks`        | Break tasks into subtasks                        |
|                              | `list_tasks`         | Display all tasks and status                     |
|                              | `query_task`         | Search and list tasks                            |
|                              | `get_task_detail`    | Display complete task details                    |
|                              | `delete_task`        | Delete incomplete tasks                          |
| **Task Execution**           | `execute_task`       | Execute specific tasks                           |
|                              | `verify_task`        | Verify task completion                           |

## 🔧 Technical Implementation

- **Node.js**: High-performance JavaScript runtime environment
- **TypeScript**: Provides type-safe development environment
- **MCP SDK**: Interface for seamless interaction with large language models
- **UUID**: Generate unique and reliable task identifiers

## 📄 <a id="license"></a>License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## <a id="recommended"></a>Recommended Models

For the best experience, we recommend using the following models:

- **Claude 3.7**: Offers strong understanding and generation capabilities.
- **Gemini 2.5**: Google's latest model, performs excellently.

Due to differences in training methods and understanding capabilities across models, using other models might lead to varying results for the same prompts. This project has been optimized for Claude 3.7 and Gemini 2.5.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cjo4m06/mcp-shrimp-task-manager&type=Timeline)](https://www.star-history.com/#cjo4m06/mcp-shrimp-task-manager&Timeline)
