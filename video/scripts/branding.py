#!/usr/bin/env python3
"""Draw a QR card whose dark frame doesn't interfere with QR readability."""
import os
from pathlib import Path
import qrcode
from PIL import Image, ImageDraw, ImageFont

out = Path(os.environ.get('OUTPUT_DIR','/out'))/'intermediate'/'qr-panel.png'
url = os.environ.get('VIDEO_SITE_URL','https://europanite.github.io/client_side_audio_transcription/')
out.parent.mkdir(parents=True, exist_ok=True)
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=3, box_size=5)
qr.add_data(url)
qr.make(fit=True)
img = qr.make_image(fill_color='black',back_color='white').convert('RGB')
img.thumbnail((190,190), Image.Resampling.LANCZOS)
card = Image.new('RGBA',(244,265),(9,17,35,242))
draw = ImageDraw.Draw(card)
draw.rounded_rectangle([0,0,243,264], radius=13, fill=(9,17,35,244))
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
draw.text((15,13),'Transcription',font=font,fill='white')
card.paste(img,((244-img.width)//2,46))
draw.text((13,244),'Open the app',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13),fill='#cbd5e1')
card.save(out)
print(f'QR panel: {out}  URL: {url}',flush=True)
