use tauri::command;

use crate::models::system_info::SystemInfo;

fn normalize_architecture(arch: &str) -> String {
    match arch.to_lowercase().as_str() {
        "aarch64" | "arm64" => "arm64".to_string(),

        "amd64" | "x64" | "x86_64" => {
            "x86_64".to_string()
        }

        "x86" | "i386" | "i686" => {
            "x86".to_string()
        }

        other => other.to_string(),
    }
}

#[command]
pub fn get_system_info() -> SystemInfo {
    let info = os_info::get();

    SystemInfo {
        os: info.os_type().to_string(),
        os_version: info.version().to_string(),
        architecture: normalize_architecture(
            std::env::consts::ARCH,
        ),
    }
}