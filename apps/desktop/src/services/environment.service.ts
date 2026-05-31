import { invoke } from "@tauri-apps/api/core";

export interface SystemInfo {
  os: string;
  osVersion: string;
  architecture: string;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return await invoke<SystemInfo>("get_system_info");
}
