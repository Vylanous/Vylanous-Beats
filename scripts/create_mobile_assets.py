from pathlib import Path
from PIL import Image, ImageOps

root = Path('/home/ubuntu/Vylanous-Beats')
source = root / 'packages/web/public/brand/Favicon.png'
target = root / 'packages/mobile/assets'
target.mkdir(parents=True, exist_ok=True)

mark = Image.open(source).convert('RGBA')
black = (11, 10, 17, 255)

# Square app icon: retain the recognizable center mark with an intentional safety margin.
icon = Image.new('RGBA', (1024, 1024), black)
mark_icon = ImageOps.contain(mark, (900, 900), Image.Resampling.LANCZOS)
icon.alpha_composite(mark_icon, ((1024 - mark_icon.width) // 2, (1024 - mark_icon.height) // 2))
icon.save(target / 'icon.png')

# Android adaptive foreground: transparent mark with generous safe zone.
foreground = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
mark_foreground = ImageOps.contain(mark, (660, 660), Image.Resampling.LANCZOS)
foreground.alpha_composite(mark_foreground, ((1024 - mark_foreground.width) // 2, (1024 - mark_foreground.height) // 2))
foreground.save(target / 'adaptive-icon.png')

# Splash icon: simple brand mark on the specified dark native background.
splash = Image.new('RGBA', (1284, 2778), black)
mark_splash = ImageOps.contain(mark, (580, 580), Image.Resampling.LANCZOS)
splash.alpha_composite(mark_splash, ((1284 - mark_splash.width) // 2, 830))
splash.save(target / 'splash-icon.png')

# Web fallback favicon remains a compact square mark.
mark.resize((512, 512), Image.Resampling.LANCZOS).save(target / 'favicon.png')
print('Created mobile assets:', ', '.join(p.name for p in target.glob('*.png')))
