// Frontend-only types

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  interval_minutes: number;
  timeout_seconds: number;
  expected_status_codes: number[];
  keyword_validation?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitorCheck {
  id: string;
  monitor_id: string;
  status_code: number;
  response_time_ms: number;
  is_up: boolean;
  error_message?: string;
  response_snippet?: string;
  checked_at: string;
}

export interface Alert {
  id: string;
  monitor_id: string;
  type: "email" | "webhook";
  target: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AlertLog {
  id: string;
  alert_id: string;
  monitor_id: string;
  message: string;
  sent_at: string;
  success: boolean;
  error_message?: string;
}

// Alert API Request/Response types
export interface CreateAlertRequest {
  type: "email" | "webhook";
  target: string;
}

export interface UpdateAlertRequest {
  type?: "email" | "webhook";
  target?: string;
  is_active?: boolean;
}

export interface AlertFormData {
  type: "email" | "webhook";
  target: string;
}

// API Request/Response types
export interface CreateMonitorRequest {
  name: string;
  url: string;
  method: Monitor["method"];
  headers?: Record<string, string>;
  body?: string;
  interval_minutes: number;
  timeout_seconds?: number;
  expected_status_codes?: number[];
  keyword_validation?: string;
}

export interface UpdateMonitorRequest extends Partial<CreateMonitorRequest> {
  is_active?: boolean;
}

export interface MonitorStats {
  monitor_id: string;
  uptime_24h: number;
  uptime_7d: number;
  avg_response_time_24h: number;
  total_checks: number;
  last_check?: MonitorCheck;
  recent_checks: MonitorCheck[];
}

export interface DashboardData {
  monitors: (Monitor & { stats: MonitorStats })[];
  total_monitors: number;
  total_uptime: number;
  avg_response_time: number;
}

export interface RecentActivity {
  id: string;
  monitor_name: string;
  monitor_url: string;
  status_code: number;
  is_up: boolean;
  response_time_ms: number;
  error_message?: string;
  checked_at: string;
}

export interface SystemStats {
  total_users: number;
  total_monitors: number;
  active_monitors: number;
  total_checks_today: number;
  avg_uptime_24h: number;
  avg_response_time_24h: number;
  scheduler_status: {
    is_running: boolean;
    active_jobs: number;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Frontend-specific types
export interface UIState {
  loading: boolean;
  error: string | null;
}

export interface MonitorFormData {
  name: string;
  url: string;
  method: Monitor["method"];
  headers: string; // JSON string in form
  body: string;
  interval_minutes: number;
  timeout_seconds: number;
  expected_status_codes: string; // Comma-separated string in form
  keyword_validation: string;
}

export interface DashboardFilters {
  search: string;
  status: "all" | "up" | "down";
  sortBy: "name" | "status" | "uptime" | "response_time";
  sortOrder: "asc" | "desc";
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface StatusBadgeProps {
  status: "up" | "down" | "pending";
  size?: "sm" | "md" | "lg";
}
