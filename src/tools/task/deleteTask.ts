import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import { getTaskById, deleteTask as modelDeleteTask } from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getDeleteTaskPrompt } from "../../prompts/index.js";

// 刪除任務工具
export const deleteTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "任務ID格式無效，請提供有效的UUID v4格式",
    })
    .describe("待刪除任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要操作的需求目录，必须提供"),
});

export async function deleteTask({ taskId, dataDir, requirementName }: z.infer<typeof deleteTaskSchema>) {
  const task = await getTaskById(taskId, dataDir, requirementName);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: getDeleteTaskPrompt({ taskId }),
        },
      ],
      isError: true,
    };
  }

  if (task.status === TaskStatus.COMPLETED) {
    return {
      content: [
        {
          type: "text" as const,
          text: getDeleteTaskPrompt({ taskId, task, isTaskCompleted: true }),
        },
      ],
      isError: true,
    };
  }

  const result = await modelDeleteTask(taskId, dataDir, requirementName);

  return {
    content: [
      {
        type: "text" as const,
        text: getDeleteTaskPrompt({
          taskId,
          task,
          success: result.success,
          message: result.message,
        }),
      },
    ],
    isError: !result.success,
  };
}
