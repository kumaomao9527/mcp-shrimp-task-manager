import { z } from "zod";
import { getResearchModePrompt } from "../../prompts/index.js";
import { ensureMemoryDir } from "../../utils/pathUtils.js";

// 研究模式工具
export const researchModeSchema = z.object({
  topic: z
    .string()
    .min(5, {
      message: "研究主题不能少于5个字符，请提供明确的研究主题",
    })
    .describe("要研究的程序编程主题内容，应该明确且具体"),
  previousState: z.string().optional().default("").describe("之前的研究状态和内容摘要，第一次执行时为空，后续会包含之前详细且关键的研究成果，这将帮助后续的研究"),
  currentState: z
    .string()
    .describe(
      "当前 Agent 主要该执行的内容，例如使用网络工具搜索某些关键字或分析特定程序代码，研究完毕后请调用 research_mode 来记录状态并与之前的`previousState`整合，这将帮助你更好的保存与执行研究内容"
    ),
  nextSteps: z.string().describe("后续的计划、步骤或研究方向，用来约束 Agent 不偏离主题或走错方向，如果研究过程中发现需要调整研究方向，请更新此字段"),
  dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录"),
});

export async function researchMode({ topic, previousState = "", currentState, nextSteps, dataDir }: z.infer<typeof researchModeSchema>) {
  // 确保记忆目录存在
  const MEMORY_DIR = await ensureMemoryDir(dataDir);

  // 使用prompt生成器获取最终prompt
  const prompt = getResearchModePrompt({
    topic,
    previousState,
    currentState,
    nextSteps,
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
