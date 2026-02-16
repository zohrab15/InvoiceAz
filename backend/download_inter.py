import os
import requests

def download_file(url, filename):
    print(f"Downloading {url}...")
    try:
        response = requests.get(url, timeout=20)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"Successfully saved to {filename}")
            return True
        else:
            print(f"Failed to download {url}. Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

dest_dir = os.path.join(os.getcwd(), "static", "fonts")
os.makedirs(dest_dir, exist_ok=True)

# Using jsDelivr CDN links (stable)
font_files = {
    "Inter-Regular.ttf": "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Regular.ttf",
    "Inter-Bold.ttf": "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Bold.ttf",
}

success_count = 0
for filename, url in font_files.items():
    dest_path = os.path.join(dest_dir, filename)
    if download_file(url, dest_path):
        success_count += 1

print(f"Font download complete. Success: {success_count}")
