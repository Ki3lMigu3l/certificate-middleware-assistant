use sha2::{Digest, Sha256};

pub fn calculate_sha256(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();

    hasher.update(bytes);

    hex::encode(hasher.finalize())
}

pub fn validate_sha256(
    bytes: &[u8],
    expected_sha: &str,
) -> bool {
    let actual_sha = calculate_sha256(bytes);

    actual_sha == normalize_sha(expected_sha)
}

pub fn normalize_sha(input: &str) -> String {
    input
        .split_whitespace()
        .next()
        .unwrap_or("")
        .trim()
        .to_lowercase()
}