use dotenv::dotenv;
use files::{get_image_dirs, get_images, get_pdf_paths};
use futures::future;
use gyazo_api::{upload::GyazoUploadOptions, Gyazo};
use pdfs_to_images::pdfs_to_images;
use render_page::{create_profile_page, render_page, save_json, Page, Project};
use std::{
    path::{Path, PathBuf},
    time::Duration,
};
use tokio::{task, time::sleep};

mod files;
mod pdfs_to_images;
mod render_page;

#[derive(Clone)]
struct Config {
    wait_time_for_ocr: Duration,
    workspace_dir: PathBuf,
    profile: Option<String>,
}

impl Config {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            wait_time_for_ocr: Duration::from_millis(5000),
            workspace_dir: PathBuf::from("./workspace"),
            profile: Some("mrsekut-merry-firends/mrsekut".to_string()),
        })
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let config = Config::new()?;
    let pdf_paths = get_pdf_paths(&config.workspace_dir)?;

    match pdfs_to_images(pdf_paths, &config.workspace_dir).await {
        Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
        Err(e) => eprintln!("Error: {:?}", e),
    };

    let dirs = get_image_dirs(&config.workspace_dir)?;
    dirs_to_cosense(&config, &dirs).await;

    Ok(())
}

async fn dirs_to_cosense(config: &Config, dir_paths: &[PathBuf]) {
    let tasks: Vec<_> = dir_paths
        .iter()
        .map(|dir| dir_to_cosense(config, dir))
        .collect();
    future::join_all(tasks).await;
}

// TODO: clean, warning, cli, dos
async fn dir_to_cosense(
    config: &Config,
    dir_path: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let images = get_images(dir_path)?;
    let total_pages = images.len();

    let tasks: Vec<_> = images
        .into_iter()
        .enumerate()
        .map(|(index, image)| {
            let config = config.clone();
            task::spawn(async move {
                generate_page(&config, index, image.clone(), total_pages)
                    .await
                    .ok()
            })
        })
        .collect();

    let pages: Vec<Page> = future::join_all(tasks)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .flatten()
        .collect();

    let pages_with_profile = if let Some(profile) = &config.profile {
        let profile = create_profile_page(profile).await?;
        std::iter::once(profile).chain(pages.into_iter()).collect()
    } else {
        pages
    };

    let project = Project {
        pages: pages_with_profile,
    };
    let json_path = format!("{}-ocr.json", dir_path.display());
    save_json(&Path::new(&json_path), &project);
    Ok(())
}

// TODO: retry?
async fn generate_page(
    config: &Config,
    index: usize,
    pdf_path: PathBuf,
    page_num: usize,
) -> Result<Page, Box<dyn std::error::Error>> {
    let options = GyazoUploadOptions::default();
    let gyazo_token = std::env::var("GYAZO_TOKEN").expect("GYAZO_ACCESS_TOKEN must be set");
    let gyazo = Gyazo::new(gyazo_token);
    let gyazo_image_id = gyazo.upload(pdf_path, Some(&options)).await?.image_id;

    sleep(config.wait_time_for_ocr).await;

    let ocr_text = gyazo.image(&gyazo_image_id).await?.ocr.description;
    let page = render_page(index, page_num, &gyazo_image_id, &ocr_text);

    println!("Processed page: {index}");
    Ok(page)
}
