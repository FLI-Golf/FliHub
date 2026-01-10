# Logo Upload Workflow

## Step-by-Step Process

### 1. Create Folder Structure

In VSCode (right side), create this structure in `static/`:

```
static/
└── franchise-logos/
    └── hyzer-heroes/          ← Start with one franchise
        ├── full/              ← Main logos
        ├── mini/              ← Icons/favicons
        ├── horizontal/        ← Wide layouts (optional)
        ├── vertical/          ← Stacked layouts (optional)
        ├── monochrome/        ← Single color (optional)
        ├── wordmark/          ← Text-only (optional)
        ├── specs/             ← PDF spec sheets
        └── assets/            ← Additional files (optional)
```

### 2. Upload Files from Your Computer

**In VSCode file explorer (right side):**
1. Navigate to `static/franchise-logos/hyzer-heroes/full/`
2. Drag and drop your logo files from your computer
3. Repeat for each subfolder

**Or use the upload button:**
1. Right-click on a folder
2. Click "Upload..."
3. Select files from your computer

### 3. Run the Upload Script

```bash
# Upload one franchise
npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes

# The script will:
# ✅ Read all files from static/franchise-logos/hyzer-heroes/
# ✅ Upload them to PocketBase
# ✅ Delete the folder automatically (to save space)
```

### 4. Repeat for Next Franchise

```bash
# Create folder for next franchise
static/franchise-logos/huk-a-mania/

# Upload files to it
# Run script
npx tsx src/lib/migrations/upload-franchise-logos.ts huk-a-mania
```

## Folder Mapping

The script automatically maps folders to fields:

| Folder Name | → | PocketBase Field |
|-------------|---|------------------|
| `full/` | → | `logoFull` |
| `mini/` | → | `logoMini` |
| `horizontal/` | → | `logoHorizontal` |
| `vertical/` | → | `logoVertical` |
| `monochrome/` | → | `logoMonochrome` |
| `wordmark/` | → | `logoWordmark` |
| `specs/` | → | `brandSpecSheet` |
| `assets/` | → | `brandAssets` |

## What Files to Put Where

### full/ (Required)
- Main logo in multiple formats
- `hyzer-heroes-logo.svg`
- `hyzer-heroes-logo.png`
- `hyzer-heroes-logo-white-bg.png`

### mini/ (Required)
- Icon/favicon versions
- `hyzer-heroes-icon.svg`
- `hyzer-heroes-icon-512.png`
- `hyzer-heroes-icon-192.png`

### specs/ (Recommended)
- PDF spec sheet from artist
- `hyzer-heroes-brand-guidelines.pdf`

### horizontal/, vertical/, monochrome/, wordmark/ (Optional)
- Additional logo variations
- Upload if you have them

### assets/ (Optional)
- Patterns, templates, mockups
- Upload if you have them

## Script Options

### Upload One Franchise
```bash
npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes
```

### Upload All Franchises at Once
```bash
# If you have multiple franchise folders ready
npx tsx src/lib/migrations/upload-franchise-logos.ts all
```

### Keep Folder After Upload (Don't Delete)
```bash
npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes --keep
```

## Example Output

```
🔐 Authenticating to https://pocketbase-production-6ab5.up.railway.app...
✅ Authenticated

📋 Found franchise: Hyzer Heroes

📁 Reading files from: static/franchise-logos/hyzer-heroes/

📂 Processing full/ (3 files):
   ✅ hyzer-heroes-logo.svg (45.2 KB)
   ✅ hyzer-heroes-logo.png (234.5 KB)
   ✅ hyzer-heroes-logo-white-bg.png (198.3 KB)

📂 Processing mini/ (2 files):
   ✅ hyzer-heroes-icon.svg (12.1 KB)
   ✅ hyzer-heroes-icon-512.png (89.4 KB)

📂 Processing specs/ (1 files):
   ✅ hyzer-heroes-brand-guidelines.pdf (2.3 MB)

⏭️  Skipping horizontal/ (folder not found)
⏭️  Skipping vertical/ (folder not found)
⏭️  Skipping monochrome/ (folder not found)
⏭️  Skipping wordmark/ (folder not found)
⏭️  Skipping assets/ (folder not found)

📤 Uploading 6 files to PocketBase...

✅ Upload successful!

📊 Summary:
   logoFull: 3 file(s)
   logoMini: 2 file(s)
   brandSpecSheet: 1 file(s)
   Total: 6 file(s)

🗑️  Deleting folder: static/franchise-logos/hyzer-heroes/
✅ Folder deleted to save space

✅ Done!
```

## Workflow for All 12 Franchises

### Efficient Approach (One at a Time)

```bash
# 1. Hyzer Heroes
# - Create folder: static/franchise-logos/hyzer-heroes/
# - Upload files from your computer
# - Run: npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes
# - Folder auto-deletes

# 2. Huk-a-Mania
# - Create folder: static/franchise-logos/huk-a-mania/
# - Upload files
# - Run: npx tsx src/lib/migrations/upload-franchise-logos.ts huk-a-mania
# - Folder auto-deletes

# 3. Continue for remaining franchises...
```

### Batch Approach (If You Have Time)

```bash
# 1. Create all 12 franchise folders
static/franchise-logos/
├── hyzer-heroes/
├── huk-a-mania/
├── flight-squad/
├── birdie-storm/
├── chain-breakers/
├── disc-jesters/
├── midas-touch/
├── chain-seekers/
├── fairway-bombers/
├── disc-dynasty/
├── ace-makers/
└── glide-masters/

# 2. Upload all files to respective folders

# 3. Run once to upload all
npx tsx src/lib/migrations/upload-franchise-logos.ts all
```

## Franchise Slugs Reference

| Franchise Name | Slug |
|----------------|------|
| Hyzer Heroes | `hyzer-heroes` |
| Huk-a-Mania | `huk-a-mania` |
| Flight Squad | `flight-squad` |
| Birdie Storm | `birdie-storm` |
| Chain Breakers | `chain-breakers` |
| Disc Jesters | `disc-jesters` |
| Midas Touch | `midas-touch` |
| Chain Seekers | `chain-seekers` |
| Fairway Bombers | `fairway-bombers` |
| Disc Dynasty | `disc-dynasty` |
| Ace Makers | `ace-makers` |
| Glide Masters | `glide-masters` |

## Tips

### Space Management
- ✅ Script auto-deletes folders after upload (saves space)
- ✅ Only keep one franchise folder at a time
- ✅ Upload, delete, move to next

### File Organization
- ✅ Name files consistently
- ✅ Use lowercase with hyphens
- ✅ Include franchise slug in filename

### Verification
After upload, check in PocketBase admin:
1. Go to: `https://pocketbase-production-6ab5.up.railway.app/_/`
2. Navigate to `franchises` collection
3. Click on the franchise
4. Scroll to logo fields
5. Verify files are there

## Troubleshooting

### "Folder not found"
- Make sure you created: `static/franchise-logos/{franchise-slug}/`
- Check spelling of franchise slug

### "Franchise not found"
- Check franchise slug matches exactly
- Use hyphens, not spaces
- All lowercase

### "No files found to upload"
- Make sure files are in subfolders (full/, mini/, etc.)
- Not directly in franchise folder

### Files not uploading
- Check file formats (PNG, SVG, JPEG, WebP, PDF)
- Check file sizes (under 10MB for logos, 20MB for PDFs)
- Make sure files aren't corrupted

## Need Help?

Run the script without arguments to see usage:
```bash
npx tsx src/lib/migrations/upload-franchise-logos.ts
```

---

**Ready to start?** Create `static/franchise-logos/hyzer-heroes/` and upload your first batch of files!
