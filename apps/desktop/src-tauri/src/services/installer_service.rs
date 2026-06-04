use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct InstallProgress {
    pub step: String,
    pub message: String,
}

impl InstallProgress {
    pub fn downloading(message: &str) -> Self {
        Self {
            step: "downloading".into(),
            message: message.into(),
        }
    }

    pub fn verifying(message: &str) -> Self {
        Self {
            step: "verifying".into(),
            message: message.into(),
        }
    }

    pub fn installing(message: &str) -> Self {
        Self {
            step: "installing".into(),
            message: message.into(),
        }
    }

    pub fn completed(message: &str) -> Self {
        Self {
            step: "completed".into(),
            message: message.into(),
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            step: "error".into(),
            message: message.into(),
        }
    }
}