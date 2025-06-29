import { z } from "zod";
import { getInitProjectRulesPrompt } from "../../prompts/index.js";
import { ensureShrimpTaskDir } from "../../utils/pathUtils.js";

// 定義schema
export const initProjectRulesSchema = z.object({
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
});

/**
 * 初始化项目规范工具函数
 * 提供建立规范文件的指导
 */
export async function initProjectRules({ dataDir }: z.infer<typeof initProjectRulesSchema>) {
  try {
    // 确保 .shrimp_task 目录存在
    const shrimpTaskDir = await ensureShrimpTaskDir(dataDir);

    // 从生成器获取提示词
    const promptContent = getInitProjectRulesPrompt();

    // 返回成功响应，包含目录创建信息
    return {
      content: [
        {
          type: "text" as const,
          text: `${promptContent}\n\n📁 数据目录已准备就绪：\n- 数据存储路径：${shrimpTaskDir}\n- 目录状态：已确保存在并可用`,
        },
      ],
    };
  } catch (error) {
    // 错误处理
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return {
      content: [
        {
          type: "text" as const,
          text: `初始化项目规范时发生错误: ${errorMessage}`,
        },
      ],
    };
  }
}
