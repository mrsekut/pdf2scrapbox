use dotenv::dotenv;
use futures::future;
use gyazo_api::{upload::GyazoUploadOptions, Gyazo};
use pdfs_to_images::pdfs_to_images;
use render_page::{create_profile_page, render_page, save_json, Page, Project};
use std::{
    fs,
    path::{Path, PathBuf},
    thread, time, vec,
};
use tokio::task;

mod pdfs_to_images;
mod render_page;

struct Config {
    wait_time_for_ocr: u64,
    workspace_dir: PathBuf,
    profile: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let config = Config {
        wait_time_for_ocr: 5000,
        workspace_dir: "./workspace".into(),
        profile: Some("mrsekut-merry-firends/mrsekut".to_string()),
    };

    // let pdf_paths = get_pdf_paths(&config.workspace_dir)?;
    // match pdfs_to_images(pdf_paths, &config.workspace_dir).await {
    //     Ok(paths) => println!("Converted PDFs saved to {:?}", paths),
    //     Err(e) => eprintln!("Error: {:?}", e),
    // };

    let dirs = get_image_dirs(&config.workspace_dir)?;
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
    let images = get_images(dir_path)?;
    let wait_time_for_ocr = config.wait_time_for_ocr.clone();
    let total_pages = images.len();

    let tasks: Vec<_> = images
        .into_iter()
        .enumerate()
        .map(|(index, image)| {
            task::spawn(async move {
                generate_page(index, image.clone(), total_pages, wait_time_for_ocr)
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

    let pages_with_profile = {
        if let Some(profile) = &config.profile {
            let profile = create_profile_page(profile).await?;
            std::iter::once(profile).chain(pages.into_iter()).collect()
        } else {
            pages
        }
    };

    let project = Project {
        pages: pages_with_profile,
    };
    let json_path = format!("{}-ocr.json", dir_path.display());
    save_json(&Path::new(&json_path), &project);
    Ok(())
}

// TODO: impl, clean
async fn generate_page(
    index: usize,
    pdf_path: PathBuf,
    page_num: usize,
    wait_time_for_ocr: u64,
) -> Result<Page, Box<dyn std::error::Error>> {
    let gyazo_token = std::env::var("GYAZO_TOKEN").expect("GYAZO_ACCESS_TOKEN must be set");
    let gyazo = Gyazo::new(gyazo_token);

    let options = GyazoUploadOptions {
        ..Default::default()
    };
    let gyazo_image_id = gyazo.upload(pdf_path, Some(&options)).await?.image_id;

    let five_sec = time::Duration::from_millis(wait_time_for_ocr);
    thread::sleep(five_sec);

    // TODO: retry
    let ocr_text = gyazo.image(&gyazo_image_id).await?.ocr.description;

    let page = render_page(index, page_num, &gyazo_image_id, &ocr_text);
    println!("done: {index}");

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
