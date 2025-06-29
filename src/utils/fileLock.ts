import fs from "fs/promises";
import path from "path";

/**
 * 文件锁管理器
 * 用于防止并发访问同一个文件时的数据竞争问题
 */
export class FileLock {
  private static locks = new Map<string, Promise<void>>();

  /**
   * 获取文件锁
   * @param filePath 文件路径
   * @returns Promise，在获得锁时解析
   */
  static async acquire(filePath: string): Promise<() => void> {
    const normalizedPath = path.resolve(filePath);
    
    // 如果已经有锁在等待，等待它完成
    while (this.locks.has(normalizedPath)) {
      await this.locks.get(normalizedPath);
    }

    // 创建新的锁
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(normalizedPath, lockPromise);

    // 返回释放锁的函数
    return () => {
      this.locks.delete(normalizedPath);
      releaseLock!();
    };
  }

  /**
   * 带锁执行函数
   * @param filePath 文件路径
   * @param operation 要执行的操作
   * @returns 操作的返回值
   */
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

/**
 * 安全的文件读取函数
 * @param filePath 文件路径
 * @param encoding 编码格式
 * @returns 文件内容
 */
export async function safeReadFile(
  filePath: string,
  encoding: BufferEncoding = "utf-8"
): Promise<string> {
  return FileLock.withLock(filePath, async () => {
    return await fs.readFile(filePath, encoding);
  });
}

/**
 * 安全的文件写入函数
 * @param filePath 文件路径
 * @param data 要写入的数据
 * @param encoding 编码格式
 */
export async function safeWriteFile(
  filePath: string,
  data: string,
  encoding: BufferEncoding = "utf-8"
): Promise<void> {
  return FileLock.withLock(filePath, async () => {
    // 确保目录存在
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // 写入文件
    await fs.writeFile(filePath, data, encoding);
  });
}

/**
 * 安全的 JSON 文件读取函数
 * @param filePath 文件路径
 * @returns 解析后的 JSON 对象
 */
export async function safeReadJsonFile<T = any>(filePath: string): Promise<T> {
  return FileLock.withLock(filePath, async () => {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  });
}

/**
 * 安全的 JSON 文件写入函数
 * @param filePath 文件路径
 * @param data 要写入的数据
 * @param space JSON.stringify 的 space 参数
 */
export async function safeWriteJsonFile(
  filePath: string,
  data: any,
  space: number = 2
): Promise<void> {
  return FileLock.withLock(filePath, async () => {
    // 确保目录存在
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // 写入文件
    const content = JSON.stringify(data, null, space);
    await fs.writeFile(filePath, content, "utf-8");
  });
}
