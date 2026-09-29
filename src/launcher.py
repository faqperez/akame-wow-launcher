#!/usr/bin/env python3
"""
Akame WoW Launcher
Launcher para servidor Akame WoW - Classic+ 3.3.5a
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import os
import sys
import json
import shutil
from pathlib import Path
import subprocess
import hashlib

class AkameLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Akame WoW Launcher")
        self.root.geometry("900x700")
        self.root.resizable(False, False)
        
        # Variables
        self.wow_path = tk.StringVar()
        self.hd_enabled = tk.BooleanVar(value=False)
        self.client_verified = False
        self.is_patched = False
        
        # Cargar configuración guardada
        self.load_config()
        
        # Crear UI
        self.create_ui()
        
        # Verificar cliente si hay ruta guardada
        if self.wow_path.get():
            self.verify_client()
    
    def load_config(self):
        """Cargar configuración desde archivo."""
        config_path = Path.home() / '.akame_launcher.json'
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    self.wow_path.set(config.get('wow_path', ''))
                    self.hd_enabled.set(config.get('hd_enabled', False))
            except:
                pass
    
    def save_config(self):
        """Guardar configuración."""
        config_path = Path.home() / '.akame_launcher.json'
        config = {
            'wow_path': self.wow_path.get(),
            'hd_enabled': self.hd_enabled.get()
        }
        with open(config_path, 'w') as f:
            json.dump(config, f)
    
    def create_ui(self):
        """Crear interfaz de usuario."""
        # Estilo
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TFrame', background='#1A1A2E')
        style.configure('TLabel', background='#1A1A2E', foreground='#E4E4E4', font=('Segoe UI', 10))
        style.configure('Title.TLabel', background='#1A1A2E', foreground='#E94560', font=('Segoe UI', 24, 'bold'))
        style.configure('Subtitle.TLabel', background='#1A1A2E', foreground='#A0A0A0', font=('Segoe UI', 11))
        style.configure('Section.TLabelframe', background='#16213E', foreground='#E94560', font=('Segoe UI', 12, 'bold'))
        style.configure('Section.TLabelframe.Label', background='#16213E', foreground='#E94560', font=('Segoe UI', 12, 'bold'))
        style.configure('TButton', font=('Segoe UI', 11, 'bold'), padding=10)
        style.configure('Primary.TButton', background='#E94560', foreground='white')
        style.configure('Secondary.TButton', background='#0F3460', foreground='white')
        style.configure('Danger.TButton', background='#F44336', foreground='white')
        style.configure('Launch.TButton', font=('Segoe UI', 14, 'bold'), padding=15)
        
        # Contenedor principal
        main_frame = ttk.Frame(self.root, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        title_label = ttk.Label(header_frame, text="AKAME WOW", style='Title.TLabel')
        title_label.pack()
        
        subtitle_label = ttk.Label(header_frame, text="SERVIDOR CLASSIC+ | BUILD 12340", style='Subtitle.TLabel')
        subtitle_label.pack(pady=(5, 0))
        
        # Sección: Carpeta de WoW
        path_section = ttk.LabelFrame(main_frame, text="📁 Carpeta de WoW", style='Section.TLabelframe', padding=15)
        path_section.pack(fill=tk.X, pady=(0, 15))
        
        self.path_entry = ttk.Entry(path_section, textvariable=self.wow_path, state='readonly', font=('Consolas', 10))
        self.path_entry.pack(fill=tk.X, pady=(0, 10))
        
        select_btn = ttk.Button(path_section, text="Seleccionar Carpeta", style='Secondary.TButton', command=self.select_path)
        select_btn.pack()
        
        # Sección: Estado del Cliente
        status_section = ttk.LabelFrame(main_frame, text="🔍 Estado del Cliente", style='Section.TLabelframe', padding=15)
        status_section.pack(fill=tk.X, pady=(0, 15))
        
        self.status_label = ttk.Label(status_section, text="Selecciona la carpeta de WoW para verificar", foreground='#64B5F6')
        self.status_label.pack(fill=tk.X, pady=(0, 10))
        
        verify_btn = ttk.Button(status_section, text="Verificar Cliente", command=self.verify_client)
        verify_btn.pack()
        
        # Sección: Parches
        patches_section = ttk.LabelFrame(main_frame, text=" Parches", style='Section.TLabelframe', padding=15)
        patches_section.pack(fill=tk.X, pady=(0, 15))
        
        self.hd_checkbox = ttk.Checkbutton(patches_section, text="Habilitar parches HD (4GB RAM + Fix mouse)", variable=self.hd_enabled, command=self.save_config)
        self.hd_checkbox.pack(anchor=tk.W, pady=(0, 15))
        
        buttons_frame = ttk.Frame(patches_section)
        buttons_frame.pack(fill=tk.X)
        
        self.apply_btn = ttk.Button(buttons_frame, text="Aplicar Parches", style='Primary.TButton', command=self.apply_patches, state='disabled')
        self.apply_btn.pack(side=tk.LEFT, padx=(0, 10), expand=True, fill=tk.X)
        
        self.restore_btn = ttk.Button(buttons_frame, text="Restaurar Backup", style='Danger.TButton', command=self.restore_backup, state='disabled')
        self.restore_btn.pack(side=tk.RIGHT, expand=True, fill=tk.X)
        
        # Log
        self.log_text = scrolledtext.ScrolledText(patches_section, height=8, state='disabled', 
                                                    bg='#0F0F1E', fg='#E4E4E4', font=('Consolas', 10),
                                                    insertbackground='white')
        self.log_text.pack(fill=tk.X, pady=(15, 0))
        
        # Sección: Jugar
        play_section = ttk.LabelFrame(main_frame, text="🎮 Jugar", style='Section.TLabelframe', padding=15)
        play_section.pack(fill=tk.X, pady=(0, 15))
        
        self.launch_btn = ttk.Button(play_section, text="▶ INICIAR WORLD OF WARCRAFT", style='Launch.TButton', 
                                      command=self.launch_game, state='disabled')
        self.launch_btn.pack(fill=tk.X, ipady=10)
        
        # Footer
        footer_frame = ttk.Frame(main_frame)
        footer_frame.pack(fill=tk.X, pady=(15, 0))
        
        footer_label = ttk.Label(footer_frame, text="Akame WoW Launcher v1.0.0 | Servidor Privado Classic+", 
                                  style='Subtitle.TLabel')
        footer_label.pack()
    
    def log(self, message, level='info'):
        """Agregar mensaje al log."""
        self.log_text.config(state='normal')
        colors = {
            'info': '#64B5F6',
            'success': '#81C784',
            'error': '#E57373',
            'warning': '#FFB74D'
        }
        color = colors.get(level, '#E4E4E4')
        self.log_text.insert(tk.END, f"[{self.get_time()}] ", 'timestamp')
        self.log_text.insert(tk.END, f"{message}\n", level)
        self.log_text.tag_config(level, foreground=color)
        self.log_text.tag_config('timestamp', foreground='#A0A0A0')
        self.log_text.see(tk.END)
        self.log_text.config(state='disabled')
    
    def get_time(self):
        """Obtener hora actual."""
        from datetime import datetime
        return datetime.now().strftime("%H:%M:%S")
    
    def select_path(self):
        """Seleccionar carpeta de WoW."""
        path = filedialog.askdirectory(title="Seleccionar carpeta de World of Warcraft")
        if path:
            self.wow_path.set(path)
            self.save_config()
            self.verify_client()
    
    def verify_client(self):
        """Verificar cliente de WoW."""
        wow_path = self.wow_path.get()
        if not wow_path:
            return
        
        wow_exe = Path(wow_path) / 'WoW.exe'
        
        if not wow_exe.exists():
            self.status_label.config(text="✗ WoW.exe no encontrado", foreground='#E57373')
            self.client_verified = False
            self.apply_btn.config(state='disabled')
            self.restore_btn.config(state='disabled')
            self.launch_btn.config(state='disabled')
            return
        
        # Verificar tamaño (~7.7MB para build 12340)
        size = wow_exe.stat().st_size
        if size < 7000000 or size > 8000000:
            self.status_label.config(text=f"✗ Tamaño incorrecto: {size} bytes", foreground='#E57373')
            self.client_verified = False
            return
        
        # Calcular checksum
        checksum = self.calculate_checksum(wow_exe)
        
        # Verificar si está parcheado
        self.is_patched = self.check_if_patched(wow_exe)
        
        if self.is_patched:
            self.status_label.config(text=f"✓ Cliente verificado y parcheado\nChecksum: {checksum[:16]}...", foreground='#81C784')
            self.apply_btn.config(state='disabled', text='Ya Parcheado')
        else:
            self.status_label.config(text=f"✓ Cliente verificado (sin parches)\nChecksum: {checksum[:16]}...", foreground='#64B5F6')
            self.apply_btn.config(state='normal', text='Aplicar Parches')
        
        # Verificar backup
        backup_path = Path(wow_path) / 'WoW.exe.backup'
        if backup_path.exists():
            self.restore_btn.config(state='normal')
        
        self.client_verified = True
        self.launch_btn.config(state='normal')
        self.log("Cliente verificado correctamente", 'success')
    
    def calculate_checksum(self, file_path):
        """Calcular checksum SHA256."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def check_if_patched(self, wow_exe):
        """Verificar si el WoW.exe ya está parcheado."""
        try:
            with open(wow_exe, 'rb') as f:
                f.seek(0x1f41bf)
                byte = f.read(1)
                return byte == b'\xeb'
        except:
            return False
    
    def apply_patches(self):
        """Aplicar parches al cliente."""
        if not self.client_verified:
            return
        
        wow_path = Path(self.wow_path.get())
        wow_exe = wow_path / 'WoW.exe'
        backup_path = wow_path / 'WoW.exe.backup'
        
        self.apply_btn.config(state='disabled')
        self.restore_btn.config(state='disabled')
        self.log_text.config(state='normal')
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state='disabled')
        
        try:
            # Crear backup
            if not backup_path.exists():
                shutil.copy2(wow_exe, backup_path)
                self.log("Backup creado: WoW.exe.backup", 'success')
            
            # Leer archivo
            with open(wow_exe, 'rb') as f:
                buffer = bytearray(f.read())
            
            patches_applied = 0
            
            # Aplicar parches esenciales
            essential_patches = [
                (0x1f41bf, [0xeb], "SIG & MD5 Protection"),
                (0x415a25, [0xeb], "SIG & MD5 Protection 2"),
                (0x415a3f, [0x03], "SIG & MD5 Protection 3"),
                (0x415a95, [0x03], "SIG & MD5 Protection 4"),
                (0x415b46, [0xeb], "SIG & MD5 Protection 5"),
                (0x415b5f, [0xb8, 0x03, 0x00, 0x00, 0x00, 0xeb, 0xed], "SIG & MD5 Protection 6"),
                (0x2e1c67, [0x90] * 11, "Melee swing fix"),
                (0x33d7c9, [0xeb], "NPC attack animation"),
                (0x0355bf, [0xeb], "Ghost attack fix"),
                (0x33e0d6, [0x90] * 22, "Pre-cast animation"),
                (0x1ddc5d, [0xeb], "Naked character fix"),
                (0x16d899, [0x05, 0x01, 0x00, 0x00, 0x00], "Mail timeout"),
                (0x2db241, [50], "Area trigger precision"),
                (0x10ca41, [0xeb], "Chat while dead"),
                (0x6404f, [0x14], "Character list limit"),
            ]
            
            for offset, bytes_list, name in essential_patches:
                for i, byte in enumerate(bytes_list):
                    buffer[offset + i] = byte
                patches_applied += 1
                self.log(f"✓ {name}", 'success')
            
            # Aplicar parches HD si están habilitados
            if self.hd_enabled.get():
                hd_patches = [
                    (0x469a2c, [0xe9, 0x71, 0xf0, 0x0b, 0x00, 0xf8, 0x13, 0xd4, 0x00, 0x8b, 0x1d, 0xfc], "Mouse flicker fix 1"),
                    (0x528aa2, [0x8d, 0x4d, 0xf0, 0x51, 0x57, 0xff, 0x15, 0xdc, 0xf5, 0x9d, 0x00, 0x8b, 0x45, 0xf0, 0x8b, 0x15, 0xf8, 0x13, 0xd4, 0x00, 0xe9, 0x7a, 0x0f, 0xf4, 0xff], "Mouse flicker fix 2"),
                    (0x4691b1, [0x89, 0xe5, 0x8b, 0x05, 0xfc, 0x13, 0xd4, 0x00, 0x8b, 0x0d, 0xf8, 0x13, 0xd4, 0x00, 0xeb, 0xc2, 0x7d, 0x03, 0x83, 0xc1, 0x01, 0x83, 0xc0, 0x32, 0x83, 0xc1, 0x32, 0x3b, 0x0d, 0xec, 0xbc, 0xca, 0x00, 0x7e, 0x03, 0x83, 0xe9, 0x01, 0x3b, 0x05, 0xf0, 0xbc, 0xca, 0x00, 0x7e, 0x03, 0x83, 0xe8, 0x01, 0x83, 0xe9, 0x32, 0x83, 0xe8, 0x32, 0x89, 0x0d, 0xf8, 0x13, 0xd4, 0x00, 0x89, 0x05, 0xfc, 0x13, 0xd4, 0x00, 0x89, 0xec, 0x5d, 0xe9, 0xb4, 0xf7, 0xff, 0xff, 0xec, 0x5d, 0xc3, 0xc3], "Mouse flicker fix 3"),
                    (0x469183, [0x83, 0xf8, 0x32, 0x7d, 0x03, 0x83, 0xc0, 0x01, 0x83, 0xf9, 0x32, 0xeb, 0x31], "Mouse flicker fix 4"),
                ]
                
                # Large address aware (PE header)
                pe_offset = int.from_bytes(buffer[0x3c:0x40], 'little')
                if pe_offset > 0 and pe_offset + 0x18 <= len(buffer):
                    pe_sig = int.from_bytes(buffer[pe_offset:pe_offset+4], 'little')
                    if pe_sig == 0x00004550:
                        characteristics = pe_offset + 0x16
                        current = int.from_bytes(buffer[characteristics:characteristics+2], 'little')
                        buffer[characteristics:characteristics+2] = (current | 0x0020).to_bytes(2, 'little')
                        patches_applied += 1
                        self.log("✓ Large address aware (4GB RAM)", 'success')
                
                for offset, bytes_list, name in hd_patches:
                    for i, byte in enumerate(bytes_list):
                        buffer[offset + i] = byte
                    patches_applied += 1
                    self.log(f"✓ {name}", 'success')
            
            # Guardar archivo
            with open(wow_exe, 'wb') as f:
                f.write(buffer)
            
            self.log(f"\n{patches_applied} parches aplicados correctamente", 'success')
            
            # Copiar patch-akame.mpq
            self.apply_client_patch(wow_path)
            
            self.status_label.config(text="✓ Cliente parcheado correctamente", foreground='#81C784')
            self.apply_btn.config(text='Ya Parcheado')
            self.restore_btn.config(state='normal')
            self.is_patched = True
            
        except Exception as e:
            self.log(f"Error: {str(e)}", 'error')
            self.apply_btn.config(state='normal')
            self.restore_btn.config(state='normal')
    
    def apply_client_patch(self, wow_path):
        """Aplicar patch de cliente (CharBaseInfo.dbc)."""
        patch_src = Path(__file__).parent / 'patches' / 'patch-akame.mpq'
        patch_dst = wow_path / 'Data' / 'patch-akame.mpq'
        mod_uac_patch = wow_path / 'Data' / 'patch-z.mpq'
        
        if not patch_src.exists():
            self.log("⚠ Patch de cliente no encontrado", 'warning')
            return
        
        # Crear carpeta Data si no existe
        data_path = wow_path / 'Data'
        if not data_path.exists():
            data_path.mkdir()
        
        # Copiar patch
        shutil.copy2(patch_src, patch_dst)
        self.log("✓ Patch de cliente aplicado (patch-akame.mpq)", 'success')
        
        # Eliminar patch-z.mpq si existe
        if mod_uac_patch.exists():
            mod_uac_patch.unlink()
            self.log("✓ patch-z.mpq eliminado", 'success')
    
    def restore_backup(self):
        """Restaurar backup del cliente."""
        wow_path = Path(self.wow_path.get())
        wow_exe = wow_path / 'WoW.exe'
        backup_path = wow_path / 'WoW.exe.backup'
        
        if not backup_path.exists():
            messagebox.showerror("Error", "No existe backup para restaurar")
            return
        
        if not messagebox.askyesno("Confirmar", "¿Restaurar backup? Se eliminarán todos los parches."):
            return
        
        try:
            shutil.copy2(backup_path, wow_exe)
            self.log("Backup restaurado correctamente", 'success')
            
            # Eliminar patch de cliente
            patch_path = wow_path / 'Data' / 'patch-akame.mpq'
            if patch_path.exists():
                patch_path.unlink()
                self.log("Patch de cliente eliminado", 'success')
            
            self.status_label.config(text="✓ Cliente restaurado al original", foreground='#64B5F6')
            self.apply_btn.config(state='normal', text='Aplicar Parches')
            self.restore_btn.config(state='disabled')
            self.is_patched = False
            
        except Exception as e:
            self.log(f"Error al restaurar: {str(e)}", 'error')
    
    def launch_game(self):
        """Iniciar World of Warcraft."""
        wow_path = Path(self.wow_path.get())
        wow_exe = wow_path / 'WoW.exe'
        
        if not wow_exe.exists():
            messagebox.showerror("Error", "WoW.exe no encontrado")
            return
        
        try:
            self.log("Iniciando World of Warcraft...", 'info')
            subprocess.Popen([str(wow_exe)], cwd=str(wow_path))
            self.log("✓ WoW iniciado", 'success')
        except Exception as e:
            self.log(f"Error al iniciar: {str(e)}", 'error')

if __name__ == '__main__':
    root = tk.Tk()
    app = AkameLauncher(root)
    root.mainloop()
