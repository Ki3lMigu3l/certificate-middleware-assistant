import { TAURI_COMMANDS } from "@/shared/constants/tauri-commands";
import { SystemInfo } from "@/types/system.types";
import { invoke } from "@tauri-apps/api/core";

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    return await invoke<SystemInfo>(TAURI_COMMANDS.GET_SYSTEM_INFO);
  } catch (error) {
    throw new Error("Unable to retrieve system information.");
  }
}
