import os
import shutil

# Define source and destination
source_dir = r"C:\Windows\Fonts"
dest_dir = os.path.join(os.getcwd(), "static", "fonts")

# Create destination directory if it doesn't exist
os.makedirs(dest_dir, exist_ok=True)

# List of fonts to copy
fonts = [
    "arial.ttf",
    "arialbd.ttf", # Bold
    "ariali.ttf",  # Italic
    "arialbi.ttf"  # Bold Italic
]

print(f"Copying fonts to {dest_dir}...")

for font in fonts:
    src_path = os.path.join(source_dir, font)
    dest_path = os.path.join(dest_dir, font)
    
    try:
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            print(f"Successfully copied {font}")
        else:
            print(f"Warning: {font} not found in {source_dir}")
            # Try naive capitalization check
            src_path_cap = os.path.join(source_dir, font.capitalize())
            if os.path.exists(src_path_cap):
                 shutil.copy2(src_path_cap, dest_path)
                 print(f"Successfully copied {font} (found cap)")

    except Exception as e:
        print(f"Error copying {font}: {e}")

print("Font copy operation complete.")
