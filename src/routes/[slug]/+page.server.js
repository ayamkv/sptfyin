import { redirect, error } from '@sveltejs/kit';
import {
    getRecords,
    createRecord,
    generateRandomURL,
    updateRecord,
    getRecentRecords,
    validateToken
} from '$lib/pocketbase';
let pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;


let link = null


// async function incrementUTMView(recordId, utm_view) {
//     try {
//         const record = await getRecords('random_short', recordId);
//         const updatedData = {
//             "utm_view": utm_view + 1
//         };
//         await updateRecord('random_short', recordId, updatedData);
//     } catch (err) {
//         console.error('Error incrementing UTM view', err);
//         throw err;
//     }
// }

export const load = async ({ params }) => {
    const slug = params.slug;
    const res = await fetch(`${pocketBaseURL}/api/collections/random_short/records?filter=(id_url='${slug}')`);
    const data = await res.json();
    
    console.log("Initial data items:", data.items)
    try {
        const recordId = data?.items[0].id;
        link = data?.items[0].from;
        const utmView = data?.items[0].utm_view;
        console.log(`[Debug] Current UTM view count for ${slug}:`, utmView);
        
        if (!recordId) {
            throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
        }
        
        try {
            await updateRecord('random_short', recordId, {
                "utm_view+": 1
            });
            console.log(`[Debug] Successfully incremented UTM view for ${slug}`);
        } catch (err) {
            console.error('Error incrementing UTM view', err);
            throw err;
        }
    } catch (error) {
        throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
    }
    
    throw redirect(303, link);
};

// test load page with just echoing the slug back in web without page.svelt

// export const GET = async ({ params }) => {
//     const slug = params.slug;
//     // Set the appropriate headers for JSON response
    
// };