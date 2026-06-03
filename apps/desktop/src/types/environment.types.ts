export type DetectionState = "idle" | "detecting" | "completed" | "error";

export type StatusType =
  | "pending"
  | "running"
  | "success"
  | "warning"
  | "error";

export type Architecture = "x86_64" | "arm64" | "unknown";

export type TokenStatus = "Not Detected" | "SafeNet 5100" | "SafeNet 5110";

export interface EnvironmentInfo {
  /**
   * Exemplo: macOS 15.5
   */
  os: string;

  /**
   * Exemplo: arm64 | x86_64
   */
  architecture: Architecture | string;

  /**
   * Temporariamente mantido como string
   * para não quebrar a implementação atual.
   *
   * Futuramente será substituído
   * por um objeto TokenInfo.
   */
  token: TokenStatus | string;
}

export interface EnvironmentCheck {
  id: string;
  label: string;
  status: StatusType;
  details?: string;
}
