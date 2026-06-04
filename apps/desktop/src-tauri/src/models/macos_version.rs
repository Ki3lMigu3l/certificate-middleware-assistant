use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacOsVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl MacOsVersion {
    pub fn is_supported(&self) -> bool {
        matches!(self.major, 10 | 11 | 12 | 13 | 14 | 15)
    }

    pub fn is_sonoma(&self) -> bool {
        self.major == 14
    }

    pub fn requires_ccid(&self) -> bool {
        self.major == 14 && self.minor == 0
    }
}