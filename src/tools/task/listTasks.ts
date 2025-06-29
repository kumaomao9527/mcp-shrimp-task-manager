import { z } from "zod";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getListTasksPrompt } from "../../prompts/index.js";
import { createWebGUIFileIfEnabled } from "../../utils/pathUtils.js";

export const listTasksSchema = z.object({
  status: z.enum(["all", "pending", "in_progress", "completed"]).describe("要列出的任務狀態，可選擇 'all' 列出所有任務，或指定具體狀態"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要查看的需求目录，必须提供"),
});

// 列出任務工具
export async function listTasks({ status, dataDir, requirementName }: z.infer<typeof listTasksSchema>) {
  // 如果启用了 GUI 功能，尝试创建 WebGUI.md 文件
  await createWebGUIFileIfEnabled(dataDir);

  const tasks = await getAllTasks(dataDir, requirementName);
  let filteredTasks = tasks;
  switch (status) {
    case "all":
      break;
    case "pending":
      filteredTasks = tasks.filter((task) => task.status === TaskStatus.PENDING);
      break;
    case "in_progress":
      filteredTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
      break;
    case "completed":
      filteredTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED);
      break;
  }

  if (filteredTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統通知\n\n目前系統中沒有${status === "all" ? "任何" : `任何 ${status} 的`}任務。請查詢其他狀態任務或先使用「split_tasks」工具創建任務結構，再進行後續操作。`,
        },
      ],
    };
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // 使用prompt生成器獲取最終prompt
  const prompt = getListTasksPrompt({
    status,
    tasks: tasksByStatus,
    allTasks: filteredTasks,
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
