use std::path::PathBuf;
mod pdfs_to_images;

use pdfs_to_images::pdfs_to_images;

#[tokio::main]
async fn main() {
    // TODO:
    let pdfs = vec![PathBuf::from("./workspace/aaa.pdf")];
    let out_dir = "./workspace";

    match pdfs_to_images(pdfs, out_dir).await {
        Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
        Err(e) => eprintln!("Error: {:?}", e),
    }
}
