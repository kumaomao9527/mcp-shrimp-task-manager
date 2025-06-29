import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import { getTaskById, updateTaskStatus, updateTaskSummary } from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getVerifyTaskPrompt } from "../../prompts/index.js";

// 检验任务工具
export const verifyTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "任务ID格式无效，请提供有效的UUID v4格式",
    })
    .describe("待验证任务的唯一标识符，必须是系统中存在的有效任务ID"),
  summary: z
    .string()
    .min(30, {
      message: "最少30个字",
    })
    .describe("当分数高于或等于 80分时代表任务完成摘要，简洁描述实施结果和重要决策，当分数低于 80分时代表缺失或需要修正的部分说明，最少30个字"),
  score: z.number().min(0, { message: "分数不能小于0" }).max(100, { message: "分数不能大于100" }).describe("针对任务的评分，当评分等于或超过80分时自动完成任务"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要操作的需求目录，必须提供"),
});

export async function verifyTask({ taskId, summary, score, dataDir, requirementName }: z.infer<typeof verifyTaskSchema>) {
  const task = await getTaskById(taskId, dataDir, requirementName);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系统错误\n\n找不到ID为 \`${taskId}\` 的任务。请使用「list_tasks」工具确认有效的任务ID后再试。`,
        },
      ],
      isError: true,
    };
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 状态错误\n\n任务 "${task.name}" (ID: \`${task.id}\`) 当前状态为 "${task.status}"，不处于进行中状态，无法进行检验。\n\n只有状态为「进行中」的任务才能进行检验。请先使用「execute_task」工具开始任务执行。`,
        },
      ],
      isError: true,
    };
  }

  if (score >= 80) {
    // 更新任务状态为已完成，并添加摘要
    await updateTaskSummary(taskId, summary, dataDir, requirementName);
    await updateTaskStatus(taskId, TaskStatus.COMPLETED, dataDir, requirementName);
  }

  // 使用prompt生成器獲取最終prompt
  const prompt = getVerifyTaskPrompt({ task, score, summary });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
