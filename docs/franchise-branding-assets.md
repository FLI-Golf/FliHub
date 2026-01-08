# Franchise Branding & Logo Assets

## Overview

Each franchise has comprehensive branding assets including multiple logo variations, brand spec sheets, and color palettes. This system supports professional brand management with multiple file formats and use cases.

## Logo Fields

### 1. logoFull (Main Logo)
**Purpose**: Primary franchise logo for general use

**Specifications**:
- Max files: 5 (multiple formats)
- Max size: 10MB per file
- Formats: PNG, JPEG, SVG, WebP
- Thumbnails: 200x200, 400x400, 800x800

**Use Cases**:
- Website headers
- Marketing materials
- Social media profiles
- Merchandise

**Recommended Files**:
- `franchise-logo.svg` - Vector for scaling
- `franchise-logo.png` - High-res with transparency
- `franchise-logo-white-bg.png` - For light backgrounds
- `franchise-logo-dark-bg.png` - For dark backgrounds

### 2. logoMini (Icon/Mini Logo)
**Purpose**: Compact logo for small spaces

**Specifications**:
- Max files: 5
- Max size: 5MB per file
- Formats: PNG, JPEG, SVG, WebP
- Thumbnails: 50x50, 100x100, 200x200

**Use Cases**:
- Favicons
- App icons
- Social media avatars
- Mobile navigation
- Badges and pins

**Recommended Files**:
- `franchise-icon.svg` - Vector icon
- `franchise-icon-512.png` - High-res for apps
- `franchise-icon-192.png` - Standard size
- `franchise-icon-64.png` - Small size
- `franchise-favicon.ico` - Browser favicon

### 3. logoHorizontal (Wide Logo)
**Purpose**: Horizontal/landscape layout

**Specifications**:
- Max files: 5
- Max size: 10MB per file
- Formats: PNG, JPEG, SVG, WebP
- Thumbnails: 400x100, 800x200

**Use Cases**:
- Website banners
- Email signatures
- Letterheads
- Horizontal ad spaces
- Scoreboards

**Recommended Files**:
- `franchise-horizontal.svg`
- `franchise-horizontal.png`
- `franchise-horizontal-white.png`
- `franchise-horizontal-dark.png`

### 4. logoVertical (Stacked Logo)
**Purpose**: Vertical/portrait layout

**Specifications**:
- Max files: 5
- Max size: 10MB per file
- Formats: PNG, JPEG, SVG, WebP
- Thumbnails: 200x400, 400x800

**Use Cases**:
- Vertical banners
- Posters
- Tall ad spaces
- Mobile displays
- Signage

**Recommended Files**:
- `franchise-vertical.svg`
- `franchise-vertical.png`
- `franchise-vertical-white.png`
- `franchise-vertical-dark.png`

### 5. logoMonochrome (Single Color)
**Purpose**: One-color version for special uses

**Specifications**:
- Max files: 5
- Max size: 10MB per file
- Formats: PNG, JPEG, SVG, WebP
- Thumbnails: 200x200, 400x400

**Use Cases**:
- Embroidery
- Screen printing
- Stamps
- Engraving
- Black & white printing

**Recommended Files**:
- `franchise-mono-black.svg`
- `franchise-mono-white.svg`
- `franchise-mono-primary.svg` (in primary color)

### 6. logoWordmark (Text-Only)
**Purpose**: Text-based logo without icon

**Specifications**:
- Max files: 5
- Max size: 10MB per file
- Formats: PNG, JPEG, SVG, WebP
- Thumbnails: 400x100, 800x200

**Use Cases**:
- Text-heavy designs
- Minimal layouts
- Co-branding
- Subtitles

**Recommended Files**:
- `franchise-wordmark.svg`
- `franchise-wordmark.png`
- `franchise-wordmark-white.png`

## Brand Documentation

### 7. brandSpecSheet (PDF Spec Sheet)
**Purpose**: Artist's brand guidelines and specifications

**Specifications**:
- Max files: 3 (allow for updates)
- Max size: 20MB per file
- Format: PDF only

**Contents Should Include**:
- Logo variations and usage rules
- Color specifications (HEX, RGB, CMYK, Pantone)
- Typography guidelines
- Spacing and clear space requirements
- Do's and don'ts
- Application examples

**Recommended Files**:
- `franchise-brand-guidelines.pdf`
- `franchise-color-specs.pdf`
- `franchise-logo-usage.pdf`

### 8. brandAssets (Additional Files)
**Purpose**: Supporting brand materials

**Specifications**:
- Max files: 20
- Max size: 10MB per file
- Formats: PNG, JPEG, SVG, WebP, PDF, ZIP
- Thumbnails: 200x200, 400x400

**Can Include**:
- Patterns and textures
- Icons and symbols
- Background images
- Mockup templates
- Social media templates
- Presentation templates
- Packaging designs
- Merchandise mockups

## Structured Data

### 9. colorPalette (JSON)
**Purpose**: Programmatic access to brand colors

**Structure**:
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

### 10. typography (JSON)
**Purpose**: Font specifications

**Structure**:
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

## File Organization Best Practices

### Naming Convention
```
{franchise-slug}-{type}-{variant}.{ext}

Examples:
- hyzer-heroes-logo-full.svg
- hyzer-heroes-logo-mini.png
- hyzer-heroes-horizontal-white.png
- hyzer-heroes-mono-black.svg
```

### Recommended File Structure
```
Franchise Branding/
├── Logos/
│   ├── Full/
│   │   ├── hyzer-heroes-logo.svg
│   │   ├── hyzer-heroes-logo.png
│   │   ├── hyzer-heroes-logo-white-bg.png
│   │   └── hyzer-heroes-logo-dark-bg.png
│   ├── Mini/
│   │   ├── hyzer-heroes-icon.svg
│   │   ├── hyzer-heroes-icon-512.png
│   │   └── hyzer-heroes-favicon.ico
│   ├── Horizontal/
│   ├── Vertical/
│   ├── Monochrome/
│   └── Wordmark/
├── Spec Sheets/
│   └── hyzer-heroes-brand-guidelines.pdf
└── Assets/
    ├── Patterns/
    ├── Icons/
    └── Templates/
```

## Upload Script

Create a script to bulk upload logo files:

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';
import { readFileSync } from 'fs';

async function uploadFranchiseLogos(
  franchiseId: string,
  logoFiles: {
    logoFull?: string[];
    logoMini?: string[];
    logoHorizontal?: string[];
    logoVertical?: string[];
    logoMonochrome?: string[];
    logoWordmark?: string[];
    brandSpecSheet?: string[];
    brandAssets?: string[];
  }
) {
  const formData = new FormData();
  
  // Upload each logo type
  for (const [fieldName, filePaths] of Object.entries(logoFiles)) {
    if (filePaths) {
      for (const filePath of filePaths) {
        const fileBuffer = readFileSync(filePath);
        const fileName = filePath.split('/').pop()!;
        
        // Determine MIME type
        let mimeType = 'image/png';
        if (fileName.endsWith('.svg')) mimeType = 'image/svg+xml';
        else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
        else if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
        
        const file = new File([fileBuffer], fileName, { type: mimeType });
        formData.append(fieldName, file);
      }
    }
  }
  
  await pb.collection('franchises').update(franchiseId, formData);
}

// Example usage
await uploadFranchiseLogos('franchise_id', {
  logoFull: [
    './logos/hyzer-heroes-logo.svg',
    './logos/hyzer-heroes-logo.png'
  ],
  logoMini: [
    './logos/hyzer-heroes-icon.svg',
    './logos/hyzer-heroes-icon-512.png'
  ],
  brandSpecSheet: [
    './specs/hyzer-heroes-brand-guidelines.pdf'
  ]
});
```

## Usage in Your App

### Get Logo URLs

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

const franchise = await pb.collection('franchises').getOne(franchiseId);

// Get full logo (first file)
const logoUrl = franchise.logoFull?.[0] 
  ? pb.files.getUrl(franchise, franchise.logoFull[0], { thumb: '400x400' })
  : null;

// Get mini logo
const iconUrl = franchise.logoMini?.[0]
  ? pb.files.getUrl(franchise, franchise.logoMini[0], { thumb: '100x100' })
  : null;

// Get all logo variations
const allLogos = {
  full: franchise.logoFull?.map(f => pb.files.getUrl(franchise, f)),
  mini: franchise.logoMini?.map(f => pb.files.getUrl(franchise, f)),
  horizontal: franchise.logoHorizontal?.map(f => pb.files.getUrl(franchise, f)),
  vertical: franchise.logoVertical?.map(f => pb.files.getUrl(franchise, f)),
  monochrome: franchise.logoMonochrome?.map(f => pb.files.getUrl(franchise, f)),
  wordmark: franchise.logoWordmark?.map(f => pb.files.getUrl(franchise, f))
};
```

### Display Logo with Fallback

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  
  export let franchise: any;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let variant: 'full' | 'mini' | 'horizontal' = 'full';
  
  $: logoField = variant === 'mini' ? 'logoMini' : 
                 variant === 'horizontal' ? 'logoHorizontal' : 
                 'logoFull';
  
  $: thumbSize = size === 'small' ? '100x100' : 
                 size === 'large' ? '800x800' : 
                 '400x400';
  
  $: logoUrl = franchise[logoField]?.[0]
    ? pb.files.getUrl(franchise, franchise[logoField][0], { thumb: thumbSize })
    : null;
    
  $: fallbackColor = franchise.primaryColor || '#3B82F6';
</script>

{#if logoUrl}
  <img 
    src={logoUrl} 
    alt={franchise.name}
    class="franchise-logo {size}"
  />
{:else}
  <!-- Fallback: colored circle with initials -->
  <div 
    class="franchise-logo-fallback {size}"
    style="background-color: {fallbackColor}"
  >
    {franchise.name.substring(0, 2)}
  </div>
{/if}
```

### Logo Selector Component

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  
  export let franchise: any;
  
  const logoTypes = [
    { key: 'logoFull', label: 'Full Logo' },
    { key: 'logoMini', label: 'Mini/Icon' },
    { key: 'logoHorizontal', label: 'Horizontal' },
    { key: 'logoVertical', label: 'Vertical' },
    { key: 'logoMonochrome', label: 'Monochrome' },
    { key: 'logoWordmark', label: 'Wordmark' }
  ];
  
  function getLogoUrl(type: string, index: number = 0) {
    const files = franchise[type];
    if (!files || files.length === 0) return null;
    return pb.files.getUrl(franchise, files[index], { thumb: '400x400' });
  }
</script>

<div class="logo-gallery">
  {#each logoTypes as logoType}
    <div class="logo-section">
      <h3>{logoType.label}</h3>
      
      {#if franchise[logoType.key]?.length > 0}
        <div class="logo-variants">
          {#each franchise[logoType.key] as file, i}
            <div class="logo-item">
              <img 
                src={getLogoUrl(logoType.key, i)} 
                alt="{franchise.name} - {logoType.label} {i + 1}"
              />
              <span class="file-name">{file}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500">No files uploaded</p>
      {/if}
    </div>
  {/each}
</div>
```

### Color Palette Display

```svelte
<script lang="ts">
  export let franchise: any;
  
  $: colors = franchise.colorPalette || {
    primary: { hex: franchise.primaryColor },
    secondary: { hex: franchise.secondaryColor }
  };
</script>

<div class="color-palette">
  <h3>Brand Colors</h3>
  
  {#each Object.entries(colors) as [name, color]}
    {#if typeof color === 'object' && color.hex}
      <div class="color-swatch">
        <div 
          class="color-box"
          style="background-color: {color.hex}"
        />
        <div class="color-info">
          <strong>{color.name || name}</strong>
          <div class="color-codes">
            <span>HEX: {color.hex}</span>
            {#if color.rgb}
              <span>RGB: {color.rgb}</span>
            {/if}
            {#if color.cmyk}
              <span>CMYK: {color.cmyk}</span>
            {/if}
            {#if color.pantone}
              <span>Pantone: {color.pantone}</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/each}
</div>
```

## Brand Spec Sheet Parser

If you want to extract data from PDF spec sheets:

```typescript
// This would require a PDF parsing library
import { extractPDFData } from 'pdf-parse';

async function parseBrandSpecSheet(pdfUrl: string) {
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();
  
  const data = await extractPDFData(buffer);
  
  // Extract colors, fonts, etc. from PDF text
  // This is complex and depends on PDF structure
  
  return {
    colors: extractColors(data.text),
    fonts: extractFonts(data.text),
    guidelines: extractGuidelines(data.text)
  };
}
```

## Migration Script

Run the migration to add logo fields:

```bash
npx tsx src/lib/migrations/add-franchise-logo-fields.ts
```

## Best Practices

### File Formats

1. **SVG** (Recommended for logos)
   - Scalable to any size
   - Small file size
   - Perfect for web and print
   - Use for: All logo variations

2. **PNG** (Recommended for raster)
   - Supports transparency
   - Good quality
   - Use for: Photos, complex graphics

3. **JPEG**
   - Smaller file size
   - No transparency
   - Use for: Photos only

4. **WebP**
   - Modern format
   - Better compression
   - Use for: Web optimization

### File Sizes

- **Logos**: Keep under 500KB
- **Icons**: Keep under 100KB
- **Spec Sheets**: Keep under 10MB
- **Assets**: Optimize before upload

### Organization

1. **Use consistent naming**
2. **Upload all variations at once**
3. **Include both light and dark versions**
4. **Provide vector (SVG) when possible**
5. **Document color codes in JSON**

### Accessibility

- Provide alt text for all logos
- Ensure sufficient color contrast
- Include text alternatives
- Test on different backgrounds

## Troubleshooting

### "File too large"
- Compress images before upload
- Use SVG instead of PNG when possible
- Optimize PDFs (reduce quality, remove unused elements)

### "Invalid MIME type"
- Check file extension matches content
- Ensure file isn't corrupted
- Use supported formats only

### "Logo not displaying"
- Check file was uploaded successfully
- Verify URL generation
- Check file permissions
- Clear browser cache

## Related Files

- `src/lib/migrations/add-franchise-logo-fields.ts` - Field creation script
- `docs/franchise-system.md` - Complete franchise documentation
- `docs/franchise-owners.md` - Owner management
