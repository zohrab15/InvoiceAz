import os
import requests

def download_assets():
    # Use absolute paths or relative to project root
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    media_dir = os.path.join(base_dir, 'backend', 'media')
    avatar_dir = os.path.join(media_dir, 'avatars')
    logo_dir = os.path.join(media_dir, 'logos')
    
    os.makedirs(avatar_dir, exist_ok=True)
    os.makedirs(logo_dir, exist_ok=True)
    
    # Avatar: Realistic professional headshot
    avatar_url = 'https://i.pravatar.cc/500?u=demo_user@invoice.az'
    # Logo: Modern tech logo placeholder
    logo_url = 'https://dummyimage.com/500x500/0f172a/ffffff.png&text=MS'
    
    try:
        print(f"Downloading avatar to {avatar_dir}...")
        r_avatar = requests.get(avatar_url)
        if r_avatar.status_code == 200:
            with open(os.path.join(avatar_dir, 'demo_avatar.jpg'), 'wb') as f:
                f.write(r_avatar.content)
            print("Avatar saved.")
        else:
            print(f"Failed to download avatar: {r_avatar.status_code}")
            
        print(f"Downloading logo to {logo_dir}...")
        r_logo = requests.get(logo_url)
        if r_logo.status_code == 200:
            with open(os.path.join(logo_dir, 'demo_logo.png'), 'wb') as f:
                f.write(r_logo.content)
            print("Logo saved.")
        else:
            print(f"Failed to download logo: {r_logo.status_code}")
            
    except Exception as e:
        print(f"Error downloading assets: {e}")

if __name__ == "__main__":
    download_assets()
