import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import { getTaskById, updateTaskStatus, canExecuteTask, assessTaskComplexity } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getExecuteTaskPrompt } from "../../prompts/index.js";
import { loadTaskRelatedFiles } from "../../utils/fileLoader.js";

// 執行任務工具
export const executeTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "任務ID格式無效，請提供有效的UUID v4格式",
    })
    .describe("待執行任務的唯一標識符，必須是系統中存在的有效任務ID"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
  requirementName: z.string().describe("需求名称，指定要操作的需求目录，必须提供"),
});

export async function executeTask({ taskId, dataDir, requirementName }: z.infer<typeof executeTaskSchema>) {
  try {
    // 檢查任務是否存在
    const task = await getTaskById(taskId, dataDir, requirementName);
    if (!task) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到ID為 \`${taskId}\` 的任務。請確認ID是否正確。`,
          },
        ],
      };
    }

    // 檢查任務是否可以執行（依賴任務都已完成）
    const executionCheck = await canExecuteTask(taskId, dataDir, requirementName);
    if (!executionCheck.canExecute) {
      const blockedByTasksText = executionCheck.blockedBy && executionCheck.blockedBy.length > 0 ? `被以下未完成的依賴任務阻擋: ${executionCheck.blockedBy.join(", ")}` : "無法確定阻擋原因";

      return {
        content: [
          {
            type: "text" as const,
            text: `任務 "${task.name}" (ID: \`${taskId}\`) 目前無法執行。${blockedByTasksText}`,
          },
        ],
      };
    }

    // 如果任務已經標記為「進行中」，提示用戶
    if (task.status === TaskStatus.IN_PROGRESS) {
      return {
        content: [
          {
            type: "text" as const,
            text: `任務 "${task.name}" (ID: \`${taskId}\`) 已經處於進行中狀態。`,
          },
        ],
      };
    }

    // 如果任務已經標記為「已完成」，提示用戶
    if (task.status === TaskStatus.COMPLETED) {
      return {
        content: [
          {
            type: "text" as const,
            text: `任務 "${task.name}" (ID: \`${taskId}\`) 已經標記為完成。如需重新執行，請先使用 delete_task 刪除該任務並重新創建。`,
          },
        ],
      };
    }

    // 更新任務狀態為「進行中」
    const updateResult = await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, dataDir, requirementName);
    if (!updateResult) {
      return {
        content: [
          {
            type: "text" as const,
            text: `無法更新任務 "${task.name}" (ID: \`${taskId}\`) 的狀態。任務可能已被刪除或發生其他錯誤。`,
          },
        ],
      };
    }

    // 評估任務複雜度
    const complexityResult = await assessTaskComplexity(taskId, dataDir, requirementName);

    // 將複雜度結果轉換為適當的格式
    const complexityAssessment = complexityResult
      ? {
          level: complexityResult.level,
          metrics: {
            descriptionLength: complexityResult.metrics.descriptionLength,
            dependenciesCount: complexityResult.metrics.dependenciesCount,
          },
          recommendations: complexityResult.recommendations,
        }
      : undefined;

    // 獲取依賴任務，用於顯示完成摘要
    const dependencyTasks: Task[] = [];
    if (task.dependencies && task.dependencies.length > 0) {
      for (const dep of task.dependencies) {
        const depTask = await getTaskById(dep.taskId, dataDir, requirementName);
        if (depTask) {
          dependencyTasks.push(depTask);
        }
      }
    }

    // 加載任務相關的文件內容
    let relatedFilesSummary = "";
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      try {
        const relatedFilesResult = await loadTaskRelatedFiles(task.relatedFiles);
        relatedFilesSummary = typeof relatedFilesResult === "string" ? relatedFilesResult : relatedFilesResult.summary || "";
      } catch (error) {
        relatedFilesSummary = "Error loading related files, please check the files manually.";
      }
    }

    // 使用prompt生成器獲取最終prompt
    const prompt = getExecuteTaskPrompt({
      task,
      complexityAssessment,
      relatedFilesSummary,
      dependencyTasks,
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
    return {
      content: [
        {
          type: "text" as const,
          text: `執行任務時發生錯誤: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
