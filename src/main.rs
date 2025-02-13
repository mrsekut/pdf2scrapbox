use std::{
    fs,
    path::{Path, PathBuf},
};
mod pdfs_to_images;
mod render_page;

use futures::join;
use pdfs_to_images::pdfs_to_images;
use render_page::{render_page, save_json, Page, Project};

struct Config {
    wait_time_for_ocr: u64,
    workspace_dir: PathBuf,
    profile: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        wait_time_for_ocr: 10000,
        workspace_dir: "./workspace".into(),
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

// TODO: clean
async fn dir_to_cosense(
    config: &Config,
    dir_path: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let images = get_images(dir_path)?;
    let mut pages = Vec::new();

    for (index, image) in images.iter().enumerate() {
        match generate_page(image.clone(), index, dir_path.to_str().unwrap()).await {
            Ok(page) => pages.push(page),
            Err(e) => eprintln!("Error processing image {:?}: {:?}", image, e),
        }
    }

    let project = Project { pages };

    // if let Some(profile) = &config.profile {
    //     let profile_page = create_profile_page(profile).await;
    //     pages.push(profile_page);
    // }

    let json_path = format!("{}-ocr.json", dir_path.display());
    save_json(&Path::new(&json_path), &project);
    Ok(())
}

// TODO: impl
async fn generate_page(
    pdf_path: PathBuf,
    page_num: usize,
    out_dir: &str,
) -> Result<Page, Box<dyn std::error::Error>> {
    // let gyazo_image_id = gyazo_upload(path).await;
    let gyazo_image_id = "b920f739470f378e44a765ee371eeb9c";

    // sleep(Duration::from_millis(config.wait_time_for_ocr)).await;

    // let ocr_text = get_gyazo_ocr(&gyazo_image_id).await;
    let ocr_text = "aaaaaaaaaaaaaaaaaaa\nbbbbbbbbbbbbbbbbbbb\nccccccccccccccccccc";

    let page = render_page(5, 100, &gyazo_image_id, ocr_text);

    Ok(page)
}

// TODO: move
fn get_pdf_paths(path: &PathBuf) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
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
fn get_image_dirs(path: &PathBuf) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
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

// TODO: move
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
