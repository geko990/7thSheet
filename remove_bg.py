
from PIL import Image
import numpy as np

def make_white_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If pixel is white (or very close), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            # Also apply some alpha based on brightness to blend edges?
            # Simple approach: just keep non-white pixels
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

make_white_transparent("assets/empty_characters_transparent.png", "assets/empty_characters_transparent_fixed.png")
