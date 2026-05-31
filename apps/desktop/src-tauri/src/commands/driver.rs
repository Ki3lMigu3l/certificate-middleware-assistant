use tauri::Emitter;
use sha2::{Sha256, Digest};
use std::path::PathBuf;
use std::process::Command;

const RAW_BASE: &str =
    "https://raw.githubusercontent.com/Ki3lMigu3l/macos-certificate-middleware-assistant/main";

fn raw_url(relative_path: &str) -> String {
    let encoded = relative_path
        .replace(" ", "%20")
        .replace("+", "%2B");
    format!("{}/{}", RAW_BASE, encoded)
}

#[tauri::command]
pub async fn download_and_install_driver(
    arch: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    println!("[INFO] Instalação solicitada para arch: {}", arch);

    // ==================== WINDOWS ====================
    #[cfg(target_os = "windows")]
    {
        let exe_name = if arch == "x86_64" {
            "certisign10.6-x64-10.6.exe"
        } else {
            "certisign10.6-x32-10.6.exe"
        };

        let relative_path = format!("drivers/windows/Token 5100+/{}", exe_name);
        let url_exe = raw_url(&relative_path);
        let url_sha = raw_url(&format!("{}.sha256", relative_path));

        let temp_dir = std::env::temp_dir().join("cert_middleware");
        std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
        let exe_path = temp_dir.join(exe_name);

        let client = reqwest::Client::new();

        // Download
        app_handle.emit("install-progress", serde_json::json!({"step": "downloading", "message": "Baixando driver..."}))
            .map_err(|e| e.to_string())?;
        let response = client.get(&url_exe).send().await.map_err(|e| format!("Erro ao baixar driver: {}", e))?;
        if !response.status().is_success() {
            return Err(format!("Falha no download (HTTP {})", response.status()));
        }
        let bytes = response.bytes().await.map_err(|e| format!("Erro ao ler dados: {}", e))?;
        std::fs::write(&exe_path, &bytes).map_err(|e| format!("Erro ao salvar arquivo: {}", e))?;

        // Verificação SHA256
        app_handle.emit("install-progress", serde_json::json!({"step": "verifying", "message": "Verificando integridade..."}))
            .map_err(|e| e.to_string())?;
        let expected_sha = client.get(&url_sha).send().await.map_err(|e| format!("Erro ao baixar checksum: {}", e))?
            .text().await.map_err(|e| format!("Erro ao ler checksum: {}", e))?;
        let expected_sha = expected_sha.trim().to_lowercase();

        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let actual_sha = hex::encode(hasher.finalize());

        if actual_sha != expected_sha {
            let _ = std::fs::remove_file(&exe_path);
            return Err(format!("Checksum inválido.\nEsperado: {}\nObtido: {}", expected_sha, actual_sha));
        }

        // Instalação
        app_handle.emit("install-progress", serde_json::json!({"step": "installing", "message": "Instalando driver..."}))
            .map_err(|e| e.to_string())?;
        let output = std::process::Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(format!(
                r#"$ErrorActionPreference = 'Stop'
try {{
    $proc = Start-Process -FilePath '{}' -Verb RunAs -Wait -PassThru
    if ($null -eq $proc) {{
        throw "Instalação cancelada pelo utilizador (UAC negado)."
    }}
    exit $proc.ExitCode
}} catch {{
    Write-Error $_.Exception.Message
    exit 1
}}"#,
                exe_path.display()
            ))
            .output()
            .map_err(|e| format!("Erro ao executar instalador: {}", e))?;
        let exit_code = output.status.code().unwrap_or(1);
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stderr.is_empty() {
            return Err(format!("Erro: {}", stderr.trim()));
        }
        if exit_code != 0 {
            return Err(format!("Instalação falhou ou foi cancelada (código {}).", exit_code));
        }
        let _ = std::fs::remove_file(&exe_path);
        app_handle.emit("install-progress", serde_json::json!({"step": "completed", "message": "Driver instalado com sucesso!"}))
            .map_err(|e| e.to_string())?;
        return Ok("Driver instalado com sucesso!".to_string());
    }

    // ==================== macOS ====================
    #[cfg(target_os = "macos")]
    {
        let major_version = get_macos_major_version().await?;
        let subdir = get_dmg_subdir(major_version, &arch)?;
        let dmg_filename = get_dmg_filename_from_repo(&subdir).await?;
        let relative_path = format!("drivers/macos/Token 5100+/{}/{}", subdir, dmg_filename);
        let url_dmg = raw_url(&relative_path);
        let url_sha = raw_url(&format!("{}.sha256", relative_path));

        let temp_dir = std::env::temp_dir().join("cert_middleware");
        std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
        let dmg_path = temp_dir.join(&dmg_filename);

        let client = reqwest::Client::new();

        // Download DMG
        app_handle.emit("install-progress", serde_json::json!({"step": "downloading", "message": "Baixando driver macOS..."}))
            .map_err(|e| e.to_string())?;
        let response = client.get(&url_dmg).send().await.map_err(|e| format!("Erro ao baixar DMG: {}", e))?;
        if !response.status().is_success() {
            return Err(format!("Falha no download (HTTP {})", response.status()));
        }
        let bytes = response.bytes().await.map_err(|e| format!("Erro ao ler dados: {}", e))?;
        std::fs::write(&dmg_path, &bytes).map_err(|e| format!("Erro ao salvar DMG: {}", e))?;

        // Verificação SHA256
        app_handle.emit("install-progress", serde_json::json!({"step": "verifying", "message": "Verificando integridade..."}))
            .map_err(|e| e.to_string())?;
        let expected_sha = client.get(&url_sha).send().await.map_err(|e| format!("Erro ao baixar checksum: {}", e))?
            .text().await.map_err(|e| format!("Erro ao ler checksum: {}", e))?;
        let expected_sha = expected_sha.trim().to_lowercase();

        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let actual_sha = hex::encode(hasher.finalize());

        if actual_sha != expected_sha {
            let _ = std::fs::remove_file(&dmg_path);
            return Err(format!("Checksum inválido.\nEsperado: {}\nObtido: {}", expected_sha, actual_sha));
        }

        // Instalação
        app_handle.emit("install-progress", serde_json::json!({"step": "installing", "message": "Instalando driver (pode pedir sua senha)..."}))
            .map_err(|e| e.to_string())?;
        install_dmg(&dmg_path).await?;
        let _ = std::fs::remove_file(&dmg_path);
        app_handle.emit("install-progress", serde_json::json!({"step": "completed", "message": "Driver instalado com sucesso!"}))
            .map_err(|e| e.to_string())?;
        return Ok("Driver instalado com sucesso!".to_string());
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    Err("Sistema operacional não suportado".into())
}

// ==================== FUNÇÕES AUXILIARES PARA macOS ====================
#[cfg(target_os = "macos")]
async fn get_macos_major_version() -> Result<u32, String> {
    let output = Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .map_err(|e| format!("Falha ao obter versão do macOS: {}", e))?;
    let version_str = String::from_utf8_lossy(&output.stdout);
    let parts: Vec<&str> = version_str.trim().split('.').collect();
    let major = parts.first().unwrap_or(&"0").parse::<u32>().unwrap_or(0);
    if major == 0 {
        return Err("Não foi possível determinar a versão do macOS".to_string());
    }
    Ok(major)
}

#[cfg(target_os = "macos")]
fn get_dmg_subdir(major_version: u32, arch: &str) -> Result<String, String> {
    match (major_version, arch) {
        (10, _) => Ok("version-10-intel".to_string()),
        (11, "x86_64") => Ok("version-11-intel".to_string()),
        (11, "aarch64") => Ok("version-11-15-intel-and-apple-silicon".to_string()),
        (12..=13, _) => Ok("version-12-13-intel-and-apple-silicon".to_string()),
        (14, _) => Ok("version-14".to_string()),
        (15, _) => Ok("version-11-15-intel-and-apple-silicon".to_string()), // fallback
        _ => Err(format!("macOS versão {} não suportada", major_version)),
    }
}

#[cfg(target_os = "macos")]
async fn get_dmg_filename_from_repo(subdir: &str) -> Result<String, String> {
    let encoded_subdir = subdir.replace(" ", "%20").replace("+", "%2B");
    let api_url = format!(
        "https://api.github.com/repos/Ki3lMigu3l/macos-certificate-middleware-assistant/contents/drivers/macos/Token%205100%2B/{}",
        encoded_subdir
    );
    let client = reqwest::Client::new();
    let response = client
        .get(&api_url)
        .header("User-Agent", "Tauri-App")
        .send()
        .await
        .map_err(|e| format!("Erro ao consultar API do GitHub: {}", e))?;
    if !response.status().is_success() {
        return Err(format!("Falha ao listar diretório (HTTP {})", response.status()));
    }
    let contents: Vec<serde_json::Value> = response
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta da API: {}", e))?;
    let mut dmg_files: Vec<String> = Vec::new();
    for item in contents {
        if let Some(name) = item.get("name").and_then(|n| n.as_str()) {
            if name.to_lowercase().ends_with(".dmg") {
                dmg_files.push(name.to_string());
            }
        }
    }
    if dmg_files.is_empty() {
        return Err("Nenhum arquivo .dmg encontrado no diretório".to_string());
    }
    // Prioriza o que NÃO contém "core" nem "nonctk" (case insensitive)
    let preferred = dmg_files.iter().find(|name| {
        let lower = name.to_lowercase();
        !lower.contains("core") && !lower.contains("nonctk")
    });
    if let Some(found) = preferred {
        Ok(found.clone())
    } else {
        Ok(dmg_files[0].clone())
    }
}

#[cfg(target_os = "macos")]
async fn install_dmg(dmg_path: &std::path::Path) -> Result<(), String> {
    let mount_point = "/Volumes/Token5100Installer";
    let attach_output = Command::new("hdiutil")
        .args(["attach", dmg_path.to_str().unwrap(), "-mountpoint", mount_point])
        .output()
        .map_err(|e| format!("Falha ao montar DMG: {}", e))?;
    if !attach_output.status.success() {
        let stderr = String::from_utf8_lossy(&attach_output.stderr);
        return Err(format!("Erro ao montar DMG: {}", stderr));
    }

    // Procurar por .pkg ou .app dentro do volume
    let volume_path = std::path::Path::new(mount_point);
    let pkg_entries: Vec<PathBuf> = std::fs::read_dir(volume_path)
        .map_err(|e| format!("Erro ao ler volume montado: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().extension().and_then(|e| e.to_str()) == Some("pkg"))
        .map(|entry| entry.path())
        .collect();

    let result = if !pkg_entries.is_empty() {
        let pkg_path = &pkg_entries[0];
        let script = format!(
            "do shell script \"installer -pkg '{}' -target /\" with administrator privileges",
            pkg_path.display()
        );
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Erro ao executar installer: {}", e))?;
        output.status.success()
    } else {
        // Tentar copiar .app
        let app_entries: Vec<PathBuf> = std::fs::read_dir(volume_path)
            .map_err(|e| format!("Erro ao ler volume: {}", e))?
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.path().extension().and_then(|e| e.to_str()) == Some("app"))
            .map(|entry| entry.path())
            .collect();
        if let Some(app_path) = app_entries.first() {
            let app_name = app_path.file_name().unwrap().to_str().unwrap();
            let target_path = std::path::Path::new("/Applications").join(app_name);
            let script = format!(
                "do shell script \"cp -R '{}' '{}'\" with administrator privileges",
                app_path.display(),
                target_path.display()
            );
            let output = Command::new("osascript")
                .arg("-e")
                .arg(&script)
                .output()
                .map_err(|e| format!("Erro ao copiar app: {}", e))?;
            output.status.success()
        } else {
            let _ = Command::new("hdiutil").args(["detach", mount_point]).output();
            return Err("Nenhum instalador (.pkg ou .app) encontrado dentro do DMG".to_string());
        }
    };

    let _ = Command::new("hdiutil").args(["detach", mount_point]).output();

    if result {
        Ok(())
    } else {
        Err("Instalação cancelada ou falhou".to_string())
    }
}