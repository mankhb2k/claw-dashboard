/**
 * Mock data for OpenClaw SaaS Frontend Development
 * Based on Prisma Schema models
 */

export const MOCK_USER = {
  id: "user_123",
  name: "John Doe",
  email: "john@example.com",
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  createdAt: "2026-01-01T00:00:00Z",
};

export const MOCK_USER_PRO = {
  id: "user_pro_999",
  name: "Alex Premium",
  email: "alex@pro-user.com",
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  createdAt: "2026-02-15T14:20:00Z",
};

export const MOCK_PLANS = [
  {
    id: "plan_free",
    name: "Free",
    maxProjects: 1,
    ramMb: 1024,
    cpuVcpu: 0.5,
    storageGb: 4,
    maxConcurrentRunning: 1,
    monthlyCredits: 0,
    idleTimeoutMin: 10,
    priceMonthly: 0,
  },
  {
    id: "plan_pro",
    name: "Pro",
    maxProjects: 5,
    ramMb: 2048,
    cpuVcpu: 1.0,
    storageGb: 10,
    maxConcurrentRunning: 3,
    monthlyCredits: 1000,
    idleTimeoutMin: 60,
    priceMonthly: 1900, // $19.00
  }
];

export const MOCK_SUBSCRIPTION = {
  id: "sub_123",
  planId: "plan_pro",
  status: "ACTIVE",
  currentPeriodEnd: "2026-05-30T00:00:00Z",
  cancelAtPeriodEnd: false,
};

export const MOCK_PROJECTS_PRO = [
  {
    id: "proj_pro_1",
    displayName: "Enterprise Support Hub",
    subdomain: "enterprise-bot",
    status: "RUNNING",
    lastActiveAt: new Date().toISOString(),
    keepAlive: true,
    storageUsedMb: 850,
    createdAt: "2026-03-01T10:00:00Z",
    domain: "enterprise-bot.openclaw.ai",
  },
  {
    id: "proj_pro_2",
    displayName: "Sales Automation",
    subdomain: "sales-flow",
    status: "RUNNING",
    lastActiveAt: new Date().toISOString(),
    keepAlive: true,
    storageUsedMb: 1200,
    createdAt: "2026-03-05T08:00:00Z",
    domain: "sales-flow.openclaw.ai",
  },
  {
    id: "proj_pro_3",
    displayName: "Beta Testing Bot",
    subdomain: "beta-tester",
    status: "STOPPED",
    lastActiveAt: "2026-04-28T22:00:00Z",
    keepAlive: false,
    storageUsedMb: 320,
    createdAt: "2026-04-01T15:00:00Z",
    domain: "beta-tester.openclaw.ai",
  },
  {
    id: "proj_pro_4",
    displayName: "AI Analytics Assistant",
    subdomain: "ai-analytics",
    status: "ERROR",
    errorMessage: "Container crash loop detected",
    lastActiveAt: "2026-04-29T11:00:00Z",
    keepAlive: false,
    storageUsedMb: 150,
    createdAt: "2026-04-10T09:00:00Z",
    domain: "ai-analytics.openclaw.ai",
  }
];

export const MOCK_CREDITS = {
  monthlyBalance: 450,
  purchasedBalance: 120,
  monthlyResetAt: "2026-05-01T00:00:00Z",
  totalUsed: 1530,
};

export const MOCK_HEAVY_JOBS = [
  {
    id: "job_1",
    tool: "FFMPEG_SHORT",
    creditCost: 10,
    status: "DONE",
    resultPath: "/data/outputs/video_1.mp4",
    submittedAt: "2026-04-29T10:00:00Z",
    completedAt: "2026-04-29T10:01:45Z",
  },
  {
    id: "job_2",
    tool: "PLAYWRIGHT",
    creditCost: 5,
    status: "PROCESSING",
    submittedAt: "2026-04-30T11:00:00Z",
  },
  {
    id: "job_3",
    tool: "TTS",
    creditCost: 2,
    status: "FAILED",
    errorMessage: "API Limit exceeded",
    submittedAt: "2026-04-30T09:00:00Z",
    completedAt: "2026-04-30T09:00:05Z",
  }
];
