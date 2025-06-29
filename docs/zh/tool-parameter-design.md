# 工具参数设计指南

## 概述

本文档说明了 MCP Shrimp Task Manager 中工具参数的设计模式和最佳实践，特别是关于 `dataDir` 参数的使用。

## 设计原则

### 1. 分层架构
- **工具层 (Tools)**: 处理用户输入和业务逻辑
- **模型层 (Models)**: 处理数据访问和存储
- **文件系统层**: 实际的文件读写操作

### 2. 并发安全
- 支持多个 MCP 实例同时运行
- 每个实例可以使用独立的数据目录
- 使用文件锁机制防止数据竞争

### 3. 数据隔离保证
- 所有 `dataDir` 参数都是必传的
- 确保数据总是存储在明确指定的位置
- 不同项目使用完全独立的数据目录

## dataDir 参数设计

### 参数定义（2024年更新）
```typescript
dataDir: z.string().describe("数据目录路径，用于存储任务数据的工作目录")
```

**重要变更**：`dataDir` 参数现在是**必传参数**，不再是可选的。

### 使用场景
1. **开发环境**: 不同开发者使用独立的数据目录
2. **测试环境**: 每个测试用例使用隔离的数据目录
3. **生产环境**: 多个项目使用不同的数据目录
4. **并发调用**: 防止多个 MCP 实例之间的数据冲突

### 路径解析逻辑（已更新）
```typescript
// 注意：不再支持环境变量 DATA_DIR 回退
function getDataDir(dataDir: string): string {
  return path.isAbsolute(dataDir) ? dataDir : path.resolve(dataDir);
}
```

## 需要 dataDir 参数的工具

### 数据访问工具
这些工具直接访问任务数据，需要 `dataDir` 参数：

1. **listTasks** - 列出任务
2. **executeTask** - 执行任务
3. **verifyTask** - 验证任务
4. **deleteTask** - 删除任务
5. **clearAllTasks** - 清除所有任务
6. **updateTaskContent** - 更新任务内容
7. **queryTask** - 查询任务
8. **getTaskDetail** - 获取任务详情
9. **splitTasks** / **splitTasksRaw** - 拆分任务
10. **planTask** - 规划任务
11. **researchMode** - 研究模式（需要访问 MEMORY_DIR）
12. **initProjectRules** - 项目规范初始化（需要访问自定义模板）

### 不需要 dataDir 参数的工具
这些工具不直接访问数据，无需 `dataDir` 参数：

1. **analyzeTask** - 纯分析工具
2. **reflectTask** - 纯分析工具
3. **processThought** - 思维链工具

## 文件锁机制

### 实现原理
使用 `FileLock` 类确保文件访问的原子性：

```typescript
export class FileLock {
  private static locks = new Map<string, Promise<void>>();
  
  static async withLock<T>(
    filePath: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const release = await this.acquire(filePath);
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
```

### 安全文件操作
- `safeReadJsonFile()` - 安全读取 JSON 文件
- `safeWriteJsonFile()` - 安全写入 JSON 文件
- `safeReadFile()` - 安全读取文本文件
- `safeWriteFile()` - 安全写入文本文件

## 最佳实践

### 1. 工具开发
- 为需要数据访问的工具添加可选的 `dataDir` 参数
- 将 `dataDir` 参数传递给所有模型层函数
- 使用统一的参数描述文本

### 2. 模型层函数
- 所有数据访问函数都应支持可选的 `dataDir` 参数
- 使用 `getDataDir()` 函数统一处理路径解析
- 使用文件锁机制确保并发安全

### 3. 错误处理
- 提供清晰的错误信息
- 处理路径不存在的情况
- 确保资源正确释放

## 示例代码

### 工具参数定义
```typescript
export const exampleToolSchema = z.object({
  // 业务参数
  taskId: z.string().describe("任务ID"),
  // 数据目录参数
  dataDir: z.string().optional().describe("可选的数据目录路径，未提供时使用环境变量或默认路径"),
});
```

### 工具实现
```typescript
export async function exampleTool({ taskId, dataDir }: z.infer<typeof exampleToolSchema>) {
  // 调用模型层函数，传递 dataDir 参数
  const task = await getTaskById(taskId, dataDir);
  // ... 业务逻辑
}
```

### 模型层函数
```typescript
export async function getTaskById(taskId: string, dataDir?: string): Promise<Task | null> {
  const tasks = await readTasks(dataDir);
  return tasks.find(task => task.id === taskId) || null;
}
```

## 迁移指南

### 现有工具升级
1. 在 schema 中添加 `dataDir` 参数
2. 在函数参数中添加 `dataDir`
3. 将 `dataDir` 传递给所有模型层调用

### 测试验证
1. 测试不提供 `dataDir` 的情况（向后兼容）
2. 测试提供相对路径和绝对路径
3. 测试并发访问不同数据目录
4. 测试文件锁机制的有效性

## 总结

通过引入可选的 `dataDir` 参数和文件锁机制，MCP Shrimp Task Manager 现在支持：

- ✅ 多实例并发运行
- ✅ 数据目录隔离
- ✅ 并发安全保证
- ✅ 向后兼容性
- ✅ 灵活的部署方式

这种设计确保了系统的可扩展性和稳定性，同时保持了简单易用的特性。
