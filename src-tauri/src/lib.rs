// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;
use std::env;

#[tauri::command]
async fn execute_command(command: String, is_long: bool) -> Result<String, String> {
    let cmd_parts: Vec<&str> = command.split_whitespace().collect();
    if cmd_parts.is_empty() {
        return Err("命令不能为空".to_string());
    }
    
    let mut cmd = Command::new(cmd_parts[0]);
    if cmd_parts.len() > 1 {
        cmd.args(&cmd_parts[1..]);
    }

    #[cfg(target_os = "windows")]
    if is_long {
        cmd.creation_flags(0x08000000);
    }

    if is_long {
        cmd.spawn()
            .map_err(|e| format!("执行命令失败: {}", e))?;
        Ok("Command started successfully".to_string())
    } else {
        let output = cmd
            .output()
            .map_err(|e| format!("执行命令失败: {}", e))?;
            
        let stdout = String::from_utf8(output.stdout)
            .map_err(|e| format!("解析输出失败: {}", e))?;
        let stderr = String::from_utf8(output.stderr)
            .map_err(|e| format!("解析错误输出失败: {}", e))?;
            
        if stdout.is_empty() && !stderr.is_empty() {
            Ok(stderr)
        } else {
            Ok(stdout)
        }
    }
}

#[tauri::command]
async fn get_command_path(command: String) -> Result<String, String> {
    // 获取系统特定的可执行文件名
    let command_name = if cfg!(target_os = "windows") {
        if !command.ends_with(".exe") {
            format!("{}.exe", command)
        } else {
            command.clone()
        }
    } else {
        command.clone()
    };

    // 定义常见的安装位置
    let common_paths = if cfg!(target_os = "windows") {
        vec![
            format!(r"C:\Program Files\{}", command),
            format!(r"C:\Program Files\{}\\{}.exe", command, command),
            format!(r"C:\Program Files\nodejs\{}.exe", command),
            format!(r"C:\Program Files (x86)\nodejs\{}.exe", command),
            format!(r"C:\Users\{}\AppData\Roaming\npm\{}.exe", 
                env::var("USERNAME").unwrap_or_default(), command),
            format!(r"C:\Users\{}\AppData\Local\Programs\{}\{}.exe",
                env::var("USERNAME").unwrap_or_default(), command, command),
        ]
    } else {
        vec![
            format!("/usr/local/bin/{}", command),
            format!("/usr/bin/{}", command),
            format!("/opt/homebrew/bin/{}", command),
            format!("{}/bin/{}", env::var("HOME").unwrap_or_default(), command),
            format!("{}/.npm/bin/{}", env::var("HOME").unwrap_or_default(), command),
        ]
    };

    // 检查每个位置
    for path in &common_paths {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    // 如果在常见位置没找到，尝试从 PATH 中查找
    if let Ok(paths) = env::var("PATH") {
        let paths: Vec<&str> = if cfg!(target_os = "windows") {
            paths.split(';').collect()
        } else {
            paths.split(':').collect()
        };

        for path in paths {
            let full_path = std::path::PathBuf::from(path).join(&command_name);
            if full_path.exists() {
                return Ok(full_path.to_string_lossy().to_string());
            }
        }
    }

    Err(format!("未找到命令 '{}'", command))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            execute_command,
            get_command_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
