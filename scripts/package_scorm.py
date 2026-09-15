#!/usr/bin/env python3
"""
package_scorm.py — Packages dist/scorm_package into a standard SCORM 1.2 ZIP package for KLC LMS.
Reference implementation from Interactive Organization Explorer v3.0.
"""
import os
import sys
import zipfile
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, 'dist', 'scorm_package')

def create_scorm_zip(output_zip_path, folder_name="DJBC_Interactive_Narcotics_Inspection"):
    print(f"[SCORM Packager] Compress files into 1-level folder '{folder_name}' in zip: {os.path.basename(output_zip_path)}...")
    
    if not os.path.exists(DIST_DIR):
        print(f"Error: Folder dist/scorm_package not found at {DIST_DIR}")
        sys.exit(1)
        
    manifest_path = os.path.join(DIST_DIR, 'imsmanifest.xml')
    if not os.path.exists(manifest_path):
        print("Error: imsmanifest.xml not found in dist/scorm_package")
        sys.exit(1)
        
    os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)
    
    if os.path.exists(output_zip_path):
        os.remove(output_zip_path)
        
    count = 0
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(DIST_DIR):
            for file in files:
                if file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, DIST_DIR).replace('\\', '/')
                arcname = f"{folder_name}/{rel_path}" if folder_name else rel_path
                zf.write(file_path, arcname)
                count += 1
                
    file_size_mb = os.path.getsize(output_zip_path) / (1024 * 1024)
    print(f"[SCORM Packager] Successfully archived {count} files inside '{folder_name}/' ({file_size_mb:.2f} MB).")
    print(f"=> SCORM 1.2 ZIP ready: {output_zip_path}")
    return output_zip_path

def main():
    root_zip = os.path.join(ROOT_DIR, "scorm_package.zip")
    create_scorm_zip(root_zip, folder_name="DJBC_Interactive_Narcotics_Inspection")

if __name__ == '__main__':
    main()
