import { z } from "zod";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getPlanTaskPrompt } from "../../prompts/index.js";
import { ensureMemoryDir } from "../../utils/pathUtils.js";

// 开始规划工具
export const planTaskSchema = z.object({
  description: z
    .string()
    .min(10, {
      message: "任务描述不能少于10个字符，请提供更详细的描述以确保任务目标明确",
    })
    .describe("完整详细的任务问题描述，应包含任务目标、背景及预期成果"),
  requirements: z.string().optional().describe("任务的特定技术要求、业务约束条件或质量标准（选填）"),
  existingTasksReference: z.boolean().optional().default(false).describe("是否参考现有任务作为规划基础，用于任务调整和延续性规划"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要操作的需求目录，必须提供"),
});

export async function planTask({ description, requirements, existingTasksReference = false, dataDir, requirementName }: z.infer<typeof planTaskSchema>) {
  // 确保记忆目录存在
  const MEMORY_DIR = await ensureMemoryDir(dataDir);

  // 准备所需参数
  let completedTasks: Task[] = [];
  let pendingTasks: Task[] = [];

  // 当 existingTasksReference 为 true 时，从数据库中加载所有任务作为参考
  if (existingTasksReference) {
    try {
      const allTasks = await getAllTasks(dataDir, requirementName);

      // 将任务分为已完成和未完成两类
      completedTasks = allTasks.filter((task) => task.status === TaskStatus.COMPLETED);
      pendingTasks = allTasks.filter((task) => task.status !== TaskStatus.COMPLETED);
    } catch (error) {}
  }

  // 使用prompt生成器获取最终prompt
  const prompt = getPlanTaskPrompt({
    description,
    requirements,
    existingTasksReference,
    completedTasks,
    pendingTasks,
    memoryDir: MEMORY_DIR,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
