import "dotenv/config";
import { loadPromptFromTemplate } from "./prompts/loader.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { CallToolRequest, CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";
import { getTasksFilePath, getShrimpTaskDir, ensureShrimpTaskDir } from "./utils/pathUtils.js";
import { Server as SocketIOServer } from "socket.io";

// 导入所有工具函数和 schema
import {
  planTask,
  planTaskSchema,
  analyzeTask,
  analyzeTaskSchema,
  reflectTask,
  reflectTaskSchema,
  splitTasks,
  splitTasksSchema,
  splitTasksRaw,
  splitTasksRawSchema,
  listTasksSchema,
  listTasks,
  executeTask,
  executeTaskSchema,
  verifyTask,
  verifyTaskSchema,
  deleteTask,
  deleteTaskSchema,
  clearAllTasks,
  clearAllTasksSchema,
  updateTaskContent,
  updateTaskContentSchema,
  queryTask,
  queryTaskSchema,
  getTaskDetail,
  getTaskDetailSchema,
  listRequirements,
  listRequirementsSchema,
  processThought,
  processThoughtSchema,
  initProjectRules,
  initProjectRulesSchema,
  researchMode,
  researchModeSchema,
} from "./tools/index.js";

// 全局变量存储 GUI 服务器端口
let guiServerPort: number | null = null;

/**
 * 动态创建 WebGUI.md 文件
 * @param dataDir 数据目录路径
 */
async function createWebGUIFile(dataDir: string): Promise<void> {
  if (!guiServerPort) return;

  try {
    // 确保 .shrimp_task 目录存在
    const shrimpTaskDir = await ensureShrimpTaskDir(dataDir);

    // 读取 TEMPLATES_USE 环境变量并转换为语言代码
    const templatesUse = process.env.TEMPLATES_USE || "en";
    const getLanguageFromTemplate = (template: string): string => {
      if (template === "zh") return "zh-CN";
      if (template === "en") return "en";
      // 自定义模板默认使用英文
      return "en";
    };
    const language = getLanguageFromTemplate(templatesUse);

    // 如果有指定 dataDir，则在 URL 中包含 dataDir 参数
    const dataDirParam = dataDir ? `&dataDir=${encodeURIComponent(dataDir)}` : "";
    const websiteUrl = `[Task Manager UI](http://localhost:${guiServerPort}?lang=${language}${dataDirParam})`;
    const websiteFilePath = path.join(shrimpTaskDir, "WebGUI.md");
    await fsPromises.writeFile(websiteFilePath, websiteUrl, "utf-8");
  } catch (error) {
    // 静默处理错误，不影响主要功能
  }
}

async function main() {
  try {
    const ENABLE_GUI = process.env.ENABLE_GUI === "true";

    if (ENABLE_GUI) {
      // 創建 Express 應用
      const app = express();

      // 儲存 SSE 客戶端的列表
      let sseClients: Response[] = [];

      // 發送 SSE 事件的輔助函數
      function sendSseUpdate() {
        sseClients.forEach((client) => {
          // 檢查客戶端是否仍然連接
          if (!client.writableEnded) {
            client.write(
              `event: update\ndata: ${JSON.stringify({
                timestamp: Date.now(),
              })}\n\n`
            );
          }
        });
        // 清理已斷開的客戶端 (可選，但建議)
        sseClients = sseClients.filter((client) => !client.writableEnded);
      }

      // 設置靜態文件目錄
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const publicPath = path.join(__dirname, "public");

      app.use(express.static(publicPath));

      // 設置 API 路由 - 支持动态数据目录和需求目录
      app.get("/api/tasks", async (req: Request, res: Response) => {
        try {
          // 从查询参数获取数据目录，必须提供
          const dataDir = req.query.dataDir as string;
          if (!dataDir) {
            res.status(400).json({ error: "dataDir parameter is required" });
            return;
          }

          // 从查询参数获取需求名称，可选
          const requirementName = req.query.requirementName as string;
          const tasksFilePath = getTasksFilePath(dataDir, requirementName);

          // 使用 fsPromises 保持異步讀取
          const tasksData = await fsPromises.readFile(tasksFilePath, "utf-8");
          res.json(JSON.parse(tasksData));
        } catch (error) {
          // 確保檔案不存在時返回空任務列表
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            res.json({ tasks: [] });
          } else {
            res.status(500).json({ error: "Failed to read tasks data" });
          }
        }
      });

      // 新增：获取需求列表的 API 路由
      app.get("/api/requirements", async (req: Request, res: Response) => {
        try {
          // 从查询参数获取数据目录，必须提供
          const dataDir = req.query.dataDir as string;
          if (!dataDir) {
            res.status(400).json({ error: "dataDir parameter is required" });
            return;
          }

          const { getAllRequirements } = await import("./models/taskModel.js");
          const requirements = await getAllRequirements(dataDir);
          res.json({ requirements });
        } catch (error) {
          res.status(500).json({ error: "Failed to read requirements data" });
        }
      });

      // 新增：获取需求统计信息的 API 路由
      app.get("/api/requirements/stats", async (req: Request, res: Response) => {
        try {
          // 从查询参数获取数据目录，必须提供
          const dataDir = req.query.dataDir as string;
          if (!dataDir) {
            res.status(400).json({ error: "dataDir parameter is required" });
            return;
          }

          const { getRequirementStats } = await import("./models/taskModel.js");
          const stats = await getRequirementStats(dataDir);
          res.json(stats);
        } catch (error) {
          res.status(500).json({ error: "Failed to read requirements stats" });
        }
      });

      // 新增：SSE 端點
      app.get("/api/tasks/stream", (req: Request, res: Response) => {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          // 可選: CORS 頭，如果前端和後端不在同一個 origin
          // "Access-Control-Allow-Origin": "*",
        });

        // 發送一個初始事件或保持連接
        res.write("data: connected\n\n");

        // 將客戶端添加到列表
        sseClients.push(res);

        // 當客戶端斷開連接時，將其從列表中移除
        req.on("close", () => {
          sseClients = sseClients.filter((client) => client !== res);
        });
      });

      // 獲取可用埠
      const port = 58649;
      guiServerPort = port; // 保存端口号供后续使用

      // 啟動 HTTP 伺服器
      const httpServer = app.listen(port, () => {
        console.log(`GUI 服务器已启动，端口: ${port}`);
        // 注意：由于支持动态数据目录，文件监听功能暂时移除
        // 可以考虑在未来版本中实现基于 WebSocket 的实时更新
      });

      // 注意：WebGUI.md 文件现在由各个工具在调用时根据提供的 dataDir 参数创建

      // 設置進程終止事件處理 (確保移除 watcher)
      const shutdownHandler = async () => {
        // 關閉所有 SSE 連接
        sseClients.forEach((client) => client.end());
        sseClients = [];

        // 關閉 HTTP 伺服器
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        process.exit(0);
      };

      process.on("SIGINT", shutdownHandler);
      process.on("SIGTERM", shutdownHandler);
    }

    // 創建MCP服務器
    const server = new Server(
      {
        name: "Shrimp Task Manager",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "plan_task",
            description: loadPromptFromTemplate("toolsDescription/planTask.md"),
            inputSchema: zodToJsonSchema(planTaskSchema),
          },
          {
            name: "analyze_task",
            description: loadPromptFromTemplate("toolsDescription/analyzeTask.md"),
            inputSchema: zodToJsonSchema(analyzeTaskSchema),
          },
          {
            name: "reflect_task",
            description: loadPromptFromTemplate("toolsDescription/reflectTask.md"),
            inputSchema: zodToJsonSchema(reflectTaskSchema),
          },
          {
            name: "split_tasks",
            description: loadPromptFromTemplate("toolsDescription/splitTasks.md"),
            inputSchema: zodToJsonSchema(splitTasksRawSchema),
          },
          {
            name: "list_tasks",
            description: loadPromptFromTemplate("toolsDescription/listTasks.md"),
            inputSchema: zodToJsonSchema(listTasksSchema),
          },
          {
            name: "execute_task",
            description: loadPromptFromTemplate("toolsDescription/executeTask.md"),
            inputSchema: zodToJsonSchema(executeTaskSchema),
          },
          {
            name: "verify_task",
            description: loadPromptFromTemplate("toolsDescription/verifyTask.md"),
            inputSchema: zodToJsonSchema(verifyTaskSchema),
          },
          {
            name: "delete_task",
            description: loadPromptFromTemplate("toolsDescription/deleteTask.md"),
            inputSchema: zodToJsonSchema(deleteTaskSchema),
          },
          {
            name: "clear_all_tasks",
            description: loadPromptFromTemplate("toolsDescription/clearAllTasks.md"),
            inputSchema: zodToJsonSchema(clearAllTasksSchema),
          },
          {
            name: "update_task",
            description: loadPromptFromTemplate("toolsDescription/updateTask.md"),
            inputSchema: zodToJsonSchema(updateTaskContentSchema),
          },
          {
            name: "query_task",
            description: loadPromptFromTemplate("toolsDescription/queryTask.md"),
            inputSchema: zodToJsonSchema(queryTaskSchema),
          },
          {
            name: "get_task_detail",
            description: loadPromptFromTemplate("toolsDescription/getTaskDetail.md"),
            inputSchema: zodToJsonSchema(getTaskDetailSchema),
          },
          {
            name: "list_requirements",
            description: "列出所有需求目录，显示当前系统中存在的需求分组",
            inputSchema: zodToJsonSchema(listRequirementsSchema),
          },
          {
            name: "process_thought",
            description: loadPromptFromTemplate("toolsDescription/processThought.md"),
            inputSchema: zodToJsonSchema(processThoughtSchema),
          },
          {
            name: "init_project_rules",
            description: loadPromptFromTemplate("toolsDescription/initProjectRules.md"),
            inputSchema: zodToJsonSchema(initProjectRulesSchema),
          },
          {
            name: "research_mode",
            description: loadPromptFromTemplate("toolsDescription/researchMode.md"),
            inputSchema: zodToJsonSchema(researchModeSchema),
          },
        ],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        // 检查是否有 dataDir 参数，如果有则创建 WebGUI.md 文件
        const args = request.params.arguments as any;
        if (args.dataDir && guiServerPort) {
          await createWebGUIFile(args.dataDir);
        }

        let parsedArgs;
        switch (request.params.name) {
          case "plan_task":
            parsedArgs = await planTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await planTask(parsedArgs.data);
          case "analyze_task":
            parsedArgs = await analyzeTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await analyzeTask(parsedArgs.data);
          case "reflect_task":
            parsedArgs = await reflectTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await reflectTask(parsedArgs.data);
          case "split_tasks":
            parsedArgs = await splitTasksRawSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await splitTasksRaw(parsedArgs.data);
          case "list_tasks":
            parsedArgs = await listTasksSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await listTasks(parsedArgs.data);
          case "execute_task":
            parsedArgs = await executeTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await executeTask(parsedArgs.data);
          case "verify_task":
            parsedArgs = await verifyTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await verifyTask(parsedArgs.data);
          case "delete_task":
            parsedArgs = await deleteTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await deleteTask(parsedArgs.data);
          case "clear_all_tasks":
            parsedArgs = await clearAllTasksSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await clearAllTasks(parsedArgs.data);
          case "update_task":
            parsedArgs = await updateTaskContentSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await updateTaskContent(parsedArgs.data);
          case "query_task":
            parsedArgs = await queryTaskSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await queryTask(parsedArgs.data);
          case "get_task_detail":
            parsedArgs = await getTaskDetailSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await getTaskDetail(parsedArgs.data);
          case "process_thought":
            parsedArgs = await processThoughtSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await processThought(parsedArgs.data);
          case "init_project_rules":
            parsedArgs = await initProjectRulesSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await initProjectRules(parsedArgs.data);
          case "list_requirements":
            parsedArgs = await listRequirementsSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await listRequirements(parsedArgs.data);
          case "research_mode":
            parsedArgs = await researchModeSchema.safeParseAsync(request.params.arguments);
            if (!parsedArgs.success) {
              throw new Error(`Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`);
            }
            return await researchMode(parsedArgs.data);
          default:
            throw new Error(`Tool ${request.params.name} does not exist`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error occurred: ${errorMsg} \n Please try correcting the error and calling the tool again`,
            },
          ],
        };
      }
    });

    // 建立連接
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

main().catch(console.error);
