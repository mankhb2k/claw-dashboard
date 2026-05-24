// Fake Data cho Biểu đồ
export const TOKEN_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 1100 },
];

export const LATENCY_DATA = [
  { name: 'Jan', value: 120 },
  { name: 'Feb', value: 150 },
  { name: 'Mar', value: 110 },
  { name: 'Apr', value: 180 },
  { name: 'May', value: 140 },
  { name: 'Jun', value: 130 },
  { name: 'Jul', value: 125 },
];

// Fake Data cho Bảng
export const RECENT_CALLS = [
  { 
    model: 'GPT-4o', 
    time: '2 mins ago', 
    user: 'Admin', 
    status: 'Success', 
    latency: 450, 
    tokens: 1240, 
    color: '#10b981' 
  },
  { 
    model: 'Claude 3.5 Sonnet', 
    time: '15 mins ago', 
    user: 'System', 
    status: 'Success', 
    latency: 820, 
    tokens: 4200, 
    color: '#f59e0b' 
  },
  { 
    model: 'Gemini 1.5 Pro', 
    time: '1 hour ago', 
    user: 'API Key', 
    status: 'Failed', 
    latency: 120, 
    tokens: 0, 
    color: '#3b82f6' 
  },
  { 
    model: 'Llama 3 70B', 
    time: '2 hours ago', 
    user: 'Admin', 
    status: 'Success', 
    latency: 640, 
    tokens: 2100, 
    color: '#ec4899' 
  },
];

// Metrics Cards Data
export const METRIC_STATS = [
  {
    title: "Total Revenue",
    value: "$1,345",
    subtitle: "Week comparison",
    trend: 12.5,
    color: "#10b981"
  },
  {
    title: "Total Tokens",
    value: "3,820k",
    subtitle: "Month comparison",
    trend: -2.4,
    color: "#3b82f6"
  },
  {
    title: "Total Income",
    value: "$690.00",
    subtitle: "Week comparison",
    trend: 4.2,
    color: "#ec4899"
  }
];
