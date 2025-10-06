use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime,
};
use tauri_plugin_notification::NotificationExt;

use crate::commands::{get_store, get_stores, set_using_config};

// Store the tray icon ID globally
const TRAY_ID: &str = "main-tray";

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    println!("🔧 Creating system tray icon...");
    
    // Load the tray icon - use smaller icon for tray on macOS
    let icon_bytes: &[u8] = if cfg!(target_os = "macos") {
        println!("✓ Using tray-icon.png for macOS");
        include_bytes!("../icons/tray.png")
    } else {
        include_bytes!("../icons/icon.png")
    };
    
    let icon = Image::from_bytes(icon_bytes)?;
    println!("✓ Icon loaded successfully");

    // Build the initial menu - use block_on here since we're not in async context yet
    let menu = tauri::async_runtime::block_on(build_tray_menu(app))?;

    // Create tray icon with event handler
    let tray_builder = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .menu(&menu)
        .tooltip("CC Mate - Config Manager")
        .show_menu_on_left_click(true);  // Show menu on left click

    // On macOS, make it a template icon for better system integration
    #[cfg(target_os = "macos")]
    let tray_builder = tray_builder.icon_as_template(true);

    let _tray = tray_builder
        .on_tray_icon_event(|tray, event| {
            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    println!("👆 Left click - menu should appear automatically");
                    // Menu will show automatically due to show_menu_on_left_click(true)
                }
                TrayIconEvent::Click {
                    button: MouseButton::Right,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    println!("👆 Right click - menu should appear");
                    // Right click also shows menu by default
                }
                TrayIconEvent::DoubleClick {
                    button: MouseButton::Left,
                    ..
                } => {
                    println!("👆 Double click - showing main window");
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.unminimize();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    println!("✅ System tray icon created successfully!");
    Ok(())
}

pub async fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<tauri::menu::Menu<R>, Box<dyn std::error::Error>> {
    println!("🔨 Building tray menu...");
    
    // Get the stores asynchronously
    let stores_result = get_stores().await;

    let menu_builder = MenuBuilder::new(app);

    match stores_result {
        Ok(stores) => {
            println!("✓ Found {} stores", stores.len());
            
            if stores.is_empty() {
                // No configs available
                let no_configs_item =
                    MenuItemBuilder::with_id("no_configs", "No configs available").build(app)?;
                menu_builder.item(&no_configs_item).build().map_err(|e| e.into())
            } else {
                let mut builder = menu_builder;

                // Add config items
                for store in stores {
                    let prefix = if store.using { "✓ " } else { "  " };
                    let label = format!("{}{}", prefix, store.title);
                    
                    println!("  {} Config: {}", if store.using { "✓" } else { " " }, store.title);
                    
                    let item = MenuItemBuilder::with_id(format!("config_{}", store.id), label)
                        .build(app)?;
                    
                    builder = builder.item(&item);
                }

                // Add separator
                let separator = tauri::menu::PredefinedMenuItem::separator(app)?;
                builder = builder.item(&separator);

                // Add "Show Window" item
                let show_item =
                    MenuItemBuilder::with_id("show_window", "Show Window").build(app)?;
                builder = builder.item(&show_item);

                // Add separator
                builder = builder.item(&separator);

                // Add "Quit" item
                let quit_item = MenuItemBuilder::with_id("quit_app", "Quit").build(app)?;
                builder = builder.item(&quit_item);

                builder.build().map_err(|e| e.into())
            }
        }
        Err(e) => {
            eprintln!("Failed to get stores for tray menu: {}", e);
            let error_item =
                MenuItemBuilder::with_id("error", "Error loading configs").build(app)?;
            menu_builder.item(&error_item).build().map_err(|e| e.into())
        }
    }
}

pub async fn rebuild_tray_menu<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    println!("🔄 Rebuilding tray menu...");
    
    // Get the tray icon by ID
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        println!("✓ Tray icon found");
        
        // Build new menu - await since we're already in async context
        let new_menu = build_tray_menu(&app).await
            .map_err(|e| {
                println!("❌ Failed to build menu: {}", e);
                format!("Failed to build tray menu: {}", e)
            })?;
        
        println!("✓ New menu built successfully");

        // Set the new menu
        tray.set_menu(Some(new_menu))
            .map_err(|e| {
                println!("❌ Failed to set menu: {}", e);
                format!("Failed to set tray menu: {}", e)
            })?;

        println!("✅ Tray menu rebuilt successfully!");
        Ok(())
    } else {
        println!("❌ No tray icon found with ID: {}", TRAY_ID);
        Err("No tray icon found".to_string())
    }
}

pub fn handle_tray_menu_event<R: Runtime>(
    app_handle: &AppHandle<R>,
    event_id: &str,
) -> bool {
    match event_id {
        "show_window" => {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
            true
        }
        "quit_app" => {
            app_handle.exit(0);
            true
        }
        id if id.starts_with("config_") => {
            // Extract store ID from the menu item ID and convert to owned String
            let store_id = id.trim_start_matches("config_").to_string();
            let app_clone = app_handle.clone();

            // Switch the config
            tauri::async_runtime::spawn(async move {
                println!("🔄 Switching to config: {}", store_id);
                
                match set_using_config(store_id.clone()).await {
                    Ok(_) => {
                        println!("✅ Config switched successfully: {}", store_id);

                        // Small delay to ensure the file system has synced
                        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

                        // Rebuild the tray menu to update checkmarks
                        println!("🔄 About to rebuild tray menu...");
                        if let Err(e) = rebuild_tray_menu(app_clone.clone()).await {
                            eprintln!("❌ Failed to rebuild tray menu: {}", e);
                        } else {
                            println!("✅ Tray menu updated with new checkmark");
                        }

                        // Get the store details to show the config name in notification
                        let notification_body = match get_store(store_id.clone()).await {
                            Ok(store) => format!("Claude Code config switched to \"{}\"", store.title),
                            Err(_) => "Configuration has been switched successfully".to_string(),
                        };

                        // Show notification using the notification plugin
                        let _ = app_clone
                            .notification()
                            .builder()
                            .title("CC Mate")
                            .body(&notification_body)
                            .show();
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to switch config: {}", e);

                        // Show error notification
                        let _ = app_clone
                            .notification()
                            .builder()
                            .title("CC Mate")
                            .body(&format!("Error: {}", e))
                            .show();
                    }
                }
            });
            true
        }
        _ => false,
    }
}

