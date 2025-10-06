use serde_json::Value;
use std::path::PathBuf;
use std::collections::HashMap;

// Application configuration directory
const APP_CONFIG_DIR: &str = ".ccconfig";

pub async fn initialize_app_config() -> Result<(), String> {
    println!("initialize_app_config called");

    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);

    println!("Checking if app config directory exists: {}", app_config_path.display());

    // Create config directory if it doesn't exist
    if !app_config_path.exists() {
        println!("App config directory does not exist, creating...");
        std::fs::create_dir_all(&app_config_path)
            .map_err(|e| format!("Failed to create app config directory: {}", e))?;
        println!("App config directory created: {}", app_config_path.display());
    } else {
        println!("App config directory already exists");
    }

    // Check if we need to backup Claude configs
    let claude_dir = home_dir.join(".claude");
    println!("Checking if Claude directory exists: {}", claude_dir.display());

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
    pub name: String,
    pub created_at: u64,
    pub settings: Value,
    pub using: bool,
}

#[tauri::command]
pub async fn read_config_file(config_type: String) -> Result<ConfigFile, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;

    let path = match config_type.as_str() {
        "user" => home_dir.join(".claude/settings.json"),
        "enterprise_macos" => PathBuf::from("/Library/Application Support/ClaudeCode/managed-settings.json"),
        "enterprise_linux" => PathBuf::from("/etc/claude-code/managed-settings.json"),
        "enterprise_windows" => PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-settings.json"),
        "mcp_macos" => PathBuf::from("/Library/Application Support/ClaudeCode/managed-mcp.json"),
        "mcp_linux" => PathBuf::from("/etc/claude-code/managed-mcp.json"),
        "mcp_windows" => PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-mcp.json"),
        _ => return Err("Invalid configuration type".to_string()),
    };

    let path_str = path.to_string_lossy().to_string();

    if path.exists() {
        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let json_content: Value = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

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

    std::fs::write(&path, json_content)
        .map_err(|e| format!("Failed to write file: {}", e))?;

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
        let enterprise_path = PathBuf::from("/Library/Application Support/ClaudeCode/managed-settings.json");
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

fn backup_claude_configs_internal(app_config_path: &std::path::Path, claude_dir: &std::path::Path) -> Result<(), String> {
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
        let file_name = source_path.file_name()
            .ok_or("Invalid file name")?;
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
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let stores: HashMap<String, ConfigStore> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    let mut stores_vec: Vec<ConfigStore> = stores.into_values().collect();
    // Sort by created_at in descending order (newest first)
    stores_vec.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(stores_vec)
}

#[tauri::command]
pub async fn create_store(id: String, name: String, settings: Value) -> Result<ConfigStore, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    // Ensure app config directory exists
    std::fs::create_dir_all(&app_config_path)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    // Read existing stores
    let mut stores: HashMap<String, ConfigStore> = if stores_file.exists() {
        let content = std::fs::read_to_string(&stores_file)
            .map_err(|e| format!("Failed to read stores file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse stores file: {}", e))?
    } else {
        HashMap::new()
    };

    // Create new store
    let new_store = ConfigStore {
        id: id.clone(),
        name: name.clone(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_secs(),
        settings,
        using: false,
    };

    // Add store to collection using ID as key
    stores.insert(id.clone(), new_store.clone());

    // Write back to file
    let json_content = serde_json::to_string_pretty(&stores)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(new_store)
}

#[tauri::command]
pub async fn delete_store(store_id: String) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        return Err("Stores file does not exist".to_string());
    }

    // Read existing stores
    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let mut stores: HashMap<String, ConfigStore> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    // Check if store exists
    if !stores.contains_key(&store_id) {
        return Err("Store not found".to_string());
    }

    // Remove store
    stores.remove(&store_id);

    // Write back to file
    let json_content = serde_json::to_string_pretty(&stores)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn set_using_store(store_id: String) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        return Err("Stores file does not exist".to_string());
    }

    // Read existing stores
    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let mut stores: HashMap<String, ConfigStore> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    // Check if store exists
    if !stores.contains_key(&store_id) {
        return Err("Store not found".to_string());
    }

    // Set all stores to not using, then set the selected one to using
    for store in stores.values_mut() {
        store.using = false;
    }

    if let Some(store) = stores.get_mut(&store_id) {
        store.using = true;

        // Also write the store's settings to the user's actual settings.json
        let user_settings_path = home_dir.join(".claude/settings.json");
        let json_content = serde_json::to_string_pretty(&store.settings)
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
    let json_content = serde_json::to_string_pretty(&stores)
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
pub async fn update_store(store_id: String, name: String, settings: Value) -> Result<ConfigStore, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let app_config_path = home_dir.join(APP_CONFIG_DIR);
    let stores_file = app_config_path.join("stores.json");

    if !stores_file.exists() {
        return Err("Stores file does not exist".to_string());
    }

    // Read existing stores
    let content = std::fs::read_to_string(&stores_file)
        .map_err(|e| format!("Failed to read stores file: {}", e))?;

    let mut stores: HashMap<String, ConfigStore> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stores file: {}", e))?;

    // Find the store by ID
    let mut store = stores.get(&store_id)
        .cloned()
        .ok_or_else(|| format!("Store with id '{}' not found", store_id))?;

    // Check if new name conflicts with existing stores (excluding current one)
    for existing_store in stores.values() {
        if existing_store.id != store_id && existing_store.name == name {
            return Err("Store with this name already exists".to_string());
        }
    }

    // Update the store
    store.name = name.clone();
    store.settings = settings;

    // Insert updated store (using ID as key)
    stores.insert(store_id.clone(), store.clone());

    // If this store is currently in use, also update the user's settings.json
    if store.using {
        let user_settings_path = home_dir.join(".claude/settings.json");
        let json_content = serde_json::to_string_pretty(&store.settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        std::fs::write(&user_settings_path, json_content)
            .map_err(|e| format!("Failed to write user settings: {}", e))?;
    }

    // Write back to stores file
    let json_content = serde_json::to_string_pretty(&stores)
        .map_err(|e| format!("Failed to serialize stores: {}", e))?;

    std::fs::write(&stores_file, json_content)
        .map_err(|e| format!("Failed to write stores file: {}", e))?;

    Ok(store)
}