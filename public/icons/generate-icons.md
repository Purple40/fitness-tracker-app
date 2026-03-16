# PWA Icon Generation

To generate the required PWA icons, you can use one of these methods:

## Option 1: Use a PWA Icon Generator (Recommended)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 PNG of your app icon
3. Download the generated icon pack
4. Place the icons in this `/public/icons/` directory

## Option 2: Use sharp or jimp (Node.js)
```bash
npm install -g sharp-cli
# Then generate icons from a source 512x512 PNG:
sharp -i source-icon.png -o icon-72x72.png resize 72 72
sharp -i source-icon.png -o icon-96x96.png resize 96 96
sharp -i source-icon.png -o icon-128x128.png resize 128 128
sharp -i source-icon.png -o icon-144x144.png resize 144 144
sharp -i source-icon.png -o icon-152x152.png resize 152 152
sharp -i source-icon.png -o icon-192x192.png resize 192 192
sharp -i source-icon.png -o icon-384x384.png resize 384 384
sharp -i source-icon.png -o icon-512x512.png resize 512 512
```

## Required Icon Sizes
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Temporary Placeholder
Until you generate real icons, the app will still work — the manifest will just reference missing files.
The browser will use the favicon as fallback.
