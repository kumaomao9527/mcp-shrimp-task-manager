import { z } from "zod";
import { getReflectTaskPrompt } from "../../prompts/index.js";

// 反思构想工具
export const reflectTaskSchema = z.object({
  summary: z
    .string()
    .min(10, {
      message: "任务摘要不能少于10个字符，请提供更详细的描述以确保任务目标明确",
    })
    .describe("结构化的任务摘要，保持与分析阶段一致以确保连续性"),
  analysis: z
    .string()
    .min(100, {
      message: "技术分析内容不够详尽，请提供完整的技术分析和实施方案",
    })
    .describe("完整详尽的技术分析结果，包括所有技术细节、依赖组件和实施方案，如果需要提供程序代码请使用 pseudocode 格式且仅提供高级逻辑流程和关键步骤避免完整代码"),
});

export async function reflectTask({ summary, analysis }: z.infer<typeof reflectTaskSchema>) {
  // 使用prompt生成器获取最终prompt
  const prompt = getReflectTaskPrompt({
    summary,
    analysis,
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
