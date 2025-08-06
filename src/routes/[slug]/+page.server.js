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

// Function to check if user agent is a bot or crawler
function isBot(userAgent) {
    const botPatterns = [
        'whatsapp',
        'telegram',
        'twitter',
        'bot',
        'crawler',
        'spider',
        'slurp',
        'mediapartners-google',
        'facebookexternalhit',
        'telegrambot',
        'google-safety',
        'google-firebase',
        'unknown',
        'okhttp',
        'python-requests/2.32.3',
        'node-fetch',
        'node',
        'help@dataminr.com',
        'axios',
        'dub.co',
        'iframe',
        'siteinfo'
    ];
    
    userAgent = userAgent.toLowerCase();
    return botPatterns.some(pattern => userAgent.includes(pattern));
}

export const prerender = false;

export const load = async ({ params, request }) => {
    const slug = params.slug;
    const res = await fetch(`${pocketBaseURL}/api/collections/viewList/records?filter=(id_url='${slug}')`);
    const data = await res.json();

    try {
        const recordId = data?.items[0].id;
        link = data?.items[0].from;
        const utmView = data?.items[0].utm_view;        
        const userAgent = request.headers.get('user-agent') || 'Unknown';        // Log if it's a bot (for debugging) but don't block access
        if (isBot(userAgent)) {
            console.log(`[Debug] Bot access detected: ${userAgent}`);
        }

        console.log(`[Debug] Current UTM view count for ${slug}:`, utmView);
        console.log('record ID :', recordId)

        // Analytics tracking
        if (!isBot(userAgent)) {
            const cf_ipcountry = request.headers.get('CF-IPCountry')
            console.log('CF IP', cf_ipcountry)
            const forwardedFor = request.headers.get('x-forwarded-for');
            console.log('Forwarded for', forwardedFor)
            
            try {
                await createRecord('analytics', {
                    author: recordId,
                    utm_userAgent: userAgent,
                    utm_country: cf_ipcountry,
                    url_id: recordId,
                    rawData: cf_ipcountry,
                    created: new Date().toISOString()
                });
                console.log(`[Debug] Created analytics record for ${slug}`);
            } catch (err) {
                console.error('Error creating analytics record', err);
            }
        }

        if (!recordId) {
            throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
        }
        
        // View count increment
        if (!isBot(userAgent)) {
            try {
                await updateRecord('random_short', recordId, {
                    "utm_view+": 1
                });
                console.log(`[Debug] Successfully incremented UTM view for ${slug}`);
            } catch (err) {
                console.error('Error incrementing UTM view', err);
                throw err;
            }
        }
    } catch (err) {
        throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
    }
    
    redirect(301, link);
};
