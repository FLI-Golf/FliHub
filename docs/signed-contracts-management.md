# Signed Contracts Management

This document describes the signed contracts system for professional disc golfers in the FliHub application.

## Overview

The pros collection has two contract-related fields:

1. **signedContract** (JSON) - Legacy field containing contract metadata from SeaTable
2. **signedContracts** (File) - New field for storing actual contract files

## Field Configuration

### signedContracts Field

- **Type**: File (multiple)
- **Max files**: 10 (allows multiple contracts per pro)
- **Max size per file**: 10MB
- **Allowed types**:
  - PDF (`.pdf`) - `application/pdf`
  - Word (`.doc`) - `application/msword`
  - Word (`.docx`) - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - JPEG (`.jpg`, `.jpeg`) - `image/jpeg`
  - PNG (`.png`) - `image/png`

### signedContract Field (Legacy)

- **Type**: JSON
- **Purpose**: Stores metadata about contracts from SeaTable
- **Structure**:
  ```json
  {
    "name": "Pro Name Letter of Intent.pdf",
    "size": 245225,
    "type": "file",
    "url": "https://cloud.seatable.io/workspace/.../file.pdf",
    "upload_time": "2024-08-29T01:36:33.521+00:00"
  }
  ```

## Scripts

### 1. Configure signedContracts Field

Configures the signedContracts file field with proper settings.

```bash
npx tsx src/lib/migrations/configure-signed-contracts.ts
```

**What it does:**
- Updates maxSelect to 10 (multiple contracts)
- Sets maxSize to 10MB per file
- Configures allowed MIME types
- Removes thumbnail generation (not needed for documents)

**Output:**
```
✅ signedContracts field updated successfully!

New configuration:
   Max files: 10 (multiple contracts per pro)
   Max size per file: 10MB
   Allowed types:
     - PDF (.pdf)
     - Word (.doc, .docx)
     - Images (.jpg, .png) for scanned contracts
```

### 2. Import Contract Files (Currently Not Working)

**Status**: ⚠️ Not functional - URLs require authentication

The script `src/lib/migrations/import-contract-files.ts` was created to download contracts from SeaTable URLs, but these URLs require authentication and return HTML login pages instead of PDF files.

**Issue**: The URLs in the `signedContract` JSON field point to SeaTable's cloud storage which requires authentication. Direct downloads return HTML pages, not PDF files.

**Workaround Options**:

1. **Manual Upload** (Recommended)
   - Download contracts from SeaTable manually
   - Upload through PocketBase admin UI
   - Or use the app's file upload interface

2. **SeaTable API Integration**
   - Implement SeaTable API authentication
   - Use their API to download files with proper credentials
   - Requires SeaTable API key and permissions

3. **Direct File Access**
   - If you have direct access to the files on SeaTable's server
   - Export files and upload them locally

## Recommended Configuration

Based on your needs, here's the recommended setup:

### Field Structure

```typescript
{
  name: 'signedContracts',
  type: 'file',
  maxSelect: 10,        // Up to 10 contracts per pro
  maxSize: 10485760,    // 10MB per file
  mimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ],
  required: false,
  protected: false      // Allow public access if needed
}
```

### Why Multiple Contracts?

- **Contract Amendments**: Pros may have updated contracts
- **Multiple Agreements**: Different types of agreements (sponsorship, appearance, etc.)
- **Historical Records**: Keep old contracts for reference
- **Addendums**: Additional documents related to the main contract

### File Size Considerations

**10MB per file** is recommended because:
- Most PDF contracts are 200KB - 2MB
- Scanned contracts (images) can be 2-5MB
- Allows for high-quality scans
- Prevents abuse with very large files

If you need larger files:
- Increase `maxSize` to 20MB or 50MB
- Consider file compression for scanned documents
- Use PDF optimization tools

## Usage in Your App

### Upload Contracts

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

async function uploadContracts(proId: string, files: FileList) {
  const formData = new FormData();
  
  // Add all selected files
  for (let i = 0; i < files.length; i++) {
    formData.append('signedContracts', files[i]);
  }
  
  await pb.collection('pros').update(proId, formData);
}
```

### Get Contract URLs

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

// Get pro record
const pro = await pb.collection('pros').getOne(proId);

// Get URLs for all contracts
const contractUrls = pro.signedContracts?.map((filename: string) => 
  pb.files.getUrl(pro, filename)
) || [];
```

### Display Contracts List

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  
  export let pro: any;
  
  $: contracts = pro.signedContracts || [];
  
  function getContractUrl(filename: string) {
    return pb.files.getUrl(pro, filename);
  }
  
  function getFileIcon(filename: string) {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return '🖼️';
    return '📎';
  }
</script>

<div class="contracts-list">
  <h3>Signed Contracts ({contracts.length})</h3>
  
  {#if contracts.length === 0}
    <p class="text-gray-500">No contracts uploaded</p>
  {:else}
    <ul>
      {#each contracts as contract}
        <li>
          <a 
            href={getContractUrl(contract)} 
            target="_blank"
            class="flex items-center gap-2 hover:underline"
          >
            <span>{getFileIcon(contract)}</span>
            <span>{contract}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

### Upload Form Component

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  
  export let proId: string;
  
  let files: FileList;
  let uploading = false;
  let error = '';
  
  async function handleUpload() {
    if (!files || files.length === 0) return;
    
    uploading = true;
    error = '';
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          error = `File ${file.name} is too large (max 10MB)`;
          uploading = false;
          return;
        }
        
        // Validate file type
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png'
        ];
        
        if (!validTypes.includes(file.type)) {
          error = `File ${file.name} has invalid type. Only PDF, Word, and images allowed.`;
          uploading = false;
          return;
        }
        
        formData.append('signedContracts', file);
      }
      
      await pb.collection('pros').update(proId, formData);
      
      // Reset form
      files = null as any;
      
      // Reload page or emit event
      window.location.reload();
      
    } catch (err: any) {
      error = err.message || 'Failed to upload contracts';
    } finally {
      uploading = false;
    }
  }
</script>

<div class="upload-form">
  <label for="contracts">
    Upload Contracts (PDF, Word, or Images)
  </label>
  
  <input
    id="contracts"
    type="file"
    bind:files
    multiple
    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
    disabled={uploading}
  />
  
  {#if files && files.length > 0}
    <p>{files.length} file(s) selected</p>
  {/if}
  
  {#if error}
    <p class="text-red-500">{error}</p>
  {/if}
  
  <button 
    on:click={handleUpload}
    disabled={!files || files.length === 0 || uploading}
  >
    {uploading ? 'Uploading...' : 'Upload Contracts'}
  </button>
</div>
```

## Data Migration Strategy

Since automatic import from SeaTable URLs doesn't work, here's the recommended migration path:

### Option 1: Manual Upload (Simplest)

1. **Export from SeaTable**
   - Download all contract files from SeaTable
   - Organize by pro name

2. **Upload via PocketBase Admin**
   - Go to PocketBase admin UI
   - Navigate to pros collection
   - Edit each pro record
   - Upload contract files to signedContracts field

3. **Keep JSON metadata**
   - Leave signedContract field as-is for reference
   - Contains upload dates and original filenames

### Option 2: Bulk Upload Script

If you can export all files from SeaTable:

```typescript
// Place all contract files in a folder structure:
// contracts/
//   Gannon Buhr/
//     Letter of Intent.pdf
//   Ricky Wysocki/
//     Letter of Intent.pdf
//   ...

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

async function bulkUpload() {
  const contractsDir = './contracts';
  const pros = await pb.collection('pros').getFullList();
  
  for (const pro of pros) {
    const proDir = join(contractsDir, pro.name);
    if (!existsSync(proDir)) continue;
    
    const files = readdirSync(proDir);
    if (files.length === 0) continue;
    
    const formData = new FormData();
    
    for (const filename of files) {
      const filePath = join(proDir, filename);
      const fileBuffer = readFileSync(filePath);
      const file = new File([fileBuffer], filename, {
        type: 'application/pdf'
      });
      formData.append('signedContracts', file);
    }
    
    await pb.collection('pros').update(pro.id, formData);
    console.log(`✅ Uploaded contracts for ${pro.name}`);
  }
}
```

### Option 3: SeaTable API Integration

If you have SeaTable API access:

1. Get SeaTable API credentials
2. Use their API to download files with authentication
3. Upload to PocketBase

This requires SeaTable API documentation and credentials.

## Security Considerations

### Access Control

Current rules allow authenticated users to view/upload contracts:
```javascript
listRule: "@request.auth.id != \"\""
viewRule: "@request.auth.id != \"\""
createRule: "@request.auth.id != \"\""
updateRule: "@request.auth.id != \"\""
deleteRule: "@request.auth.id != \"\""
```

### Recommendations

1. **Restrict uploads** to admins only:
   ```javascript
   updateRule: "@request.auth.role = 'admin'"
   ```

2. **Allow pros to view their own contracts**:
   ```javascript
   viewRule: "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = 'admin')"
   ```

3. **Protect sensitive information**:
   - Set `protected: true` on signedContracts field
   - Requires authentication to access files
   - Files won't be publicly accessible

4. **Audit trail**:
   - PocketBase automatically tracks created/updated timestamps
   - Consider adding a changelog for contract updates

## Best Practices

1. **File Naming**:
   - Use descriptive names: "2024-Contract-Amendment.pdf"
   - Include dates: "2024-01-15-Letter-of-Intent.pdf"
   - Avoid special characters

2. **Organization**:
   - Upload original contract first
   - Add amendments chronologically
   - Keep related documents together

3. **Validation**:
   - Always validate file types on upload
   - Check file sizes before upload
   - Scan for viruses if accepting user uploads

4. **Backup**:
   - Regularly backup PocketBase data
   - Keep original files in secure location
   - Document contract versions

## Troubleshooting

### "Invalid MIME type" error
- Ensure file is actually a PDF/Word/Image
- Check file isn't corrupted
- Verify file extension matches content

### "File too large" error
- Compress PDF files
- Reduce image quality for scanned contracts
- Split large documents into multiple files

### "Failed to update record" error
- Check authentication
- Verify field configuration
- Ensure maxSelect isn't exceeded

## Related Files

- `src/lib/migrations/configure-signed-contracts.ts` - Field configuration script
- `src/lib/migrations/import-contract-files.ts` - Import script (not functional)
- `docs/avatar-management.md` - Similar file upload documentation
