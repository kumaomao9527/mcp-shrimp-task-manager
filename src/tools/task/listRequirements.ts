import { z } from "zod";
import { getAllRequirements } from "../../models/taskModel.js";

// 列出需求工具
export const listRequirementsSchema = z.object({
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
});

// 列出所有需求目录
export async function listRequirements({ dataDir }: z.infer<typeof listRequirementsSchema>) {
  try {
    const requirements = await getAllRequirements(dataDir);
    
    if (requirements.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "## 需求列表\n\n当前没有任何需求目录。\n\n要创建新的需求，请在使用任务相关工具时指定 `requirementName` 参数。",
          },
        ],
      };
    }

    let result = "## 需求列表\n\n";
    result += `找到 ${requirements.length} 个需求目录：\n\n`;
    
    requirements.forEach((requirement, index) => {
      result += `${index + 1}. **${requirement}**\n`;
    });
    
    result += "\n要查看特定需求的任务，请在使用任务相关工具时指定 `requirementName` 参数。";

    return {
      content: [
        {
          type: "text" as const,
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `获取需求列表时发生错误: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
