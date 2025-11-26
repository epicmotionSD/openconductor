# OpenConductor Demo Slides

## Generated Slides

- intro-slide.html
- problem-slide.html
- solution-slide.html
- coderStack-slide.html
- writerStack-slide.html
- essentialStack-slide.html
- cta-slide.html

## Usage

### View in Browser
Open any HTML file in a web browser to preview the slide.

### Record for Video
1. Open slide in browser
2. Press F11 for fullscreen
3. Use screen recording software to capture
4. Hold slide for 3-5 seconds

### Convert to Image (Optional)
If you have a screenshot tool installed:

```bash
# Using Firefox headless (if installed)
firefox --headless --screenshot intro-slide.png intro-slide.html

# Using Chrome/Chromium headless (if installed)
chromium-browser --headless --screenshot --window-size=1920,1080 intro-slide.html
```

### Export to PDF (Optional)
Open slide in browser and use "Print to PDF" with these settings:
- Layout: Landscape
- Paper: Custom (19.20 x 10.80 inches)
- Margins: None
- Background graphics: Enabled

## Customization

Edit `generate-slides.js` to:
- Change colors
- Modify content
- Add new slides
- Adjust animations
