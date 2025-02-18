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

export const load = async ({ params, request }) => {
    const slug = params.slug;
    const res = await fetch(`${pocketBaseURL}/api/collections/viewList/records?filter=(id_url='${slug}')`);
    const data = await res.json();
    console.log(data)
    console.log(slug)
    console.log("Initial data items:", data.items)
    try {
        const recordId = data?.items[0].id;
        link = data?.items[0].from;
        const utmView = data?.items[0].utm_view;
        console.log(`[Debug] Current UTM view count for ${slug}:`, utmView);
        console.log('record ID :', recordId)

        // Log all request headers
        console.log('[Debug] All Request Headers:');
        for (const [key, value] of request.headers) {
            console.log(`${key}: ${value}`);
        }

        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const forwardedFor = request.headers.get('x-forwarded-for');
        const cf_ipcountry = request.headers.get('CF-IPCountry')
        console.log('IP', cf_ipcountry)
        const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 'Unknown';

        try {
            await createRecord('analytics', {
                author: recordId,
                utm_userAgent: userAgent,
                utm_country: clientIP, // In production, you might want to use a geo-ip service here
                url_id: recordId,
                created: new Date().toISOString()
            });
            console.log(`[Debug] Created analytics record for ${slug}`);
        } catch (err) {
            console.error('Error creating analytics record', err);
            // Non-blocking error - we'll still redirect even if analytics fails
        }


        
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
    } catch (err) {
        throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
    }
    
    throw redirect(303, link);
};

