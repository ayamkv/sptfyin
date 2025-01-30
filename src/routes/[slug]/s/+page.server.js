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
let link = null;

export const load = async ({ params }) => {
    const slug = params.slug
    console.log(slug)
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
       
    } catch (err) {
        throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
    }

    return {
       utmView: data?.items[0].utm_view,
    };
};