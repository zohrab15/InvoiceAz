import os
import requests

def download_assets():
    avatar_dir = 'backend/media/avatars'
    logo_dir = 'backend/media/logos'
    
    os.makedirs(avatar_dir, exist_ok=True)
    os.makedirs(logo_dir, exist_ok=True)
    
    # Avatar: Realistic professional headshot
    avatar_url = 'https://i.pravatar.cc/500?u=demo_user@invoice.az'
    # Logo: Modern tech logo placeholder
    logo_url = 'https://dummyimage.com/500x500/0f172a/ffffff.png&text=MS'
    
    try:
        print(f"Downloading avatar from {avatar_url}...")
        r_avatar = requests.get(avatar_url)
        if r_avatar.status_code == 200:
            with open(os.path.join(avatar_dir, 'demo_avatar.jpg'), 'wb') as f:
                f.write(r_avatar.content)
            print("Avatar saved.")
            
        print(f"Downloading logo from {logo_url}...")
        r_logo = requests.get(logo_url)
        if r_logo.status_code == 200:
            with open(os.path.join(logo_dir, 'demo_logo.png'), 'wb') as f:
                f.write(r_logo.content)
            print("Logo saved.")
            
    except Exception as e:
        print(f"Error downloading assets: {e}")

if __name__ == "__main__":
    download_assets()
