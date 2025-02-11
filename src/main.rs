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

    let pdf_paths = get_pdf_paths(&config.workspace_dir)?;
    match pdfs_to_images(pdf_paths, &config.workspace_dir).await {
        Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
        Err(e) => eprintln!("Error: {:?}", e),
    };

    let dirs = get_image_dirs(&config.workspace_dir)?;
    // dirs_to_cosense(&config, &dirs).await;

    Ok(())
}

// async fn dirs_to_cosense(config: &Config, dir_paths: &[PathBuf]) {
//     dir_paths.iter().for_each(|dir_path| {
//         dir_to_cosense(config, dir_path);
//     });
// }

// async fn dir_to_cosense(
//     config: &Config,
//     dir_path: &PathBuf,
// ) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
//     // loop: generate_pages
// }

// async fn generate_pages(// TODO:
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
//     let gyazo_image_id = gyazo_upload(path).await;
//     sleep(Duration::from_millis(config.wait_time_for_ocr)).await;
//     let ocr_text = get_gyazo_ocr(&gyazo_image_id).await;
//     render_page(index, page_length, &gyazo_image_id, &ocr_text)
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

// TODO: move
fn get_image_dirs(path: &str) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let paths = fs::read_dir(path)?
        .filter_map(|entry| {
            let path = entry.ok()?.path();

            if path.is_dir() {
                Some(path)
            } else {
                None
            }
        })
        .collect::<Vec<PathBuf>>();

    Ok(paths)
}
