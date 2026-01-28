// Native fetch

// Native fetch fallback
const _fetch = global.fetch || require('node-fetch');

async function main() {
    console.log("🚀 Triggering Schema Migration...");
    try {
        const res = await _fetch('http://localhost:3000/api/migrate', {
            headers: { 'X-Admin-Pin': '1234' }
        });
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        // Fallback for extremely old node, but user has Node 24
        console.error(e);
        // Try native fetch if require failed
        if (e.code === 'MODULE_NOT_FOUND') {
            const res = await fetch('http://localhost:3000/api/migrate', { headers: { 'X-Admin-Pin': '1234' } });
            console.log("Response:", await res.json());
        }
    }
}
main();
