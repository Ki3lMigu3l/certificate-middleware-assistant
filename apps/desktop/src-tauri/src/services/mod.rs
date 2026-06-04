#[derive(Debug, Clone)]
pub struct MacOsVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl MacOsVersion {
    pub fn is_sonoma_14_0(&self) -> bool {
        self.major == 14 && self.minor == 0
    }

    pub fn is_sonoma(&self) -> bool {
        self.major == 14
    }

    pub fn is_sequoia(&self) -> bool {
        self.major >= 15
    }
}