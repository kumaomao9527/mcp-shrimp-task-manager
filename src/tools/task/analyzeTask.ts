import { z } from "zod";
import { getAnalyzeTaskPrompt } from "../../prompts/index.js";

// 分析问题工具
export const analyzeTaskSchema = z.object({
  summary: z
    .string()
    .min(10, {
      message: "任务摘要不能少于10个字符，请提供更详细的描述以确保任务目标明确",
    })
    .describe("结构化的任务摘要，包含任务目标、范围与关键技术挑战，最少10个字符"),
  initialConcept: z
    .string()
    .min(50, {
      message: "初步解答构想不能少于50个字符，请提供更详细的内容确保技术方案清晰",
    })
    .describe("最少50个字符的初步解答构想，包含技术方案、架构设计和实施策略，如果需要提供程序代码请使用 pseudocode 格式且仅提供高级逻辑流程和关键步骤避免完整代码"),
  previousAnalysis: z.string().optional().describe("前次迭代的分析结果，用于持续改进方案（仅在重新分析时需提供）"),
});

export async function analyzeTask({ summary, initialConcept, previousAnalysis }: z.infer<typeof analyzeTaskSchema>) {
  // 使用prompt生成器获取最终prompt
  const prompt = getAnalyzeTaskPrompt({
    summary,
    initialConcept,
    previousAnalysis,
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
