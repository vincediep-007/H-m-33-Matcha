const BASE_URL = 'http://localhost:3000';

async function testApi() {
    try {
        console.log("Fetching Analytics API...");
        const res = await fetch(`${BASE_URL}/api/analytics?timeframe=week`, {
            headers: { 'X-Admin-Pin': '1234' }
        });

        console.log("Status:", res.status);
        if (!res.ok) {
            console.error("Error Text:", await res.text());
            return;
        }

        const data = await res.json();
        console.log("Keys:", Object.keys(data));
        console.log("Total Revenue:", data.totalRevenue);
        console.log("Top Products Count:", data.topProducts ? data.topProducts.length : 'N/A');

        if (data.topProducts && data.topProducts.length > 0) {
            console.log("Sample Product:", data.topProducts[0]);
        }
    } catch (e) {
        console.error("Fetch Failed:", e);
    }
}

testApi();
