use serde_json::Value;
use std::path::PathBuf;
use tauri_plugin_updater::UpdaterExt;

// Application configuration directory
const APP_CONFIG_DIR: &str = ".ccconfig";

pub async fn initialize_app_config() -> Result<(), String> {
    println!("initialize_app_config called");

    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);

    println!(
        "Checking if app config directory exists: {}",
        app_config_path.display()
    );

    // Create config directory if it doesn't exist
    if !app_config_path.exists() {
        println!("App config directory does not exist, creating...");
        std::fs::create_dir_all(&app_config_path)
            .map_err(|e| format!("Failed to create app config directory: {}", e))?;
        println!(
            "App config directory created: {}",
            app_config_path.display()
        );
    } else {
        println!("App config directory already exists");
    }

    // Check if we need to backup Claude configs
    let claude_dir = home_dir.join(".claude");
    println!(
        "Checking if Claude directory exists: {}",
        claude_dir.display()
    );

    if claude_dir.exists() {
        // Check if we already have a backup
        let backup_dir = app_config_path.join("claude_backup");
        if backup_dir.exists() {
            println!("Claude backup already exists, skipping backup");
        } else {
            println!("Claude directory exists but no backup found, backing up...");
            if let Err(e) = backup_claude_configs_internal(&app_config_path, &claude_dir) {
                return Err(format!("Failed to backup Claude configs: {}", e));
            }
            println!("Claude configs backed up successfully");
        }
    } else {
        println!("Claude directory does not exist, skipping backup");
    }

    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ConfigFile {
    pub path: String,
    pub content: Value,
    pub exists: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ConfigStore {
    pub id: String,
    pub title: String,
    pub createdAt: u64,
    pub settings: Value,
    pub using: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct StoresData {
    pub configs: Vec<ConfigStore>,
}

#[tauri::command]
pub async fn read_config_file(config_type: String) -> Result<ConfigFile, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;

    let path = match config_type.as_str() {
        "user" => home_dir.join(".claude/settings.json"),
        "enterprise_macos" => {
            PathBuf::from("/Library/Application Support/ClaudeCode/managed-settings.json")
        }
        "enterprise_linux" => PathBuf::from("/etc/claude-code/managed-settings.json"),
        "enterprise_windows" => PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-settings.json"),
        "mcp_macos" => PathBuf::from("/Library/Application Support/ClaudeCode/managed-mcp.json"),
        "mcp_linux" => PathBuf::from("/etc/claude-code/managed-mcp.json"),
        "mcp_windows" => PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-mcp.json"),
        _ => return Err("Invalid configuration type".to_string()),
    };

    let path_str = path.to_string_lossy().to_string();

    if path.exists() {
        let content =
            std::fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

        let json_content: Value =
            serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(ConfigFile {
            path: path_str,
            content: json_content,
            exists: true,
        })
    } else {
        Ok(ConfigFile {
            path: path_str,
            content: Value::Object(serde_json::Map::new()),
            exists: false,
        })
    }
}

#[tauri::command]
pub async fn write_config_file(config_type: String, content: Value) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;

    let path = match config_type.as_str() {
        "user" => home_dir.join(".claude/settings.json"),
        _ => return Err("Cannot write to enterprise configuration files".to_string()),
    };

    let json_content = serde_json::to_string_pretty(&content)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;

    std::fs::write(&path, json_content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn list_config_files() -> Result<Vec<String>, String> {
    let mut configs = vec![];

    // User settings
    if let Some(home) = dirs::home_dir() {
        let user_settings = home.join(".claude/settings.json");
        if user_settings.exists() {
            configs.push("user".to_string());
        }
    }

    // Enterprise settings (read-only)
    if cfg!(target_os = "macos") {
        let enterprise_path =
            PathBuf::from("/Library/Application Support/ClaudeCode/managed-settings.json");
        if enterprise_path.exists() {
            configs.push("enterprise_macos".to_string());
        }

        let mcp_path = PathBuf::from("/Library/Application Support/ClaudeCode/managed-mcp.json");
        if mcp_path.exists() {
            configs.push("mcp_macos".to_string());
        }
    } else if cfg!(target_os = "linux") {
        let enterprise_path = PathBuf::from("/etc/claude-code/managed-settings.json");
        if enterprise_path.exists() {
            configs.push("enterprise_linux".to_string());
        }

        let mcp_path = PathBuf::from("/etc/claude-code/managed-mcp.json");
        if mcp_path.exists() {
            configs.push("mcp_linux".to_string());
        }
    } else if cfg!(target_os = "windows") {
        let enterprise_path = PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-settings.json");
        if enterprise_path.exists() {
            configs.push("enterprise_windows".to_string());
        }

        let mcp_path = PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-mcp.json");
        if mcp_path.exists() {
            configs.push("mcp_windows".to_string());
        }
    }

    Ok(configs)
}

#[tauri::command]
pub async fn check_app_config_exists() -> Result<bool, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    Ok(app_config_path.exists())
}

#[tauri::command]
pub async fn create_app_config_dir() -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);

    std::fs::create_dir_all(&app_config_path)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    Ok(())
}

fn backup_claude_configs_internal(
    app_config_path: &std::path::Path,
    claude_dir: &std::path::Path,
) -> Result<(), String> {
    // Create backup directory
    let backup_dir = app_config_path.join("claude_backup");

    std::fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    // Copy all files from .claude directory to backup
    for entry in std::fs::read_dir(claude_dir)
        .map_err(|e| format!("Failed to read Claude directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let source_path = entry.path();
        let file_name = source_path.file_name().ok_or("Invalid file name")?;
        let dest_path = backup_dir.join(file_name);

        if source_path.is_file() {
            std::fs::copy(&source_path, &dest_path)
                .map_err(|e| format!("Failed to copy file {}: {}", source_path.display(), e))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn backup_claude_configs() -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let claude_dir = home_dir.join(".claude");
    let app_config_path = home_dir.join(APP_CONFIG_DIR);

    if !claude_dir.exists() {
        return Err("Claude configuration directory does not exist".to_string());
    }

    // Ensure app config directory exists
    std::fs::create_dir_all(&app_config_path)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    backup_claude_configs_internal(&app_config_path, &claude_dir)
}

// Store management functions

#[tauri::command]
pub async fn get_stores() -> Result<Vec<ConfigStore>, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        // Check if there's an existing ~/.claude/settings.json
        let claude_settings_path = home_dir.join(".claude/settings.json");

        if claude_settings_path.exists() {
            // Read existing settings
            let settings_content = std::fs::read_to_string(&claude_settings_path)
                .map_err(|e| format!("Failed to read existing Claude settings: {}", e))?;

            let settings_json: Value = serde_json::from_str(&settings_content)
                .map_err(|e| format!("Failed to parse existing Claude settings: {}", e))?;

            // Create a default store named "原有配置" with existing settings
            let default_store = ConfigStore {
                id: nanoid::nanoid!(6), // Generate a 6-character ID
                title: "原有配置".to_string(),
                createdAt: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| format!("Failed to get timestamp: {}", e))?
                    .as_secs(),
                settings: settings_json,
                using: true, // Set as the active store by default
            };

            // Ensure app config directory exists
            std::fs::create_dir_all(&app_config_path)
                .map_err(|e| format!("Failed to create app config directory: {}", e))?;

            // Create stores.json with the default store
            let stores_data = StoresData {
                configs: vec![default_store.clone()],
            };

            let json_content = serde_json::to_string_pretty(&stores_data)
                .map_err(|e| format!("Failed to serialize stores: {}", e))?;

            std::fs::write(&stores_file, json_content)
                .map_err(|e| format!("Failed to write stores file: {}", e))?;

            println!("Created default store '原有配置' from existing settings.json");

            return Ok(vec![default_store]);
        } else {
            return Ok(vec![]);
        }
    }

    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let stores_data: StoresData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    let mut stores_vec = stores_data.configs;
    // Sort by createdAt in ascending order (oldest first)
    stores_vec.sort_by(|a, b| a.createdAt.cmp(&b.createdAt));

    Ok(stores_vec)
}

#[tauri::command]
pub async fn create_config(
    id: String,
    title: String,
    settings: Value,
) -> Result<ConfigStore, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    // Ensure app config directory exists
    std::fs::create_dir_all(&app_config_path)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    // Read existing stores
    let mut stores_data = if stores_file.exists() {
        let content = std::fs::read_to_string(&stores_file)
            .map_err(|e| format!("Failed to read stores file: {}", e))?;

        serde_json::from_str::<StoresData>(&content)
            .map_err(|e| format!("Failed to parse stores file: {}", e))?
    } else {
        StoresData { configs: vec![] }
    };

    // Determine if this should be the active store (true if no other stores exist)
    let should_be_active = stores_data.configs.is_empty();

    // If this is the first store (and therefore active), write its settings to the user's actual settings.json
    if should_be_active {
        let user_settings_path = home_dir.join(".claude/settings.json");
        let json_content = serde_json::to_string_pretty(&settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        // Create .claude directory if it doesn't exist
        if let Some(parent) = user_settings_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create .claude directory: {}", e))?;
        }

        std::fs::write(&user_settings_path, json_content)
            .map_err(|e| format!("Failed to write user settings: {}", e))?;
    }

    // Create new store
    let new_store = ConfigStore {
        id: id.clone(),
        title: title.clone(),
        createdAt: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_secs(),
        settings,
        using: should_be_active,
    };

    // Add store to collection
    stores_data.configs.push(new_store.clone());

    // Write back to stores file
    let json_content = serde_json::to_string_pretty(&stores_data)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(new_store)
}

#[tauri::command]
pub async fn delete_config(store_id: String) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        return Err("Stores file does not exist".to_string());
    }

    // Read existing stores
    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let mut stores_data: StoresData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    // Find and remove store by ID
    let original_len = stores_data.configs.len();
    stores_data.configs.retain(|store| store.id != store_id);

    if stores_data.configs.len() == original_len {
        return Err("Store not found".to_string());
    }

    // Write back to file
    let json_content = serde_json::to_string_pretty(&stores_data)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn set_using_config(store_id: String) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        return Err("Stores file does not exist".to_string());
    }

    // Read existing stores
    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let mut stores_data: StoresData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    // Find the store and check if it exists
    let store_found = stores_data.configs.iter().any(|store| store.id == store_id);
    if !store_found {
        return Err("Store not found".to_string());
    }

    // Set all stores to not using, then set the selected one to using
    let mut selected_store_settings: Option<Value> = None;
    for store in &mut stores_data.configs {
        if store.id == store_id {
            store.using = true;
            selected_store_settings = Some(store.settings.clone());
        } else {
            store.using = false;
        }
    }

    // Write the selected store's settings to the user's actual settings.json
    if let Some(settings) = selected_store_settings {
        let user_settings_path = home_dir.join(".claude/settings.json");
        let json_content = serde_json::to_string_pretty(&settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        // Create .claude directory if it doesn't exist
        if let Some(parent) = user_settings_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create .claude directory: {}", e))?;
        }

        std::fs::write(&user_settings_path, json_content)
            .map_err(|e| format!("Failed to write user settings: {}", e))?;
    }

    // Write back to stores file
    let json_content = serde_json::to_string_pretty(&stores_data)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_current_store() -> Result<Option<ConfigStore>, String> {
    let stores = get_stores().await?;
    Ok(stores.into_iter().find(|store| store.using))
}

#[tauri::command]
pub async fn get_store(store_id: String) -> Result<ConfigStore, String> {
    let stores = get_stores().await?;
    stores
        .into_iter()
        .find(|store| store.id == store_id)
        .ok_or_else(|| format!("Store with id '{}' not found", store_id))
}

#[tauri::command]
pub async fn update_config(
    store_id: String,
    title: String,
    settings: Value,
) -> Result<ConfigStore, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        return Err("Stores file does not exist".to_string());
    }

    // Read existing stores
    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let mut stores_data: StoresData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    // Find the store by ID
    let store_index = stores_data
        .configs
        .iter()
        .position(|store| store.id == store_id)
        .ok_or_else(|| format!("Store with id '{}' not found", store_id))?;

    // // Check if new title conflicts with existing stores (excluding current one)
    // for existing_store in &stores_data.configs {
    //     if existing_store.id != store_id && existing_store.title == title {
    //         return Err("Store with this title already exists".to_string());
    //     }
    // }

    // Update the store
    let store = &mut stores_data.configs[store_index];
    store.title = title.clone();
    store.settings = settings.clone();

    // If this store is currently in use, also update the user's settings.json
    if store.using {
        let user_settings_path = home_dir.join(".claude/settings.json");
        let json_content = serde_json::to_string_pretty(&settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        std::fs::write(&user_settings_path, json_content)
            .map_err(|e| format!("Failed to write user settings: {}", e))?;
    }

    // Write back to stores file
    let json_content = serde_json::to_string_pretty(&stores_data)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(stores_data.configs[store_index].clone())
}

#[tauri::command]
pub async fn open_config_path() -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);

    // Ensure the directory exists
    if !app_config_path.exists() {
        std::fs::create_dir_all(&app_config_path)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    // Open the directory in the system's file manager
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&app_config_path)
            .spawn()
            .map_err(|e| format!("Failed to open config directory: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&app_config_path)
            .spawn()
            .map_err(|e| format!("Failed to open config directory: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&app_config_path)
            .spawn()
            .map_err(|e| format!("Failed to open config directory: {}", e))?;
    }

    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub body: Option<String>,
    pub date: Option<String>,
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    println!("🔍 Checking for updates...");
    println!("📱 App version: {}", app.package_info().version);
    println!("🏷️  App identifier: {}", app.package_info().name);

    match app.updater() {
        Ok(updater) => {
            println!("✅ Updater initialized successfully");
            println!("📡 Checking update endpoint: https://github.com/djyde/ccmate-release/releases/latest/download/latest.json");

            match updater.check().await {
                Ok(Some(update)) => {
                    println!("🎉 Update available!");
                    println!("📦 Current version: {}", update.current_version);
                    println!("🚀 New version: {}", update.version);
                    println!("📝 Release notes: {:?}", update.body);
                    println!("📅 Release date: {:?}", update.date);
                    println!("🎯 Target platform: {:?}", update.target);

                    Ok(UpdateInfo {
                        available: true,
                        version: Some(update.version.clone()),
                        body: update.body.clone(),
                        date: update.date.map(|d| d.to_string()),
                    })
                }
                Ok(None) => {
                    println!("✅ No updates available - you're on the latest version");

                    Ok(UpdateInfo {
                        available: false,
                        version: None,
                        body: None,
                        date: None,
                    })
                }
                Err(e) => {
                    println!("❌ Error checking for updates: {}", e);
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to initialize updater: {}", e);
            Err(format!("Failed to get updater: {}", e))
        }
    }
}

#[tauri::command]
pub async fn rebuild_tray_menu_command(app: tauri::AppHandle) -> Result<(), String> {
    crate::tray::rebuild_tray_menu(app).await
}

#[tauri::command]
pub async fn install_and_restart(app: tauri::AppHandle) -> Result<(), String> {
    println!("🚀 Starting update installation process...");

    match app.updater() {
        Ok(updater) => {
            println!("✅ Updater ready for installation");
            println!("📡 Re-checking for updates to get download info...");

            match updater.check().await {
                Ok(Some(update)) => {
                    println!("📥 Starting download and installation...");
                    println!("🎯 Update version: {}", update.version);
                    println!("🎯 Update target: {:?}", update.target);

                    // Download and install the update
                    match update.download_and_install(
                        |chunk_length, content_length| {
                            let progress = if let Some(total) = content_length {
                                (chunk_length as f64 / total as f64) * 100.0
                            } else {
                                0.0
                            };
                            println!("⬇️  Download progress: {:.1}% ({} bytes)", progress, chunk_length);
                        },
                        || {
                            println!("✅ Download completed! Preparing to restart...");
                        }
                    ).await {
                        Ok(_) => {
                            println!("🔄 Update installed successfully! Restarting application in 500ms...");

                            // Schedule restart after a short delay to allow the response to be sent
                            let app_handle = app.clone();
                            tauri::async_runtime::spawn(async move {
                                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                                println!("🔄 Restarting now!");
                                app_handle.restart();
                            });
                            Ok(())
                        }
                        Err(e) => {
                            println!("❌ Failed to install update: {}", e);
                            Err(format!("Failed to install update: {}", e))
                        }
                    }
                }
                Ok(None) => {
                    println!("ℹ️  No update available for installation");
                    Err("No update available".to_string())
                }
                Err(e) => {
                    println!("❌ Error checking for updates before installation: {}", e);
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to get updater for installation: {}", e);
            Err(format!("Failed to get updater: {}", e))
        }
    }
}
