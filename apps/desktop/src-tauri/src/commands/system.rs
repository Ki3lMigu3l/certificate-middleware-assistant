use tauri::command;
use crate::models::system_info::SystemInfo;

#[command]
pub fn get_system_info() -> SystemInfo {
    let info = os_info::get();
    SystemInfo {
        os: info.os_type().to_string(),
        os_version: info.version().to_string(),
        architecture: std::env::consts::ARCH.to_string(),
    }
}