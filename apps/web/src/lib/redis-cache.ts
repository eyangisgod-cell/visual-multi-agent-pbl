/**
 * Redis 缓存工具
 *
 * 提供常用的缓存操作方法
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // 放弃重连
          }
          return Math.min(times * 50, 2000);
        },
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected');
      });
    } catch (error) {
      console.error('[Redis] Failed to initialize:', error);
      return null;
    }
  }
  return redisClient;
}

/**
 * 缓存键前缀
 */
const KEY_PREFIX = {
  USER: 'user:',
  PROJECT: 'project:',
  WORK: 'work:',
  AGENT: 'agent:',
  CONVERSATION: 'conversation:',
  KNOWLEDGE: 'knowledge:',
  ROLE: 'role:',
  LIST: 'list:',
};

/**
 * 默认缓存时间（秒）
 */
const TTL = {
  SHORT: 60, // 1 分钟
  MEDIUM: 300, // 5 分钟
  LONG: 1800, // 30 分钟
  VERY_LONG: 86400, // 24 小时
};

/**
 * 获取缓存
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('[Redis] Get cache error:', error);
    return null;
  }
}

/**
 * 设置缓存
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = TTL.MEDIUM
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    console.error('[Redis] Set cache error:', error);
  }
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('[Redis] Delete cache error:', error);
  }
}

/**
 * 批量删除缓存（支持通配符）
 */
export async function deleteCacheByPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('[Redis] Delete cache by pattern error:', error);
  }
}

/**
 * 缓存装饰器
 */
export function cacheResult<T>(
  keyPrefix: string,
  ttl: number = TTL.MEDIUM,
  keyFn?: (...args: any[]) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyFn
        ? `${keyPrefix}:${keyFn(...args)}`
        : `${keyPrefix}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await getCache<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      await setCache(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// 便捷方法
export const cache = {
  user: {
    key: (id: string) => `${KEY_PREFIX.USER}${id}`,
    get: <T>(id: string) => getCache<T>(`${KEY_PREFIX.USER}${id}`),
    set: <T>(id: string, value: T, ttl?: number) =>
      setCache(`${KEY_PREFIX.USER}${id}`, value, ttl),
    delete: (id: string) => deleteCache(`${KEY_PREFIX.USER}${id}`),
  },
  project: {
    key: (id: string) => `${KEY_PREFIX.PROJECT}${id}`,
    get: <T>(id: string) => getCache<T>(`${KEY_PREFIX.PROJECT}${id}`),
    set: <T>(id: string, value: T, ttl?: number) =>
      setCache(`${KEY_PREFIX.PROJECT}${id}`, value, ttl),
    delete: (id: string) => deleteCache(`${KEY_PREFIX.PROJECT}${id}`),
  },
  work: {
    key: (id: string) => `${KEY_PREFIX.WORK}${id}`,
    get: <T>(id: string) => getCache<T>(`${KEY_PREFIX.WORK}${id}`),
    set: <T>(id: string, value: T, ttl?: number) =>
      setCache(`${KEY_PREFIX.WORK}${id}`, value, ttl),
    delete: (id: string) => deleteCache(`${KEY_PREFIX.WORK}${id}`),
  },
  agent: {
    key: (id: string) => `${KEY_PREFIX.AGENT}${id}`,
    get: <T>(id: string) => getCache<T>(`${KEY_PREFIX.AGENT}${id}`),
    set: <T>(id: string, value: T, ttl?: number) =>
      setCache(`${KEY_PREFIX.AGENT}${id}`, value, ttl),
    delete: (id: string) => deleteCache(`${KEY_PREFIX.AGENT}${id}`),
  },
  knowledge: {
    key: (id: string) => `${KEY_PREFIX.KNOWLEDGE}${id}`,
    get: <T>(id: string) => getCache<T>(`${KEY_PREFIX.KNOWLEDGE}${id}`),
    set: <T>(id: string, value: T, ttl?: number) =>
      setCache(`${KEY_PREFIX.KNOWLEDGE}${id}`, value, ttl),
    delete: (id: string) => deleteCache(`${KEY_PREFIX.KNOWLEDGE}${id}`),
  },
  list: {
    key: (type: string, params: string) => `${KEY_PREFIX.LIST}${type}:${params}`,
    get: <T>(type: string, params: string) =>
      getCache<T>(`${KEY_PREFIX.LIST}${type}:${params}`),
    set: <T>(type: string, params: string, value: T, ttl?: number) =>
      setCache(`${KEY_PREFIX.LIST}${type}:${params}`, value, ttl),
    delete: (type: string, params: string) =>
      deleteCache(`${KEY_PREFIX.LIST}${type}:${params}`),
  },
};

export { TTL, KEY_PREFIX };
