import os
import sys
import yaml
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

def add_text_to_image(image_path, city_data, output_path):
    try:
        img = Image.open(image_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    draw = ImageDraw.Draw(img)
    width, height = img.size

    # Load Font (Try to find a system font that supports Arabic)
    # Windows usually has Arial or Segoe UI
    font_path = "C:\\Windows\\Fonts\\arial.ttf"
    if not os.path.exists(font_path):
        font_path = "C:\\Windows\\Fonts\\seguiemj.ttf" # Segoe UI Emoji often has good support
    
    if not os.path.exists(font_path):
        print("Warning: Could not find Arial or Segoe UI font. Text might not render.")
        # Fallback to default (won't support Arabic well)
        font = ImageFont.load_default()
    else:
        try:
            # Title Font
            title_font_size = int(height * 0.08) # 8% of image height
            title_font = ImageFont.truetype(font_path, title_font_size)
            
            # Subtitle Font
            subtitle_font_size = int(height * 0.04)
            subtitle_font = ImageFont.truetype(font_path, subtitle_font_size)
            
            # Bubble Font
            bubble_font_size = int(height * 0.03)
            bubble_font = ImageFont.truetype(font_path, bubble_font_size)
        except Exception as e:
            print(f"Error loading font: {e}")
            return

    # Helper to process Arabic text
    def process_text(text):
        reshaped_text = arabic_reshaper.reshape(text)
        bidi_text = get_display(reshaped_text)
        return bidi_text

    # 1. Draw Title (Top Center)
    if 'City' in city_data:
        title_text = f"مدينة {city_data['City']}"
        processed_title = process_text(title_text)
        
        # Calculate text size using getbbox
        left, top, right, bottom = draw.textbbox((0, 0), processed_title, font=title_font)
        text_width = right - left
        text_height = bottom - top
        
        x = (width - text_width) / 2
        y = height * 0.05 # 5% from top
        
        # Draw shadow/outline for visibility
        shadow_color = "black"
        text_color = "white"
        
        # Simple shadow
        draw.text((x+2, y+2), processed_title, font=title_font, fill=shadow_color)
        draw.text((x, y), processed_title, font=title_font, fill=text_color)

    # 2. Draw Key Messages (as bubbles or list)
    # For this script, let's just overlay them at the bottom or corners
    # Or try to simulate the "floating bubbles" if we had coordinates, but we don't.
    # So we'll list them at the bottom.
    
    if 'KeyMessages' in city_data:
        messages = city_data['KeyMessages']
        start_y = height * 0.75
        
        for i, msg in enumerate(messages):
            processed_msg = process_text(msg)
            
            # Smaller font for messages
            left, top, right, bottom = draw.textbbox((0, 0), processed_msg, font=bubble_font)
            msg_width = right - left
            msg_height = bottom - top
            
            x = (width - msg_width) / 2
            y = start_y + (i * (msg_height + 10))
            
            # Draw background pill
            padding = 10
            draw.rectangle([x - padding, y - padding, x + msg_width + padding, y + msg_height + padding], fill=(0, 0, 0, 128), outline="white", width=2)
            
            draw.text((x, y), processed_msg, font=bubble_font, fill="white")

    # Save
    img.save(output_path)
    print(f"Saved fixed image to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_text.py <image_path> <city_name>")
        sys.exit(1)

    image_path = sys.argv[1]
    city_name = sys.argv[2]
    
    # Load YAML to get data
    try:
        with open('ads_tiktok.yaml', 'r', encoding='utf-8') as f:
            ads_data = yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading ads_tiktok.yaml: {e}")
        sys.exit(1)
        
    # Find city data
    city_data = next((item for item in ads_data if item['City'] == city_name), None)
    
    if not city_data:
        print(f"City '{city_name}' not found in ads_tiktok.yaml")
        sys.exit(1)
        
    output_path = f"fixed_{os.path.basename(image_path)}"
    add_text_to_image(image_path, city_data, output_path)
