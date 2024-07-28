// GET returns image from fetch request to `https://api.screenshotmachine.com/?key=b1c78b&url=sptfy.in&device=phone&dimension=480x800&format=jpg&cacheLimit=14`

export const GET = async ({ params }) => {
    try {
        const res = await fetch('https://api.screenshotmachine.com/?key=b1c78b&url=sptfy.in&device=phone&dimension=480x800&format=jpg&cacheLimit=14');
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await res.blob();
        return new Response(blob, {
            headers: {
                'Content-Type': 'image/jpeg'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}