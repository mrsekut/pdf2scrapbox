use config::Config;
use files::{get_image_dirs, get_images, get_pdf_paths};
use futures::future;
use generate_page::generate_page;
use indicatif::{ProgressBar, ProgressStyle};
use pdfs_to_images::pdfs_to_images;
use render_page::{create_profile_page, save_json, Page, Project};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::{sync::Semaphore, task};

mod config;
mod files;
mod generate_page;
mod pdfs_to_images;
mod render_page;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Arc::new(Config::new()?);
    let pdf_paths = get_pdf_paths(&config.workspace_dir)?;

    let _ = pdfs_to_images(pdf_paths, &config.workspace_dir)
        .await
        .map_err(|e| eprintln!("Error: {e}"));

    let dirs = get_image_dirs(&config.workspace_dir)?;
    dirs_to_cosense(config.clone(), &dirs).await;

    Ok(())
}

async fn dirs_to_cosense(config: Arc<Config>, dir_paths: &[PathBuf]) {
    let tasks: Vec<_> = dir_paths
        .iter()
        .map(|dir| dir_to_cosense(config.clone(), dir))
        .collect();
    future::join_all(tasks).await;
}

async fn dir_to_cosense(
    config: Arc<Config>,
    dir_path: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let images = get_images(dir_path)?;
    let total_pages = images.len();

    let pb = ProgressBar::new(total_pages as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{msg} [{bar:40}] {pos}/{len} pages")
            .unwrap()
            .progress_chars("=> "),
    );
    pb.set_message(format!("Processing pages in {}", dir_path.display()));

    let semaphore = Arc::new(Semaphore::new(50));

    let tasks: Vec<_> = images
        .into_iter()
        .enumerate()
        .map(|(index, image)| {
            let config = Arc::clone(&config);
            let pb = pb.clone();
            let semaphore = Arc::clone(&semaphore);

            task::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                match generate_page(config, index, image.clone(), total_pages).await {
                    Ok(page) => {
                        pb.inc(1);
                        Some((index, page))
                    }
                    Err(_) => {
                        eprintln!("❌ Error on page {index + 1}/{total_pages}");
                        None
                    }
                }
            })
        })
        .collect();

    let pages: Vec<Page> = future::join_all(tasks)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .flatten()
        .map(|(_, page)| page)
        .collect();

    pb.finish_with_message(format!("✅ Finished processing {}", dir_path.display()));

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

    match save_json(&Path::new(&json_path), &project) {
        Ok(_) => println!("✅️Saved JSON to {json_path}"),
        Err(e) => eprintln!("Error: {e}"),
    };

    Ok(())
}
