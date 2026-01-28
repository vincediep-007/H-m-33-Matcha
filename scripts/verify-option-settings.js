const BASE_URL = 'http://localhost:3000';
const ADMIN_PIN = '1234';

async function verifySettings() {
    console.log("🧪 Verifying Option Group Settings...");

    // 1. Create a Test Group
    console.log("1. Creating Test Group...");
    const createRes = await fetch(`${BASE_URL}/api/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({
            type: 'group',
            name: 'Test Settings Group',
            description: 'Temporary',
            isMultiSelect: false,
            isRequired: false
        })
    });
    const { id } = await createRes.json();
    console.log("   -> Created Group ID:", id);

    // 2. Edit Group -> Enable MultiSelect & Required
    console.log("2. Updating: MultiSelect=TRUE, Required=TRUE...");
    await fetch(`${BASE_URL}/api/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({
            type: 'group',
            id: id,
            name: 'Test Settings Group',
            description: 'Updated',
            isMultiSelect: true,
            isRequired: true
        })
    });

    // 3. Check Persistence
    console.log("3. Fetching to verify...");
    const getRes = await fetch(`${BASE_URL}/api/options`);
    const groups = await getRes.json();
    const group = groups.find(g => g.id === id);

    console.log("   -> Is Multi Select?", group.is_multi_select);
    console.log("   -> Is Required?", group.is_required);

    if (group.is_multi_select === 1 && group.is_required === 1) {
        console.log("✅ SUCCESS: Settings Saved!");
    } else {
        console.error("❌ FAILURE: Settings did not save.");
    }

    // 4. Clean up
    console.log("4. Cleaning up...");
    await fetch(`${BASE_URL}/api/options`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({ type: 'group', id: id })
    });
}

verifySettings();
