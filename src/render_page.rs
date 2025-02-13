use indoc::formatdoc;
use serde::{Deserialize, Serialize};
use std::fs::write;

#[derive(Serialize, Deserialize)]
pub struct Project {
    pub pages: Vec<Page>,
}

#[derive(Serialize, Deserialize)]
pub struct Page {
    title: String,
    lines: Vec<String>,
}

#[derive(Debug, Clone, Copy)]
struct PageNum {
    prev: usize,
    next: usize,
}

pub fn save_json(file_path: &str, project: &Project) -> Result<(), Box<dyn std::error::Error>> {
    let json_str = serde_json::to_string_pretty(project)?;
    write(file_path, json_str)?;
    Ok(())
}

pub fn render_page(
    index: usize,
    total_page_count: usize,
    gyazo_image_id: &str,
    ocr_text: &str,
) -> Page {
    let pad_length = format!("{}", total_page_count).len();

    let title = format!("{:0pad_length$}", index);
    let PageNum { prev, next } = page_num(index);
    let url = format!("https://gyazo.com/{}", gyazo_image_id);
    let ocr_lines = ocr_text
        .lines()
        .map(|line| format!("> {}", line))
        .collect::<Vec<_>>()
        .join("\n");

    let content = formatdoc! {"
        {title}
        prev: [{prev:0pad_length$}]
        next: [{next:0pad_length$}]
        [[{url}]]

        {ocr_lines}"
    };

    Page {
        title,
        lines: content.lines().map(|s| s.to_string()).collect(),
    }
}

fn page_num(current: usize) -> PageNum {
    PageNum {
        prev: if current == 0 { current } else { current - 1 },
        next: current + 1,
    }
}
