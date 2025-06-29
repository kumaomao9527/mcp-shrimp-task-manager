import fs from "fs/promises";
import path from "path";

/**
 * 获取数据目录路径
 * @param dataDir 数据目录路径，必须提供
 * @returns 数据目录的绝对路径
 */
export function getDataDir(dataDir: string): string {
  return path.isAbsolute(dataDir) ? dataDir : path.resolve(dataDir);
}

/**
 * 获取 .shrimp_task 目录路径
 * @param dataDir 数据目录路径，必须提供
 * @returns .shrimp_task 目录的绝对路径
 */
export function getShrimpTaskDir(dataDir: string): string {
  const resolvedDataDir = getDataDir(dataDir);

  // 检查路径是否已经以 .shrimp_task 结尾，避免重复创建
  if (path.basename(resolvedDataDir) === ".shrimp_task") {
    return resolvedDataDir;
  }

  return path.join(resolvedDataDir, ".shrimp_task");
}

/**
 * 确保 .shrimp_task 目录存在
 * @param dataDir 数据目录路径，必须提供
 * @returns .shrimp_task 目录的绝对路径
 */
export async function ensureShrimpTaskDir(dataDir: string): Promise<string> {
  const shrimpTaskDir = getShrimpTaskDir(dataDir);

  try {
    await fs.access(shrimpTaskDir);
  } catch (error) {
    // 目录不存在，创建它
    await fs.mkdir(shrimpTaskDir, { recursive: true });
  }

  return shrimpTaskDir;
}

/**
 * 获取任务文件路径
 * @param dataDir 数据目录路径，必须提供
 * @param requirementName 需求名称，如果提供则返回需求目录下的 tasks.json 路径
 * @returns 任务文件的绝对路径
 */
export function getTasksFilePath(dataDir: string, requirementName?: string): string {
  const shrimpTaskDir = getShrimpTaskDir(dataDir);
  if (requirementName) {
    return path.join(shrimpTaskDir, requirementName, "tasks.json");
  }
  return path.join(shrimpTaskDir, "tasks.json");
}

/**
 * 获取需求目录路径
 * @param dataDir 数据目录路径，必须提供
 * @param requirementName 需求名称
 * @returns 需求目录的绝对路径
 */
export function getRequirementDir(dataDir: string, requirementName: string): string {
  const shrimpTaskDir = getShrimpTaskDir(dataDir);
  return path.join(shrimpTaskDir, requirementName);
}

/**
 * 确保需求目录存在
 * @param dataDir 数据目录路径，必须提供
 * @param requirementName 需求名称
 * @returns 需求目录的绝对路径
 */
export async function ensureRequirementDir(dataDir: string, requirementName: string): Promise<string> {
  const requirementDir = getRequirementDir(dataDir, requirementName);

  try {
    await fs.access(requirementDir);
  } catch (error) {
    // 目录不存在，创建它
    await fs.mkdir(requirementDir, { recursive: true });
  }

  return requirementDir;
}

/**
 * 获取所有需求目录列表
 * @param dataDir 数据目录路径，必须提供
 * @returns 需求名称列表
 */
export async function getRequirementsList(dataDir: string): Promise<string[]> {
  const shrimpTaskDir = getShrimpTaskDir(dataDir);

  try {
    await fs.access(shrimpTaskDir);
    const items = await fs.readdir(shrimpTaskDir, { withFileTypes: true });

    // 系统保留目录和文件名列表
    const systemReserved = new Set([
      "memory", // 记忆目录
      "backup", // 备份目录
      "temp", // 临时目录
      "cache", // 缓存目录
      "logs", // 日志目录
      ".git", // Git目录
      ".svn", // SVN目录
      "node_modules", // Node.js模块目录
      ".DS_Store", // macOS系统文件
      "Thumbs.db", // Windows缩略图文件
    ]);

    // 过滤出目录，排除系统保留目录和所有文件
    const requirements = items
      .filter((item) => {
        // 必须是目录
        if (!item.isDirectory()) {
          return false;
        }

        // 排除系统保留目录
        if (systemReserved.has(item.name.toLowerCase())) {
          return false;
        }

        // 排除以点开头的隐藏目录
        if (item.name.startsWith(".")) {
          return false;
        }

        return true;
      })
      .map((item) => item.name)
      .sort();

    return requirements;
  } catch (error) {
    return [];
  }
}

/**
 * 获取记忆目录路径
 * @param dataDir 数据目录路径，必须提供
 * @returns 记忆目录的绝对路径
 */
export function getMemoryDir(dataDir: string): string {
  const shrimpTaskDir = getShrimpTaskDir(dataDir);
  return path.join(shrimpTaskDir, "memory");
}

/**
 * 确保记忆目录存在
 * @param dataDir 数据目录路径，必须提供
 * @returns 记忆目录的绝对路径
 */
export async function ensureMemoryDir(dataDir: string): Promise<string> {
  const memoryDir = getMemoryDir(dataDir);

  try {
    await fs.access(memoryDir);
  } catch (error) {
    // 目录不存在，创建它
    await fs.mkdir(memoryDir, { recursive: true });
  }

  return memoryDir;
}

/**
 * 获取需求信息文件路径
 * @param dataDir 数据目录路径，必须提供
 * @returns requirement.json文件的绝对路径
 */
export function getRequirementInfoFilePath(dataDir: string): string {
  const shrimpTaskDir = getShrimpTaskDir(dataDir);
  return path.join(shrimpTaskDir, "requirement.json");
}

/**
 * 创建 WebGUI.md 文件（如果启用了 GUI 功能）
 * @param dataDir 数据目录路径，必须提供
 */
export async function createWebGUIFileIfEnabled(dataDir: string): Promise<void> {
  // 检查是否启用了 GUI 功能
  const ENABLE_GUI = process.env.ENABLE_GUI === "true";
  if (!ENABLE_GUI) return;

  try {
    // 确保 .shrimp_task 目录存在
    const shrimpTaskDir = await ensureShrimpTaskDir(dataDir);

    // 读取 TEMPLATES_USE 环境变量并转换为语言代码
    const templatesUse = process.env.TEMPLATES_USE || "en";
    const getLanguageFromTemplate = (template: string): string => {
      if (template === "zh") return "zh-CN";
      if (template === "en") return "en";
      // 自定义模板默认使用英文
      return "en";
    };
    const language = getLanguageFromTemplate(templatesUse);

    // 生成 WebGUI.md 文件内容
    // 注意：这里我们无法获取到实际的端口号，所以使用占位符
    const dataDirParam = dataDir ? `&dataDir=${encodeURIComponent(dataDir)}` : "";
    const websiteUrl = `[Task Manager UI](http://localhost:PORT_PLACEHOLDER?lang=${language}${dataDirParam})`;

    // 添加需求概览信息
    let content = `# 任务管理系统\n\n`;
    content += `${websiteUrl}\n\n`;
    content += `## 功能特性\n\n`;
    content += `- 📋 **需求管理**: 支持多需求分层管理，每个需求独立存储任务数据\n`;
    content += `- 📊 **统计概览**: 实时显示需求统计信息，包括任务数、完成率等\n`;
    content += `- 🔗 **依赖关系**: 可视化任务依赖关系图\n`;
    content += `- 🌐 **多语言**: 支持中文和英文界面\n`;
    content += `- 📱 **响应式**: 支持移动设备访问\n\n`;
    content += `## 使用说明\n\n`;
    content += `1. 所有任务必须在指定需求目录下创建\n`;
    content += `2. 系统会自动统计各需求的任务完成情况\n`;
    content += `3. 需求信息存储在 \`requirement.json\` 文件中\n`;
    content += `4. 任务数据存储在各需求目录的 \`tasks.json\` 文件中\n\n`;
    content += `## 数据结构\n\n`;
    content += `\`\`\`\n`;
    content += `.shrimp_task/\n`;
    content += `├── requirement.json          # 需求统计信息\n`;
    content += `├── 需求A/\n`;
    content += `│   └── tasks.json           # 需求A的任务数据\n`;
    content += `├── 需求B/\n`;
    content += `│   └── tasks.json           # 需求B的任务数据\n`;
    content += `└── WebGUI.md                # 本文件\n`;
    content += `\`\`\`\n`;

    const websiteFilePath = path.join(shrimpTaskDir, "WebGUI.md");

    // 检查文件是否已存在，如果存在则不覆盖（避免覆盖已有的正确端口信息）
    try {
      await fs.access(websiteFilePath);
      // 文件已存在，不覆盖
      return;
    } catch (error) {
      // 文件不存在，创建新文件
      await fs.writeFile(websiteFilePath, content, "utf-8");
    }
  } catch (error) {
    // 静默处理错误，不影响主要功能
  }
}

/**
 * 检查需求名称是否与系统保留名称冲突
 * @param requirementName 需求名称
 * @returns 如果冲突返回true，否则返回false
 */
export function isSystemReservedName(requirementName: string): boolean {
  const systemReserved = new Set([
    "memory", // 记忆目录
    "backup", // 备份目录
    "temp", // 临时目录
    "cache", // 缓存目录
    "logs", // 日志目录
    ".git", // Git目录
    ".svn", // SVN目录
    "node_modules", // Node.js模块目录
    ".DS_Store", // macOS系统文件
    "Thumbs.db", // Windows缩略图文件
  ]);

  return systemReserved.has(requirementName.toLowerCase()) || requirementName.startsWith(".");
}

/**
 * 验证并建议需求名称
 * @param requirementName 需求名称
 * @returns 验证结果和建议
 */
export function validateRequirementName(requirementName: string): {
  isValid: boolean;
  message?: string;
  suggestion?: string;
} {
  // 检查是否为空
  if (!requirementName || requirementName.trim() === "") {
    return {
      isValid: false,
      message: "需求名称不能为空",
    };
  }

  // 检查是否与系统保留名称冲突
  if (isSystemReservedName(requirementName)) {
    return {
      isValid: false,
      message: `需求名称 "${requirementName}" 与系统保留名称冲突`,
      suggestion: `建议使用其他名称，如 "${requirementName}_requirement" 或 "${requirementName}_project"`,
    };
  }

  // 检查是否包含非法字符
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(requirementName)) {
    return {
      isValid: false,
      message: "需求名称包含非法字符",
      suggestion: "请使用字母、数字、下划线和连字符",
    };
  }

  return {
    isValid: true,
  };
}
