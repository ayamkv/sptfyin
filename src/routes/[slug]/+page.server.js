import { redirect, error } from '@sveltejs/kit';
import { getRecords } from '$lib/pocketbase';
let pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;


let link = null
export const load = async ({ params }) => {
    const slug = params.slug;
    const res = await fetch(`${pocketBaseURL}/api/collections/random_short/records?filter=(id_url='${slug}')`);
    const data = await res.json();
    
    console.log(data.items)
    try {
        link = data?.items[0].from
    } catch (error) {
        link = null
    }
    
    // const headers = new Headers({
    //     'Content-Type': 'application/json'
    // });
    // Return the slug in JSON format
    // return new Response(JSON.stringify({ 
    //     slug: slug,
    //     data: data.items[0].from
    //  }), { headers });
    if (link) {
        throw redirect(303, link);
    } else {
        throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠'); 
    }
    // return { slug: slug, data: data };
};


// test load page with just echoing the slug back in web without page.svelt

// export const GET = async ({ params }) => {
//     const slug = params.slug;
//     // Set the appropriate headers for JSON response
    
// };