export type DetectionState = "idle" | "detecting" | "completed" | "error";

export interface EnvironmentInfo {
  os: string;
  osVersion: string;
  architecture: string;

  tokenDetected: boolean;
  tokenModel?: string;

  driverInstalled: boolean;
  driverVersion?: string;

  pjeOfficeInstalled: boolean;
  pjeOfficeVersion?: string;
}

export type StatusType =
  | "pending"
  | "running"
  | "success"
  | "warning"
  | "error";

export interface EnvironmentCheck {
  id: string;
  label: string;
  status: StatusType;
  details?: string;
}
