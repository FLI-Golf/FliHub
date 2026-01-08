# Franchise Logo Upload Guide

## Quick Start

You now have **10 dedicated fields** for franchise branding assets:

### Logo Fields (6 types)
1. **logoFull** - Main logo (5 files max)
2. **logoMini** - Icon/mini logo (5 files max)
3. **logoHorizontal** - Wide layout (5 files max)
4. **logoVertical** - Stacked layout (5 files max)
5. **logoMonochrome** - Single color (5 files max)
6. **logoWordmark** - Text-only (5 files max)

### Documentation Fields (2 types)
7. **brandSpecSheet** - PDF spec sheets (3 files max, 20MB each)
8. **brandAssets** - Additional files (20 files max)

### Data Fields (2 types)
9. **colorPalette** - JSON color definitions
10. **typography** - JSON font information

## Recommended Upload Strategy

### Option 1: Upload via PocketBase Admin UI (Easiest)

1. Go to: `https://pocketbase-production-6ab5.up.railway.app/_/`
2. Navigate to `franchises` collection
3. Click on a franchise (e.g., "Hyzer Heroes")
4. Scroll to logo fields
5. Drag and drop files into each field

**Advantages:**
- Visual interface
- Immediate feedback
- No coding required
- Can see thumbnails

### Option 2: Bulk Upload Script (Fastest for Multiple Franchises)

Create a folder structure:
```
franchise-logos/
├── hyzer-heroes/
│   ├── full/
│   │   ├── logo.svg
│   │   ├── logo.png
│   │   └── logo-white-bg.png
│   ├── mini/
│   │   ├── icon.svg
│   │   └── icon-512.png
│   ├── horizontal/
│   ├── vertical/
│   ├── monochrome/
│   ├── wordmark/
│   ├── specs/
│   │   └── brand-guidelines.pdf
│   └── assets/
├── huk-a-mania/
└── ...
```

Then use the upload script (see documentation).

### Option 3: Upload via Your App

Build an admin interface in your app for franchise owners to upload their own logos.

## File Naming Recommendations

### Pattern
```
{franchise-slug}-{type}-{variant}.{ext}
```

### Examples
```
✅ Good:
- hyzer-heroes-logo-full.svg
- hyzer-heroes-icon-512.png
- hyzer-heroes-horizontal-white.png
- hyzer-heroes-mono-black.svg
- hyzer-heroes-brand-guidelines.pdf

❌ Avoid:
- logo.png (too generic)
- HH_LOGO_FINAL_v3_FINAL.png (confusing)
- image001.jpg (meaningless)
```

## What to Upload for Each Field

### 1. logoFull (Main Logo)
**Upload 3-5 files:**
- ✅ `{franchise}-logo.svg` - Vector version (required)
- ✅ `{franchise}-logo.png` - High-res PNG with transparency
- ✅ `{franchise}-logo-white-bg.png` - For light backgrounds
- ✅ `{franchise}-logo-dark-bg.png` - For dark backgrounds
- ⭐ `{franchise}-logo.webp` - Web-optimized (optional)

**Specifications:**
- SVG: Vector, any size
- PNG: 2000x2000px minimum, transparent background
- File size: Under 2MB each

### 2. logoMini (Icon)
**Upload 3-4 files:**
- ✅ `{franchise}-icon.svg` - Vector icon
- ✅ `{franchise}-icon-512.png` - 512x512px
- ✅ `{franchise}-icon-192.png` - 192x192px
- ⭐ `{franchise}-favicon.ico` - 32x32px (optional)

**Specifications:**
- Square format (1:1 ratio)
- Simplified design (works at small sizes)
- File size: Under 500KB each

### 3. logoHorizontal (Wide)
**Upload 2-3 files:**
- ✅ `{franchise}-horizontal.svg`
- ✅ `{franchise}-horizontal.png`
- ⭐ `{franchise}-horizontal-white.png` (for dark backgrounds)

**Specifications:**
- Wide format (3:1 or 4:1 ratio)
- 1200x300px minimum for PNG
- File size: Under 1MB each

### 4. logoVertical (Stacked)
**Upload 2-3 files:**
- ✅ `{franchise}-vertical.svg`
- ✅ `{franchise}-vertical.png`
- ⭐ `{franchise}-vertical-white.png`

**Specifications:**
- Tall format (1:2 or 1:3 ratio)
- 600x1200px minimum for PNG
- File size: Under 1MB each

### 5. logoMonochrome (Single Color)
**Upload 2-3 files:**
- ✅ `{franchise}-mono-black.svg` - Black version
- ✅ `{franchise}-mono-white.svg` - White version
- ⭐ `{franchise}-mono-primary.svg` - In primary color

**Specifications:**
- Single color only
- No gradients or effects
- Perfect for embroidery, stamps, engraving

### 6. logoWordmark (Text-Only)
**Upload 2-3 files:**
- ✅ `{franchise}-wordmark.svg`
- ✅ `{franchise}-wordmark.png`
- ⭐ `{franchise}-wordmark-white.png`

**Specifications:**
- Text-based logo without icon
- Wide format preferred
- File size: Under 500KB each

### 7. brandSpecSheet (PDF from Artist)
**Upload 1-3 files:**
- ✅ `{franchise}-brand-guidelines.pdf` - Complete guidelines
- ⭐ `{franchise}-color-specs.pdf` - Color specifications
- ⭐ `{franchise}-logo-usage.pdf` - Usage rules

**Should Include:**
- Logo variations
- Color codes (HEX, RGB, CMYK, Pantone)
- Typography specifications
- Spacing requirements
- Usage examples
- Do's and don'ts

**Specifications:**
- PDF format only
- Up to 20MB per file
- High quality, print-ready

### 8. brandAssets (Additional Files)
**Can include:**
- Patterns and textures
- Icon sets
- Background images
- Social media templates
- Mockup templates
- Packaging designs
- Merchandise examples

**Specifications:**
- Various formats: PNG, JPEG, SVG, PDF, ZIP
- Up to 20 files
- 10MB per file

### 9. colorPalette (JSON)
**Paste this JSON structure:**
```json
{
  "primary": {
    "name": "Blue",
    "hex": "#1E40AF",
    "rgb": "30, 64, 175",
    "cmyk": "83, 63, 0, 31",
    "pantone": "2945 C"
  },
  "secondary": {
    "name": "Gold",
    "hex": "#FBBF24",
    "rgb": "251, 191, 36",
    "cmyk": "0, 24, 86, 2",
    "pantone": "1235 C"
  },
  "accent": {
    "name": "White",
    "hex": "#FFFFFF",
    "rgb": "255, 255, 255",
    "cmyk": "0, 0, 0, 0"
  },
  "neutral": {
    "dark": "#1F2937",
    "medium": "#6B7280",
    "light": "#F3F4F6"
  }
}
```

**Extract from PDF spec sheet:**
- Copy color codes from artist's PDF
- Include all color formats
- Add Pantone codes if available

### 10. typography (JSON)
**Paste this JSON structure:**
```json
{
  "primary": {
    "name": "Montserrat",
    "weights": ["400", "600", "700", "900"],
    "usage": "Headlines, logos, emphasis",
    "fallback": "Arial, sans-serif",
    "webFont": "https://fonts.google.com/specimen/Montserrat"
  },
  "secondary": {
    "name": "Open Sans",
    "weights": ["400", "600"],
    "usage": "Body text, descriptions",
    "fallback": "Helvetica, sans-serif",
    "webFont": "https://fonts.google.com/specimen/Open+Sans"
  }
}
```

## Priority Upload Order

### Phase 1: Essential (Do First)
1. ✅ **logoFull** - Main logo (SVG + PNG)
2. ✅ **logoMini** - Icon (SVG + PNG)
3. ✅ **brandSpecSheet** - PDF from artist
4. ✅ **colorPalette** - JSON with color codes

### Phase 2: Important (Do Soon)
5. ✅ **logoHorizontal** - Wide layout
6. ✅ **logoMonochrome** - Single color version
7. ✅ **typography** - Font information

### Phase 3: Nice to Have (Do Later)
8. ⭐ **logoVertical** - Stacked layout
9. ⭐ **logoWordmark** - Text-only
10. ⭐ **brandAssets** - Additional files

## File Preparation Checklist

### Before Uploading
- [ ] Files are named consistently
- [ ] SVG files are optimized (remove unnecessary code)
- [ ] PNG files have transparent backgrounds
- [ ] Images are high resolution (2x or 3x for retina)
- [ ] File sizes are optimized (compressed)
- [ ] Colors match brand guidelines
- [ ] All variations are included

### Quality Check
- [ ] Logos look sharp at all sizes
- [ ] Transparent backgrounds work on light and dark
- [ ] Monochrome versions are clear
- [ ] PDF spec sheet is readable
- [ ] Color codes are accurate
- [ ] File names are descriptive

## Common Issues & Solutions

### Issue: "File too large"
**Solution:**
- Compress images using TinyPNG or ImageOptim
- Optimize SVG files using SVGOMG
- Reduce PDF quality in Adobe Acrobat
- Remove unused elements from files

### Issue: "Logo looks blurry"
**Solution:**
- Use SVG format (scales perfectly)
- Increase PNG resolution (2000x2000px minimum)
- Export at 2x or 3x size
- Use PNG instead of JPEG

### Issue: "Transparent background not working"
**Solution:**
- Save as PNG (not JPEG)
- Ensure transparency is enabled in export
- Check alpha channel is present
- Test on both light and dark backgrounds

### Issue: "Colors don't match"
**Solution:**
- Use exact HEX codes from spec sheet
- Export in RGB color space for web
- Use CMYK for print materials
- Calibrate your monitor

## Bulk Upload Script Example

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

async function uploadFranchiseLogos(franchiseSlug: string) {
  // Get franchise
  const franchises = await pb.collection('franchises').getFullList({
    filter: `slug = "${franchiseSlug}"`
  });
  
  if (franchises.length === 0) {
    throw new Error(`Franchise not found: ${franchiseSlug}`);
  }
  
  const franchise = franchises[0];
  const basePath = `./franchise-logos/${franchiseSlug}`;
  
  const formData = new FormData();
  
  // Upload each logo type
  const logoTypes = [
    'full', 'mini', 'horizontal', 'vertical', 
    'monochrome', 'wordmark'
  ];
  
  for (const type of logoTypes) {
    const dirPath = join(basePath, type);
    
    try {
      const files = readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = join(dirPath, file);
        const fileBuffer = readFileSync(filePath);
        
        // Determine MIME type
        let mimeType = 'image/png';
        if (file.endsWith('.svg')) mimeType = 'image/svg+xml';
        else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (file.endsWith('.webp')) mimeType = 'image/webp';
        
        const fileObj = new File([fileBuffer], file, { type: mimeType });
        
        // Map directory name to field name
        const fieldName = `logo${type.charAt(0).toUpperCase() + type.slice(1)}`;
        formData.append(fieldName, fileObj);
      }
    } catch (e) {
      console.log(`No ${type} logos found, skipping...`);
    }
  }
  
  // Upload spec sheets
  try {
    const specFiles = readdirSync(join(basePath, 'specs'));
    for (const file of specFiles) {
      const filePath = join(basePath, 'specs', file);
      const fileBuffer = readFileSync(filePath);
      const fileObj = new File([fileBuffer], file, { type: 'application/pdf' });
      formData.append('brandSpecSheet', fileObj);
    }
  } catch (e) {
    console.log('No spec sheets found, skipping...');
  }
  
  // Update franchise
  await pb.collection('franchises').update(franchise.id, formData);
  console.log(`✅ Uploaded logos for ${franchise.name}`);
}

// Upload for all franchises
const franchises = [
  'hyzer-heroes', 'huk-a-mania', 'flight-squad', 
  'birdie-storm', 'chain-breakers', 'disc-jesters',
  'midas-touch', 'chain-seekers', 'fairway-bombers',
  'disc-dynasty', 'ace-makers', 'glide-masters'
];

for (const slug of franchises) {
  await uploadFranchiseLogos(slug);
}
```

## Next Steps

1. **Organize your files** using the recommended structure
2. **Upload essential logos first** (logoFull, logoMini, brandSpecSheet)
3. **Add color palette JSON** from the PDF spec sheet
4. **Upload remaining variations** as time permits
5. **Test display** in your app to ensure everything looks good

## Need Help?

- See `docs/franchise-branding-assets.md` for complete documentation
- Check PocketBase admin UI for upload interface
- Review uploaded files to ensure quality
- Test logos on different backgrounds

---

**Status**: ✅ Logo fields added and ready for uploads!
