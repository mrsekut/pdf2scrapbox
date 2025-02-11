use std::{fs, path::PathBuf};
mod pdfs_to_images;

use futures::join;
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

    // let pdf_paths = get_pdf_paths(&config.workspace_dir)?;
    // match pdfs_to_images(pdf_paths, &config.workspace_dir).await {
    //     Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
    //     Err(e) => eprintln!("Error: {:?}", e),
    // };

    let dirs = get_image_dirs(&config.workspace_dir)?;
    dbg!(&dirs);
    dirs_to_cosense(&config, &dirs).await;

    Ok(())
}

async fn dirs_to_cosense(config: &Config, dir_paths: &[PathBuf]) {
    for dir_path in dir_paths {
        if let Err(e) = dir_to_cosense(config, dir_path).await {
            eprintln!("Error processing {:?}: {:?}", dir_path, e);
        }
    }
}

async fn dir_to_cosense(
    config: &Config,
    dir_path: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    // ) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let images = get_images(dir_path);
    dbg!(images);
    Ok(())
    // let mut pages = Vec::new();

    // for (index, image) in images.iter().enumerate() {
    //     match generate_page(image.clone(), index, dir_path.to_str().unwrap()).await {
    //         Ok(page) => pages.push(page),
    //         Err(e) => eprintln!("Error processing image {:?}: {:?}", image, e),
    //     }
    // }

    // if let Some(profile) = &config.profile {
    //     let profile_page = create_profile_page(profile).await;
    //     pages.push(profile_page);
    // }

    // save_json(&format!("{}-ocr.json", dir_path.display()), &pages).await;
    // Ok(pages)
}

// async fn generate_page(
//     pdf_path: PathBuf,
//     page_num: usize,
//     out_dir: &str,
// ) -> Result<PathBuf, Box<dyn std::error::Error>> {
//     dbg!("aaaaaaa");
//     Ok(())
//     // let gyazo_image_id = gyazo_upload(path).await;
//     // sleep(Duration::from_millis(config.wait_time_for_ocr)).await;
//     // let ocr_text = get_gyazo_ocr(&gyazo_image_id).await;
//     // render_page(index, page_length, &gyazo_image_id, &ocr_text)
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

fn get_images(path: &PathBuf) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let paths = fs::read_dir(path)?
        .filter_map(|entry| {
            let path = entry.ok()?.path();

            if path.extension()?.eq_ignore_ascii_case("png") {
                Some(path)
            } else {
                None
            }
        })
        .collect::<Vec<PathBuf>>();

    Ok(paths)
}
