use futures::future::join_all;
use std::path::{Path, PathBuf};
use std::process::Command;
use tokio::fs;

/// Receives a list of PDFs and outputs images
pub async fn pdfs_to_images(
    pdfs: Vec<PathBuf>,
    out_dir: &Path,
) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let tasks: Vec<_> = pdfs.iter().map(|pdf| pdf_to_images(pdf, out_dir)).collect();
    let results = join_all(tasks).await;
    let paths: Vec<_> = results.into_iter().collect::<Result<Vec<_>, _>>()?;
    Ok(paths)
}

/// Converts a PDF to images and saves them
async fn pdf_to_images(pdf: &Path, out_dir: &Path) -> Result<PathBuf, Box<dyn std::error::Error>> {
    println!("pdf→images: start {:?}", pdf);

    let filename = pdf.file_stem().unwrap().to_string_lossy().into_owned();
    let out_path = Path::new(&out_dir).join(&filename);
    fs::create_dir_all(&out_path).await?;

    convert_and_save(&pdf, &out_path).await?;

    println!("pdf→images: end {:?}", pdf);
    Ok(out_path)
}

/// Converts a PDF to images using MuPDF's `mutool convert`
async fn convert_and_save(
    pdf_path: &Path,
    out_path: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let status = Command::new("mutool")
        .arg("convert")
        // Output format
        .arg("-F")
        .arg("png")
        // DPI
        .arg("-O")
        .arg("resolution=600,gamma=1")
        // Output file name (0.png,1.png...)
        .arg("-o")
        .arg(out_path.join("%d.png").to_string_lossy().into_owned())
        // PDF file
        .arg(pdf_path)
        .status()?;

    if !status.success() {
        return Err("MuPDF convert failed".into());
    }

    Ok(())
}
