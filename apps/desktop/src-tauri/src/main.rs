#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::system::get_system_info,
            commands::driver::download_and_install_driver
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o aplicativo");
}