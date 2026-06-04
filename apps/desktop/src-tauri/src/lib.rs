pub mod commands;
pub mod config;
pub mod errors;
pub mod models;
pub mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(
            tauri::generate_handler![
                commands::system::get_system_info,
                commands::driver::download_and_install_driver,
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}