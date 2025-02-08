use std::{fs, path::PathBuf};
mod pdfs_to_images;

use pdfs_to_images::pdfs_to_images;

struct Config {
    wait_time_for_ocr: u64,
    workspace_dir: String,
    profile: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        wait_time_for_ocr: 10000,
        workspace_dir: "./workspace".to_string(),
        profile: Some("mrsekut-merry-firends/mrsekut".to_string()),
    };

    let pdfs = get_pdf_paths(&config.workspace_dir)?;

    match pdfs_to_images(pdfs, &config.workspace_dir).await {
        Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
        Err(e) => eprintln!("Error: {:?}", e),
    };

    // match generate_pages_for_all(pdfs, out_dir).await {
    //     Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
    //     Err(e) => eprintln!("Error: {:?}", e),
    // };

    Ok(())
}

// // TODO: name
// async fn generate_pages_for_all(
//     pdfs: Vec<PathBuf>,
//     out_dir: &str,
// ) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
//     // loop: generate_pages
// }

// async fn generate_pages(
//     pdf_path: PathBuf,
//     out_dir: &str,
// ) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
//     // dirから画像のリストを取得
//     // loop: generate_pageを呼び出す
//     // inject profile page
//     // save json
// }

// async fn generate_page(
//     pdf_path: PathBuf,
//     page_num: usize,
//     out_dir: &str,
// ) -> Result<PathBuf, Box<dyn std::error::Error>> {
//     // upload to gyazo
//     // sleep
//     // get ocr
//     // render page
// }

// TODO: move
fn get_pdf_paths(path: &str) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let paths = fs::read_dir(path)?
        .filter_map(|entry| {
            let path = entry.ok()?.path();

            if path.extension()?.eq_ignore_ascii_case("pdf") {
                Some(path)
            } else {
                None
            }
        })
        .collect::<Vec<PathBuf>>();

    Ok(paths)
}
