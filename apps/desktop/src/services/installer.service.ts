import { invoke } from "@tauri-apps/api/core";

export async function installDriver(architecture: string): Promise<void> {
  return invoke("download_and_install_driver", {
    arch: architecture,
  });
}
