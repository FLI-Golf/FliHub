import * as fs from 'fs';
import * as path from 'path';

const jsonPath = path.join(process.cwd(), 'json_data', 'pocketbase-import-no-relations.json');
const collections = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('🔧 Fixing field format for PocketBase import...\n');

collections.forEach((collection: any) => {
  console.log(`Processing: ${collection.name}`);
  
  collection.fields = collection.fields.map((field: any) => {
    // Skip system id field
    if (field.name === 'id' && field.system) {
      return field;
    }
    
    // For select fields, move values and maxSelect to top level
    if (field.type === 'select' && field.options) {
      const { maxSelect, values, ...otherOptions } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        maxSelect: maxSelect || 1,
        values: values || []
      };
    }
    
    // For text fields, flatten options
    if (field.type === 'text' && field.options) {
      const { min, max, pattern } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        min: min,
        max: max,
        pattern: pattern || ''
      };
    }
    
    // For email fields
    if (field.type === 'email' && field.options) {
      const { exceptDomains, onlyDomains } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        exceptDomains: exceptDomains || [],
        onlyDomains: onlyDomains || []
      };
    }
    
    // For number fields
    if (field.type === 'number' && field.options) {
      const { min, max, noDecimal } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        min: min,
        max: max,
        noDecimal: noDecimal || false
      };
    }
    
    // For date fields
    if (field.type === 'date' && field.options) {
      const { min, max } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        min: min || '',
        max: max || ''
      };
    }
    
    // For editor fields
    if (field.type === 'editor' && field.options) {
      const { convertUrls } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        convertUrls: convertUrls || false
      };
    }
    
    // For url fields
    if (field.type === 'url' && field.options) {
      const { exceptDomains, onlyDomains } = field.options;
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        exceptDomains: exceptDomains || [],
        onlyDomains: onlyDomains || []
      };
    }
    
    // Default: return as-is
    return field;
  });
  
  const customFields = collection.fields.filter((f: any) => f.name !== 'id');
  console.log(`  ✅ Fixed ${customFields.length} fields`);
});

// Write the fixed JSON
fs.writeFileSync(jsonPath, JSON.stringify(collections, null, 2));

console.log('\n✅ Fixed import format!');
console.log(`📄 Updated: ${jsonPath}`);
