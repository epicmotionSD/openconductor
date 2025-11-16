# PWA Icons TODO

The following icon files are referenced in the PWA configuration but need to be created:

## Required Icons

1. **favicon.ico** (16x16, 32x32, 48x48)
   - Classic browser favicon
   - Should be a simple, recognizable icon

2. **icon-192.png** (192x192)
   - Android home screen icon
   - Should be maskable (safe area in center)

3. **icon-512.png** (512x512)
   - Android splash screen and app icon
   - Should be maskable (safe area in center)

4. **apple-touch-icon.png** (180x180)
   - iOS home screen icon
   - Should have rounded corners baked in

5. **og-image.png** (1200x630)
   - Open Graph / Twitter Card image
   - Used when sharing on social media

6. **screenshot-discover.png** (1280x720)
   - PWA screenshot for app stores
   - Show the /discover page

## Design Guidelines

- **Brand Colors**: Primary #2563eb (blue), Background #ffffff
- **Logo**: Terminal icon + "OpenConductor" text
- **Style**: Clean, modern, minimal
- **Safe Area**: Keep important content 10% from edges for maskable icons

## Tools for Generation

- **Favicon**: https://realfavicongenerator.net/
- **PWA Icons**: https://www.pwabuilder.com/imageGenerator
- **Design**: Figma, Canva, or Adobe Illustrator

## After Creating Icons

1. Place all files in `/packages/frontend/public/`
2. Delete this PWA_ICONS_TODO.md file
3. Rebuild the app to generate service worker with new icons
