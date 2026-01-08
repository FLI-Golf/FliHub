# Avatar Management for Pros

This document describes the avatar system for professional disc golfers in the FliHub application.

## Overview

The pros collection now includes an `avatar` field that stores profile images. We have three scripts to manage avatars:

1. **Add Avatar Field** - Adds the avatar field to the collection
2. **Import from URLs** - Downloads and uploads images from external URLs
3. **Generate Placeholders** - Creates SVG avatars with initials for pros without images

## Avatar Field Configuration

- **Type**: File
- **Max files**: 1
- **Max size**: 5MB
- **Allowed types**: JPEG, PNG, GIF, WebP, SVG
- **Thumbnails**: 100x100, 300x300, 500x500

## Scripts

### 1. Add Avatar Field

Adds the avatar file field to the pros collection.

```bash
npx tsx src/lib/migrations/add-avatar-field.ts
```

**What it does:**
- Checks if avatar field already exists
- Adds avatar field with proper configuration
- Configures allowed MIME types and thumbnail sizes

**Output:**
```
✅ Avatar field added successfully!

Field configuration:
   Name: avatar
   Type: file
   Max files: 1
   Max size: 5MB
   Allowed types: JPEG, PNG, GIF, WebP, SVG
   Thumbnails: 100x100, 300x300, 500x500
```

### 2. Import Avatar Images from URLs

Downloads images from URLs and uploads them to PocketBase.

```bash
# Use default CSV path (static/csv_data/Pros.csv)
npx tsx src/lib/migrations/import-avatar-images.ts

# Or specify custom CSV path
npx tsx src/lib/migrations/import-avatar-images.ts path/to/custom.csv
```

**What it does:**
- Reads image URLs from CSV (Photo or In-Action Photo columns)
- Downloads images from URLs
- Uploads to PocketBase as avatar files
- Skips pros that already have avatars
- Falls back to `photo` field if CSV doesn't have URL

**CSV Format:**
The script looks for these columns:
- `Photo`
- `In-Action Photo`
- `photo`
- `image`

**Output:**
```
📊 Import Summary:
   Downloaded: 5
   Uploaded: 5
   Skipped: 18
   Errors: 0
```

### 3. Generate Placeholder Avatars

Creates SVG avatars with initials for pros without images.

```bash
npx tsx src/lib/migrations/generate-placeholder-avatars.ts
```

**What it does:**
- Finds all pros without avatars
- Generates colorful SVG avatars with initials
- Uses consistent colors based on name (same name = same color)
- Uploads SVG files to PocketBase
- Skips pros that already have avatars

**Features:**
- **Initials**: First letter of first name + first letter of last name
- **Colors**: 10 different color schemes, consistently assigned by name
- **Format**: SVG (scalable, small file size)
- **Size**: 500x500px

**Output:**
```
📊 Generation Summary:
   Generated: 23
   Uploaded: 23
   Errors: 0
```

## Usage Workflow

### Initial Setup

1. **Add the field** (one-time):
   ```bash
   npx tsx src/lib/migrations/add-avatar-field.ts
   ```

2. **Generate placeholders** for all pros:
   ```bash
   npx tsx src/lib/migrations/generate-placeholder-avatars.ts
   ```

### Importing Real Images

When you have image URLs:

1. **Add URLs to CSV** in the `Photo` or `In-Action Photo` column

2. **Run import script**:
   ```bash
   npx tsx src/lib/migrations/import-avatar-images.ts
   ```

3. **Generate placeholders** for any remaining pros without images:
   ```bash
   npx tsx src/lib/migrations/generate-placeholder-avatars.ts
   ```

## Displaying Avatars in Your App

### Get Avatar URL

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

// Get pro record
const pro = await pb.collection('pros').getOne(proId);

// Get avatar URL with thumbnail
const avatarUrl = pro.avatar 
  ? pb.files.getUrl(pro, pro.avatar, { thumb: '300x300' })
  : pro.photo || '/default-avatar.png';
```

### Available Thumbnail Sizes

- `100x100` - Small (list views, badges)
- `300x300` - Medium (cards, profiles)
- `500x500` - Large (detail pages)

### Svelte Component Example

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  
  export let pro: any;
  
  $: avatarUrl = pro.avatar 
    ? pb.files.getUrl(pro, pro.avatar, { thumb: '300x300' })
    : pro.photo || '/default-avatar.png';
</script>

<img 
  src={avatarUrl} 
  alt={pro.name}
  class="w-24 h-24 rounded-full object-cover"
/>
```

## Color Schemes

The placeholder generator uses 10 color schemes:

1. Blue (#3B82F6)
2. Green (#10B981)
3. Amber (#F59E0B)
4. Red (#EF4444)
5. Purple (#8B5CF6)
6. Pink (#EC4899)
7. Cyan (#06B6D4)
8. Orange (#F97316)
9. Teal (#14B8A6)
10. Indigo (#6366F1)

Colors are assigned consistently based on the pro's name, so the same pro always gets the same color.

## File Storage

- **Location**: PocketBase handles file storage automatically
- **Temp files**: Scripts create `temp_avatars/` directory during processing (automatically cleaned up)
- **Naming**: Files are named with the pro's ID (e.g., `abc123xyz456789.svg`)

## Troubleshooting

### "Avatar field already exists"
The field is already added. Skip to importing or generating avatars.

### "Failed to download image"
- Check that the URL is accessible
- Verify the URL points to an actual image file
- Check network connectivity

### "Invalid MIME type"
The image format is not supported. Supported formats:
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG

### "Failed to update record"
- Verify admin credentials in `.env`
- Check PocketBase connection
- Ensure the pros collection exists

## Future Enhancements

Potential improvements:

1. **Batch processing** - Process multiple pros in parallel
2. **Image optimization** - Compress images before upload
3. **Face detection** - Auto-crop to focus on faces
4. **PDGA integration** - Fetch images from PDGA profiles
5. **Manual upload UI** - Admin interface for uploading avatars
6. **Image validation** - Check image quality and dimensions

## Related Files

- `src/lib/migrations/add-avatar-field.ts` - Field creation script
- `src/lib/migrations/import-avatar-images.ts` - URL import script
- `src/lib/migrations/generate-placeholder-avatars.ts` - Placeholder generator
- `static/csv_data/Pros.csv` - Source data with potential image URLs
