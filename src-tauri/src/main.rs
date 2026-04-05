// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::process::{Command, Stdio};
use std::net::TcpStream;
use std::time::Duration;

#[tauri::command]
async fn get_server_logs() -> Result<String, String> {
    std::fs::read_to_string("/tmp/lm-server.log")
        .map_err(|e| format!("No se pudo leer el log: {}", e))
}

#[tauri::command]
async fn open_drawer() -> Result<String, String> {
    let esc_pos_open = [0x1B, 0x70, 0x00, 0x19, 0xFA]; // Comando estándar ESC/POS para cajón 1
    
    // MÉTODO 1: Escritura directa a puerto USB (Más rápido)
    let usb_ports = ["/dev/usb/lp0", "/dev/usb/lp1", "/dev/lp0"];
    for port in usb_ports {
        if std::path::Path::new(port).exists() {
            match std::fs::write(port, esc_pos_open) {
                Ok(_) => return Ok(format!("✅ Cajón abierto vía directa en {}", port)),
                Err(e) => println!("⚠️ Falló el método directo en {}: {}", port, e),
            }
        }
    }

    // MÉTODO 2: CUPS (lp -o raw)
    match Command::new("lp")
        .arg("-o")
        .arg("raw")
        .stdin(Stdio::piped())
        .spawn() {
            Ok(mut child) => {
                use std::io::Write;
                if let Some(mut stdin) = child.stdin.take() {
                    let _ = stdin.write_all(&esc_pos_open);
                }
                Ok("✅ Comando enviado a la cola de impresión CUPS.".to_string())
            },
            Err(e) => Err(format!("❌ Todos los métodos fallaron. Error: {}", e))
        }
}

#[tauri::command]
async fn print_ticket(content: String) -> Result<String, String> {
    match Command::new("lp")
        .stdin(Stdio::piped())
        .spawn() {
            Ok(mut child) => {
                use std::io::Write;
                if let Some(mut stdin) = child.stdin.take() {
                    let _ = stdin.write_all(content.as_bytes());
                }
                Ok("✅ Ticket enviado a la impresora predeterminada.".to_string())
            },
            Err(e) => Err(format!("❌ Error al imprimir: {}", e))
        }
}

#[tauri::command]
async fn start_server(handle: tauri::AppHandle) -> Result<String, String> {
    if let Ok(resource_dir) = handle.path().resource_dir() {
        let server_path = resource_dir.join("_up_").join("dist-server-bundle").join("index.js");
        let fallback_path = resource_dir.join("dist-server-bundle").join("index.js");
        let final_path = if server_path.exists() { server_path } else { fallback_path };
        
        let working_dir = resource_dir.join("_up_");

        if !final_path.exists() {
            return Err(format!("❌ No existe index.js en {:?}", final_path));
        }

        // --- CONMUTACIÓN: LIMPIEZA DE PUERTO ---
        // Si el puerto 3001 está ocupado, intentamos liberarlo (limpieza de hilos muertos)
        let _ = Command::new("fuser")
            .arg("-k")
            .arg("3001/tcp")
            .output();

        // Verificar si se liberó o si sigue ocupado (esperar un poco)
        std::thread::sleep(Duration::from_millis(300));

        if TcpStream::connect_timeout(&"127.0.0.1:3001".parse().unwrap(), Duration::from_millis(500)).is_ok() {
            return Ok("🔄 El servidor ya está en línea o el puerto 3001 fue recuperado.".to_string());
        }

        // --- CONMUTACIÓN: BÚSQUEDA DE NODE ---
        let node_exec = [
            "node",
            "/usr/bin/node",
            "/usr/local/bin/node",
            "/snap/bin/node",
            "nodejs"
        ].into_iter().find(|&n| {
            Command::new(n).arg("--version").output().is_ok()
        }).ok_or_else(|| "❌ Node.js no encontrado. Por favor, instala nodejs (apt install nodejs)".to_string())?;

        let log_file = std::fs::File::create("/tmp/lm-server.log").ok();

        let mut cmd = Command::new(node_exec);
        cmd.arg(&final_path)
           .current_dir(working_dir);

        if let Some(f) = log_file {
            cmd.stdout(Stdio::from(f.try_clone().unwrap()));
            cmd.stderr(Stdio::from(f));
        }

        match cmd.spawn() {
            Ok(_) => Ok("🚀 Servidor iniciado con éxito (Modo Failover).".to_string()),
            Err(e) => Err(format!("❌ Error crítico al iniciar servidor: {}", e)),
        }
    } else {
        Err("❌ Error de recursos en Tauri (System File Access)".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = start_server(handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_server, get_server_logs, open_drawer, print_ticket])
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
