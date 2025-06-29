import { z } from "zod";
import { getAllTasks, clearAllTasks as modelClearAllTasks } from "../../models/taskModel.js";
import { getClearAllTasksPrompt } from "../../prompts/index.js";

// 清除所有任務工具
export const clearAllTasksSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, {
      message: "必須明確確認清除操作，請將 confirm 參數設置為 true 以確認此危險操作",
    })
    .describe("确认删除所有未完成的任务（此操作不可逆）"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要操作的需求目录，必须提供"),
});

export async function clearAllTasks({ confirm, dataDir, requirementName }: z.infer<typeof clearAllTasksSchema>) {
  // 安全检查：如果没有确认，则拒绝操作
  if (!confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text: getClearAllTasksPrompt({ confirm: false }),
        },
      ],
    };
  }

  // 检查是否真的有任务需要清除
  const allTasks = await getAllTasks(dataDir, requirementName);
  if (allTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: getClearAllTasksPrompt({ isEmpty: true }),
        },
      ],
    };
  }

  // 执行清除操作
  const result = await modelClearAllTasks(dataDir, requirementName);

  return {
    content: [
      {
        type: "text" as const,
        text: getClearAllTasksPrompt({
          success: result.success,
          message: result.message,
          backupFile: result.backupFile,
        }),
      },
    ],
    isError: !result.success,
  };
}
