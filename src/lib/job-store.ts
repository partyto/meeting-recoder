import type { Job, JobStatus } from "./types";

/**
 * 작업 상태 저장소
 * Upstash Redis가 설정되어 있으면 사용, 아니면 인메모리 폴백
 */

// 인메모리 저장소 (개발/단순 배포용)
const memoryStore = new Map<string, Job>();

let redis: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<unknown>;
} | null = null;

async function getRedis() {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }) as unknown as typeof redis;
    return redis;
  }
  return null;
}

const KEY_PREFIX = "job:";
const TTL = 3600; // 1시간

export async function createJob(
  id: string,
  data: Omit<Job, "id" | "status" | "logs" | "createdAt" | "updatedAt">
): Promise<Job> {
  const now = new Date().toISOString();
  const job: Job = {
    ...data,
    id,
    status: "pending",
    logs: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveJob(job);
  return job;
}

export async function getJob(id: string): Promise<Job | null> {
  const r = await getRedis();
  if (r) {
    const data = await r.get(`${KEY_PREFIX}${id}`);
    return data ? (typeof data === "string" ? JSON.parse(data) : data as unknown as Job) : null;
  }
  return memoryStore.get(id) ?? null;
}

export async function updateJob(
  id: string,
  updates: Partial<Job>
): Promise<Job | null> {
  const job = await getJob(id);
  if (!job) return null;
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  await saveJob(updated);
  return updated;
}

export async function addLog(id: string, message: string): Promise<void> {
  const job = await getJob(id);
  if (!job) return;
  job.logs.push(message);
  job.updatedAt = new Date().toISOString();
  await saveJob(job);
}

export async function setJobStatus(
  id: string,
  status: JobStatus,
  log?: string
): Promise<void> {
  const job = await getJob(id);
  if (!job) return;
  job.status = status;
  if (log) job.logs.push(log);
  job.updatedAt = new Date().toISOString();
  await saveJob(job);
}

async function saveJob(job: Job): Promise<void> {
  const r = await getRedis();
  if (r) {
    await r.set(`${KEY_PREFIX}${job.id}`, JSON.stringify(job), { ex: TTL });
  } else {
    memoryStore.set(job.id, job);
  }
}
