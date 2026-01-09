# Next Steps: Upload Remaining 11 Franchises

## What's Complete ✅

1. **Franchise System**: Fully operational with 12 franchises created
2. **Logo Fields**: Configured to accept 15 files each, 30MB PDFs
3. **Ace Makers**: Successfully uploaded with 25 files (12 full, 12 mini, 1 PDF)
4. **Dashboard Pages**: Working franchise list and detail pages
5. **All Code**: Committed and pushed to GitHub

## When You Relaunch the Environment

### 1. Start the Dev Server
```bash
npm run dev
```

The server will start on port 5173. Access it at the Gitpod preview URL.

### 2. Upload Next Franchise

Pick one of the remaining 11 franchises:
- `birdie-storm`
- `chain-breakers`
- `chain-seekers`
- `disc-dynasty`
- `disc-jesters`
- `fairway-bombers`
- `flight-squad`
- `glide-masters`
- `huk-a-mania`
- `hyzer-heroes`
- `midas-touch`

### 3. Create Folder Structure

In VSCode file explorer (right side), create:
```
static/
└── franchise-logos/
    └── {franchise-slug}/     ← e.g., birdie-storm
        ├── full/             ← Regular logos (all formats/colors)
        ├── mini/             ← Mini/icon logos (all formats/colors)
        └── specs/            ← PDF spec sheet
```

### 4. Copy Files from Your Computer

Drag and drop files from your computer into the folders:
- **full/** - Put all regular logo files (SVG, PNG, JPG, including black/white/grey variants)
- **mini/** - Put all mini/icon logo files (SVG, PNG, JPG, including black/white/grey variants)
- **specs/** - Put the PDF spec sheet from the artist

### 5. Run Upload Script

```bash
npx tsx src/lib/migrations/upload-franchise-logos.ts {franchise-slug}
```

Example:
```bash
npx tsx src/lib/migrations/upload-franchise-logos.ts birdie-storm
```

**The script will:**
- ✅ Read all files from the folders
- ✅ Upload them to PocketBase
- ✅ Automatically delete the folder to save space
- ✅ Show you a summary

### 6. Verify Upload

View the franchise in the dashboard:
1. Go to: `https://{your-gitpod-url}/dashboard/franchises`
2. Click on the franchise you just uploaded
3. Scroll down to see all logos
4. Verify all files are there

### 7. Repeat for Remaining Franchises

Repeat steps 3-6 for each of the remaining 10 franchises.

## Quick Reference

### Franchise Slugs
| Franchise Name | Slug |
|----------------|------|
| ✅ Ace Makers | `ace-makers` (DONE) |
| Birdie Storm | `birdie-storm` |
| Chain Breakers | `chain-breakers` |
| Chain Seekers | `chain-seekers` |
| Disc Dynasty | `disc-dynasty` |
| Disc Jesters | `disc-jesters` |
| Fairway Bombers | `fairway-bombers` |
| Flight Squad | `flight-squad` |
| Glide Masters | `glide-masters` |
| Huk-a-Mania | `huk-a-mania` |
| Hyzer Heroes | `hyzer-heroes` |
| Midas Touch | `midas-touch` |

### File Limits
- **Logo fields**: 15 files each
- **Spec sheets**: 30MB per PDF
- **Supported formats**: PNG, SVG, JPEG, WebP, PDF

### Folder Structure Template
```
static/franchise-logos/{slug}/
├── full/          → logoFull field
├── mini/          → logoMini field
├── horizontal/    → logoHorizontal field (optional)
├── vertical/      → logoVertical field (optional)
├── monochrome/    → logoMonochrome field (optional)
├── wordmark/      → logoWordmark field (optional)
├── specs/         → brandSpecSheet field
└── assets/        → brandAssets field (optional)
```

## Troubleshooting

### If dev server isn't running:
```bash
npm run dev
```

### If you get "franchise not found":
- Check the slug matches exactly (lowercase, hyphens)
- Verify the franchise exists in the database

### If files aren't uploading:
- Check file formats (PNG, SVG, JPEG, WebP, PDF only)
- Verify files are in the correct subfolders
- Check file sizes (under 30MB for PDFs, under 10MB for images)

### If folder doesn't auto-delete:
```bash
rm -rf static/franchise-logos/{franchise-slug}
```

## Tips for Efficiency

1. **One at a time**: Upload one franchise, verify it works, then move to the next
2. **Check the dashboard**: Always verify uploads in the web UI
3. **Keep files organized**: Use consistent naming on your computer
4. **Save space**: The script auto-deletes folders after upload

## Documentation

All documentation is in the `docs/` folder:
- `docs/franchise-system.md` - Complete franchise system docs
- `docs/franchise-branding-assets.md` - Logo field details
- `UPLOAD_LOGOS_WORKFLOW.md` - Detailed upload workflow

## Current Status

**Completed**: 1 of 12 franchises (8.3%)
**Remaining**: 11 franchises
**Total Files Uploaded**: 25 files (Ace Makers)
**Estimated Time**: ~5-10 minutes per franchise

---

**Ready to continue!** Start with any of the remaining 11 franchises. 🚀
