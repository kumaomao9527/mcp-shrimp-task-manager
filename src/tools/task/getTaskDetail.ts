import { z } from "zod";
import { searchTasksWithCommand } from "../../models/taskModel.js";
import { getGetTaskDetailPrompt } from "../../prompts/index.js";

// 取得完整任務詳情的參數
export const getTaskDetailSchema = z.object({
  taskId: z
    .string()
    .min(1, {
      message: "任務ID不能為空，請提供有效的任務ID",
    })
    .describe("欲檢視詳情的任務ID"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要查看的需求目录，必须提供"),
});

// 取得任务完整详情
export async function getTaskDetail({ taskId, dataDir, requirementName }: z.infer<typeof getTaskDetailSchema>) {
  try {
    // 使用 searchTasksWithCommand 替代 getTaskById，实现记忆区任务搜索
    // 设置 isId 为 true，表示按 ID 搜索；页码为 1，每页大小为 1
    const result = await searchTasksWithCommand(taskId, true, 1, 1, dataDir, requirementName);

    // 检查是否找到任务
    if (result.tasks.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `## 错误\n\n找不到ID为 \`${taskId}\` 的任务。请确认任务ID是否正确。`,
          },
        ],
        isError: true,
      };
    }

    // 获取找到的任务（第一个也是唯一的一个）
    const task = result.tasks[0];

    // 使用prompt生成器获取最终prompt
    const prompt = getGetTaskDetailPrompt({
      taskId,
      task,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
    };
  } catch (error) {
    // 使用prompt生成器獲取錯誤訊息
    const errorPrompt = getGetTaskDetailPrompt({
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: errorPrompt,
        },
      ],
    };
  }
}
