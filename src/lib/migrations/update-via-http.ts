import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

async function updateViaHTTP() {
  try {
    // Authenticate first
    await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');
    console.log('✅ Authenticated\n');

    const token = pb.authStore.token;
    const collections = await pb.collections.getFullList();
    const managers = collections.find(c => c.name === 'managers');

    if (!managers) {
      console.error('❌ Managers collection not found');
      return;
    }

    console.log('🔄 Updating managers via HTTP API...');
    console.log('Collection ID:', managers.id);

    // Try updating via direct HTTP
    const response = await fetch(
      `https://pocketbase-production-6ab5.up.railway.app/api/collections/${managers.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          schema: [
            {
              name: 'name',
              type: 'text',
              required: true,
              options: {
                min: 1,
                max: 255
              }
            },
            {
              name: 'department',
              type: 'select',
              required: true,
              options: {
                maxSelect: 1,
                values: [
                  'Publicist',
                  'Sales',
                  'Product Development',
                  'Finance',
                  'Marketing and PR',
                  'Technical',
                  'Production',
                  'Consultant',
                  'Operations',
                  'Apparel'
                ]
              }
            },
            {
              name: 'email',
              type: 'email',
              required: false
            },
            {
              name: 'phone',
              type: 'text',
              required: false
            },
            {
              name: 'goals',
              type: 'editor',
              required: false
            }
          ]
        })
      }
    );

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('Fields:', result.schema?.length || 0);
    } else {
      console.error('❌ Error:', result);
    }
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

updateViaHTTP();
