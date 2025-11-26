# Social Preview Image Guide

## What is it?

The social preview image (1280x640px) appears when your GitHub repo is shared on:
- Twitter/X
- Discord
- Slack
- LinkedIn
- Reddit
- Product Hunt

## Created File

**Location:** `packages/frontend/public/social-preview.svg`

**Content:**
- OpenConductor logo with terminal icon
- Tagline: "The npm for AI Agent Tools"
- Terminal demo showing installation
- Stats: 220+ Servers, One Command, Zero Config
- Brand colors (#0f172a background, #3b82f6 accent)
- Website URL

## Converting SVG to PNG

You need to convert the SVG to PNG (1280x640px) for GitHub upload.

### Option 1: Using Browser (Easiest)

1. **Open the SVG in Chrome/Firefox:**
   ```bash
   cd packages/frontend/public
   open social-preview.svg  # macOS
   # or: xdg-open social-preview.svg  # Linux
   # or: start social-preview.svg     # Windows
   ```

2. **Take a screenshot or use browser dev tools:**
   - Right-click → Inspect
   - Console: Run this JavaScript:
   ```javascript
   const svg = document.querySelector('svg');
   const canvas = document.createElement('canvas');
   canvas.width = 1280;
   canvas.height = 640;
   const ctx = canvas.getContext('2d');
   const data = (new XMLSerializer()).serializeToString(svg);
   const img = new Image();
   img.onload = () => {
     ctx.drawImage(img, 0, 0);
     canvas.toBlob((blob) => {
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'social-preview.png';
       a.click();
     });
   };
   img.src = 'data:image/svg+xml;base64,' + btoa(data);
   ```

### Option 2: Using Online Converter

1. Go to: https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload `social-preview.svg`
3. Set dimensions: 1280x640
4. Download PNG

### Option 3: Using Inkscape (Best Quality)

```bash
# Install Inkscape
sudo apt install inkscape  # Ubuntu/Debian
# or: brew install inkscape  # macOS

# Convert
inkscape social-preview.svg \
  --export-type=png \
  --export-filename=social-preview.png \
  --export-width=1280 \
  --export-height=640
```

### Option 4: Using ImageMagick

```bash
# Install
sudo apt install imagemagick  # Ubuntu/Debian
# or: brew install imagemagick  # macOS

# Convert
convert -background none \
  -density 300 \
  social-preview.svg \
  -resize 1280x640 \
  social-preview.png
```

### Option 5: Using Node.js (sharp)

```bash
npm install -g sharp-cli

# Convert
sharp -i social-preview.svg \
  -o social-preview.png \
  --width 1280 \
  --height 640
```

## Uploading to GitHub

1. **Go to:** https://github.com/epicmotionSD/openconductor/settings

2. **Scroll to:** "Social preview"

3. **Click:** "Upload an image..."

4. **Upload:** `social-preview.png` (1280x640, max 5MB)

5. **Verify:** Share the repo link in Discord/Slack to see the preview

## Quality Checklist

Before uploading, verify:
- [ ] Dimensions: Exactly 1280x640 pixels
- [ ] Format: PNG or JPG
- [ ] Size: Under 5MB
- [ ] Text is readable at thumbnail size
- [ ] Logo is clear and recognizable
- [ ] Colors match brand (#0f172a, #3b82f6)
- [ ] No pixelation or blur

## Testing the Preview

After uploading:

1. **Share on Discord/Slack:**
   ```
   https://github.com/epicmotionSD/openconductor
   ```

2. **Check Twitter Card:**
   - Go to: https://cards-dev.twitter.com/validator
   - Enter: https://github.com/epicmotionSD/openconductor
   - See preview

3. **Check OpenGraph:**
   - Go to: https://www.opengraph.xyz/
   - Enter: https://github.com/epicmotionSD/openconductor
   - See how it looks on different platforms

## Updating the Image

If you need to change it:
1. Edit `social-preview.svg`
2. Re-convert to PNG
3. Re-upload to GitHub Settings
4. Wait ~5 minutes for cache to clear
5. Test with `?v=2` appended to URL to bypass cache

## Alternative Designs

If you want variations, edit the SVG:
- Change background color (`fill="#0f172a"`)
- Adjust terminal example commands
- Update stats (220+ servers, etc.)
- Change font sizes
- Add more visual elements

## Notes

- GitHub caches images for ~1 hour
- The SVG is vector, so it scales perfectly
- You can also use this image on your website
- Consider creating variations for different platforms:
  - Twitter: 1200x630
  - LinkedIn: 1200x627
  - Facebook: 1200x630

---

**Current Status:**
- [x] SVG created
- [ ] Converted to PNG
- [ ] Uploaded to GitHub
- [ ] Tested on social platforms
