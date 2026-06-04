use std::path::Path;

use reqwest::Client;

use crate::errors::app_error::AppError;

pub async fn download_file(
    url: &str,
    destination: &Path,
) -> Result<Vec<u8>, AppError> {
    let client = Client::new();

    let response = client
        .get(url)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(AppError::DownloadFailed);
    }

    let bytes = response.bytes().await?;

    std::fs::write(destination, &bytes)?;

    Ok(bytes.to_vec())
}

pub async fn download_text(
    url: &str,
) -> Result<String, AppError> {
    let client = Client::new();

    let response = client
        .get(url)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(AppError::DownloadFailed);
    }

    Ok(response.text().await?)
}