import os
import shutil
from PIL import Image

src_dir = os.path.join(os.getcwd(), 'public', 'assets', 'images')
MAX_DIM = 1400
JPEG_QUALITY = 78

print(f"[Image Compressor] Processing images in {src_dir}...")

total_orig = 0
total_new = 0
count = 0

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            path = os.path.join(root, f)
            orig_sz = os.path.getsize(path)
            total_orig += orig_sz
            count += 1
            
            try:
                with Image.open(path) as img:
                    w, h = img.size
                    if w > MAX_DIM or h > MAX_DIM:
                        scale = min(MAX_DIM / w, MAX_DIM / h)
                        new_w = max(1, int(w * scale))
                        new_h = max(1, int(h * scale))
                        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    
                    ext = os.path.splitext(f)[1].lower()
                    if ext in ('.jpg', '.jpeg'):
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        img.save(path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
                    elif ext == '.png':
                        has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                        if has_alpha:
                            img.save(path, 'PNG', optimize=True)
                        else:
                            img_conv = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
                            img_conv.save(path, 'PNG', optimize=True)
                    else:
                        img.save(path, optimize=True)
            except Exception as err:
                print(f"Error processing {path}: {err}")
            
            new_sz = os.path.getsize(path)
            total_new += new_sz

print(f"[Image Compressor] Processed {count} images.")
print(f"[Image Compressor] Original total: {total_orig / (1024*1024):.2f} MB")
print(f"[Image Compressor] New total: {total_new / (1024*1024):.2f} MB")
print(f"[Image Compressor] Total Savings: {((total_orig - total_new) / total_orig) * 100:.1f}%")

# Clean temp test dirs if exist
for temp_dir in ['temp_test_compressed', 'temp_test_compressed2']:
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
