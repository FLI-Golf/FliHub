import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

// Authenticate as admin
await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');

console.log('Creating league collection...');

// Create the league collection
const collection = await pb.collections.create({
  name: 'league',
  type: 'base',
  schema: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      options: {
        min: 2,
        max: 100
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      options: {
        min: 2,
        max: 100,
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      }
    },
    {
      name: 'description',
      type: 'text',
      required: false,
      options: {
        max: 500
      }
    },
    {
      name: 'tagline',
      type: 'text',
      required: false,
      options: {
        max: 200
      }
    },
    
    // Gender-Specific Logos (15 files each, 20MB max)
    {
      name: 'logoMens',
      type: 'file',
      required: false,
      options: {
        maxSelect: 15,
        maxSize: 20971520, // 20MB
        mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
        thumbs: ['100x100', '300x300', '500x500']
      }
    },
    {
      name: 'logoWomens',
      type: 'file',
      required: false,
      options: {
        maxSelect: 15,
        maxSize: 20971520, // 20MB
        mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
        thumbs: ['100x100', '300x300', '500x500']
      }
    },
    
    // Additional Branding Assets
    {
      name: 'logoHorizontal',
      type: 'file',
      required: false,
      options: {
        maxSelect: 15,
        maxSize: 20971520,
        mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
        thumbs: ['100x100', '300x300']
      }
    },
    {
      name: 'logoVertical',
      type: 'file',
      required: false,
      options: {
        maxSelect: 15,
        maxSize: 20971520,
        mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
        thumbs: ['100x100', '300x300']
      }
    },
    {
      name: 'logoMonochrome',
      type: 'file',
      required: false,
      options: {
        maxSelect: 15,
        maxSize: 20971520,
        mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
        thumbs: ['100x100', '300x300']
      }
    },
    {
      name: 'logoWordmark',
      type: 'file',
      required: false,
      options: {
        maxSelect: 15,
        maxSize: 20971520,
        mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
        thumbs: ['100x100', '300x300']
      }
    },
    
    // Brand Documentation
    {
      name: 'brandSpecSheet',
      type: 'file',
      required: false,
      options: {
        maxSelect: 1,
        maxSize: 104857600, // 100MB for large PDFs
        mimeTypes: ['application/pdf']
      }
    },
    {
      name: 'brandAssets',
      type: 'file',
      required: false,
      options: {
        maxSelect: 10,
        maxSize: 52428800, // 50MB
        mimeTypes: ['application/zip', 'application/x-zip-compressed']
      }
    },
    
    // Brand Colors
    {
      name: 'primaryColor',
      type: 'text',
      required: false,
      options: {
        max: 7,
        pattern: '^#[0-9A-Fa-f]{6}$'
      }
    },
    {
      name: 'secondaryColor',
      type: 'text',
      required: false,
      options: {
        max: 7,
        pattern: '^#[0-9A-Fa-f]{6}$'
      }
    },
    {
      name: 'accentColor',
      type: 'text',
      required: false,
      options: {
        max: 7,
        pattern: '^#[0-9A-Fa-f]{6}$'
      }
    },
    {
      name: 'colorPalette',
      type: 'json',
      required: false
    },
    
    // Typography
    {
      name: 'primaryFont',
      type: 'text',
      required: false,
      options: {
        max: 100
      }
    },
    {
      name: 'secondaryFont',
      type: 'text',
      required: false,
      options: {
        max: 100
      }
    },
    {
      name: 'typography',
      type: 'json',
      required: false
    },
    
    // Ownership & Financial
    {
      name: 'owner',
      type: 'relation',
      required: false,
      options: {
        collectionId: 'users',
        cascadeDelete: false,
        minSelect: null,
        maxSelect: 1,
        displayFields: ['name', 'email']
      }
    },
    {
      name: 'ownerName',
      type: 'text',
      required: false,
      options: {
        max: 200
      }
    },
    {
      name: 'ownerEmail',
      type: 'text',
      required: false,
      options: {
        max: 200
      }
    },
    {
      name: 'ownerPhone',
      type: 'text',
      required: false,
      options: {
        max: 50
      }
    },
    {
      name: 'purchasePrice',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    {
      name: 'purchaseDate',
      type: 'date',
      required: false
    },
    {
      name: 'valuationCurrent',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    {
      name: 'valuationDate',
      type: 'date',
      required: false
    },
    
    // Contract & Legal
    {
      name: 'contractStartDate',
      type: 'date',
      required: false
    },
    {
      name: 'contractEndDate',
      type: 'date',
      required: false
    },
    {
      name: 'contractTermYears',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    {
      name: 'legalEntity',
      type: 'text',
      required: false,
      options: {
        max: 200
      }
    },
    
    // Status & Operations
    {
      name: 'status',
      type: 'select',
      required: true,
      options: {
        maxSelect: 1,
        values: ['active', 'pending', 'inactive', 'for_sale']
      }
    },
    {
      name: 'foundedYear',
      type: 'number',
      required: false,
      options: {
        min: 1900,
        max: 2100
      }
    },
    {
      name: 'website',
      type: 'url',
      required: false
    },
    {
      name: 'socialMedia',
      type: 'json',
      required: false
    },
    
    // Revenue Tracking
    {
      name: 'revenueYear1',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    {
      name: 'revenueYear2',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    {
      name: 'revenueYear3',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    {
      name: 'projectedRevenue',
      type: 'number',
      required: false,
      options: {
        min: 0
      }
    },
    
    // Notes
    {
      name: 'notes',
      type: 'editor',
      required: false
    }
  ],
  listRule: '@request.auth.id != ""',
  viewRule: '@request.auth.id != ""',
  createRule: '@request.auth.role = "admin"',
  updateRule: '@request.auth.role = "admin" || @request.auth.role = "league_owner"',
  deleteRule: '@request.auth.role = "admin"'
});

console.log('✅ League collection created successfully!');
console.log(`Collection ID: ${collection.id}`);
