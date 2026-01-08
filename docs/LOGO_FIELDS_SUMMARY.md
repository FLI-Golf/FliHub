# Franchise Logo Fields - Complete ✅

## What Was Added

### 10 New Branding Fields

**6 Logo Variation Fields:**
1. ✅ **logoFull** - Main logo (5 files, 10MB each)
2. ✅ **logoMini** - Icon/mini logo (5 files, 5MB each)
3. ✅ **logoHorizontal** - Wide layout (5 files, 10MB each)
4. ✅ **logoVertical** - Stacked layout (5 files, 10MB each)
5. ✅ **logoMonochrome** - Single color (5 files, 10MB each)
6. ✅ **logoWordmark** - Text-only (5 files, 10MB each)

**2 Documentation Fields:**
7. ✅ **brandSpecSheet** - PDF spec sheets (3 files, 20MB each)
8. ✅ **brandAssets** - Additional files (20 files, 10MB each)

**2 Data Fields:**
9. ✅ **colorPalette** - JSON color definitions
10. ✅ **typography** - JSON font information

### Old Field Removed
- ❌ Removed old single `logo` field
- ✅ Replaced with comprehensive logo system

## Why This Structure?

### Specific Fields vs. Single Field

**✅ We chose specific fields because:**

1. **Clear Organization**
   - Each logo type has its own field
   - Easy to find what you need
   - No confusion about which file is which

2. **Better Thumbnails**
   - Each field has appropriate thumbnail sizes
   - logoMini gets 50x50, 100x100, 200x200
   - logoFull gets 200x200, 400x400, 800x800

3. **Programmatic Access**
   - Easy to query: `franchise.logoMini[0]`
   - Type-safe in code
   - Clear API structure

4. **Validation**
   - Can set different limits per type
   - Mini logos limited to 5MB
   - Spec sheets can be 20MB

5. **Use Case Clarity**
   - Developers know which logo to use where
   - logoHorizontal for banners
   - logoMini for favicons
   - logoMonochrome for embroidery

**❌ Single field would mean:**
- All files mixed together
- Hard to find the right version
- No type-specific optimization
- Confusing file management

## File Capacity

**Total possible files per franchise:**
- 6 logo types × 5 files = **30 logo files**
- 3 spec sheets = **3 PDFs**
- 20 brand assets = **20 additional files**
- **Total: 53 files** + 2 JSON fields

**Total storage per franchise:**
- Logos: ~50MB (if all maxed out)
- Spec sheets: ~60MB
- Brand assets: ~200MB
- **Total: ~310MB maximum**

## Supported Formats

### Images
- ✅ PNG (recommended for logos with transparency)
- ✅ SVG (recommended for scalability)
- ✅ JPEG (for photos only)
- ✅ WebP (for web optimization)

### Documents
- ✅ PDF (for spec sheets)
- ✅ ZIP (for asset bundles)

## Recommended Upload Priority

### Phase 1: Essential (Upload Now)
```
1. logoFull (SVG + PNG)
2. logoMini (SVG + PNG)  
3. brandSpecSheet (PDF from artist)
4. colorPalette (JSON)
```

### Phase 2: Important (Upload Soon)
```
5. logoHorizontal
6. logoMonochrome
7. typography (JSON)
```

### Phase 3: Nice to Have (Upload Later)
```
8. logoVertical
9. logoWordmark
10. brandAssets
```

## How to Upload

### Option 1: PocketBase Admin UI (Easiest)
1. Go to: `https://pocketbase-production-6ab5.up.railway.app/_/`
2. Navigate to `franchises` collection
3. Click on a franchise
4. Scroll to logo fields
5. Drag and drop files

### Option 2: Bulk Upload Script
See `LOGO_UPLOAD_GUIDE.md` for complete script

### Option 3: Your App
Build an admin interface for franchise owners

## File Naming Convention

```
{franchise-slug}-{type}-{variant}.{ext}

Examples:
✅ hyzer-heroes-logo-full.svg
✅ hyzer-heroes-icon-512.png
✅ hyzer-heroes-horizontal-white.png
✅ hyzer-heroes-mono-black.svg
✅ hyzer-heroes-brand-guidelines.pdf
```

## Usage in Code

### Get Logo URL
```typescript
const franchise = await pb.collection('franchises').getOne(id);

// Main logo
const logoUrl = franchise.logoFull?.[0] 
  ? pb.files.getUrl(franchise, franchise.logoFull[0], { thumb: '400x400' })
  : null;

// Mini icon
const iconUrl = franchise.logoMini?.[0]
  ? pb.files.getUrl(franchise, franchise.logoMini[0], { thumb: '100x100' })
  : null;
```

### Display with Fallback
```svelte
{#if franchise.logoFull?.[0]}
  <img src={pb.files.getUrl(franchise, franchise.logoFull[0])} alt={franchise.name} />
{:else}
  <div style="background: {franchise.primaryColor}">
    {franchise.name.substring(0, 2)}
  </div>
{/if}
```

## Color Palette JSON Example

From your PDF spec sheet, extract and format:

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
  }
}
```

## Typography JSON Example

```json
{
  "primary": {
    "name": "Montserrat",
    "weights": ["400", "600", "700", "900"],
    "usage": "Headlines, logos",
    "fallback": "Arial, sans-serif"
  },
  "secondary": {
    "name": "Open Sans",
    "weights": ["400", "600"],
    "usage": "Body text",
    "fallback": "Helvetica, sans-serif"
  }
}
```

## Migration Script

Already run:
```bash
npx tsx src/lib/migrations/add-franchise-logo-fields.ts
```

**Result:**
- ✅ 10 new fields added
- ✅ Old logo field removed
- ✅ All franchises ready for uploads

## Documentation

📚 **Complete guides created:**

1. **`docs/franchise-branding-assets.md`**
   - Complete field documentation
   - Usage examples
   - Svelte components
   - Best practices

2. **`LOGO_UPLOAD_GUIDE.md`**
   - Step-by-step upload instructions
   - File naming conventions
   - Quality checklist
   - Bulk upload script

## Next Steps

### Immediate
1. **Organize your logo files** by franchise
2. **Upload essential logos** (logoFull, logoMini)
3. **Upload PDF spec sheets** from artist
4. **Extract color codes** and add to colorPalette JSON

### Short-term
5. **Upload remaining logo variations**
6. **Add typography information**
7. **Upload brand assets**
8. **Test display in your app**

### Long-term
9. **Build admin upload interface**
10. **Create logo usage guidelines**
11. **Generate brand style guides**
12. **Automate logo optimization**

## Benefits of This System

✅ **Organized** - Each logo type has its own field
✅ **Flexible** - Multiple files per type (PNG, SVG, etc.)
✅ **Scalable** - Up to 53 files per franchise
✅ **Optimized** - Type-specific thumbnail sizes
✅ **Professional** - Supports complete brand systems
✅ **Future-proof** - Easy to add more variations

## Summary

**Status**: ✅ Logo system fully operational!

**Capacity**: 
- 30 logo files
- 3 spec sheets
- 20 brand assets
- 2 JSON data fields

**Ready for**:
- Multiple file formats
- Various logo types
- Complete brand documentation
- Professional asset management

**Next**: Upload your logos and spec sheets! 🎨
