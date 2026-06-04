use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Falha ao baixar arquivo")]
    DownloadFailed,

    #[error("Falha na validação SHA256")]
    InvalidChecksum,

    #[error("Falha durante a instalação")]
    InstallationFailed,

    #[error("Versão do macOS não suportada")]
    UnsupportedMacOsVersion,

    #[error("Arquitetura não suportada")]
    UnsupportedArchitecture,

    #[error("Arquivo não encontrado")]
    FileNotFound,

    #[error("Erro de IO: {0}")]
    Io(String),

    #[error("Erro de rede: {0}")]
    Network(String),

    #[error("{0}")]
    Internal(String),
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(error: reqwest::Error) -> Self {
        Self::Network(error.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        Self::Internal(error.to_string())
    }
}