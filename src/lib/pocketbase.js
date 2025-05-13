import PocketBase from 'pocketbase';
import { nanoid, customAlphabet } from 'nanoid'



let pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;
let cfSecret = import.meta.env.VITE_CF_SECRET;

const pb = new PocketBase(pocketBaseURL);


export async function validateToken(token) {
  const response = await fetch('/api/verify-turnstile', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  
  const data = await response.json();
  return data;
}


export async function getRecords(collection) {
  try {
    return await pb.collection(collection).getFullList();
  } catch (err) {
    console.error('Get records error', err);
    throw err;
  }
}
  // get recent
export async function getRecentRecords(collection, perPage = 10, currentPage = 1) {
  const res = await fetch(`${pocketBaseURL}/api/collections/viewList/records?sort=-created&fields=id_url,from,created,subdomain&perPage=${perPage}&page=${currentPage}`)
  return res.json();
}

export async function getFilteredRecords(collection, filter, sort = '') {
  try {
    const filterParam = filter ? `?filter=${filter}` : '';
    const sortParam = sort ? `${filterParam ? '&' : '?'}sort=${sort}` : '';
    const res = await fetch(`${pocketBaseURL}/api/collections/${collection}/records${filterParam}${sortParam}`);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Get filtered records error', err);
    throw err;
  }
}


  
export async function createRecord(collection, data, turnstileToken) {
  try {
    const headers = {};
    if (turnstileToken) {
      headers["X-Turnstile-Token"] = turnstileToken;
    }
    return await pb.collection(collection).create(data, { headers });
  } catch (err) {
    console.error('Create error', err);
    throw err;
  }
}

export async function deleteRecord(collection, id) {
  try {
    return await pb.collection(collection).delete(id);
  } catch (err) {
    console.error('Delete error', err);
    throw err;
  }
}

export async function generateRandomURL() {
  try {
    //start with 4 increase if needed
    let length = 4;
    const maxLength = 8; 
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    
    while (length <= maxLength) {
      const generateNanoId = customAlphabet(alphabet, length);
      let attempts = 0;
      const maxAttempts = 10;

      // this tries the current length multiple times
      while (attempts < maxAttempts) {
        const shortId = generateNanoId();
        const records = await pb.collection('viewList').getList(1, 1, {
          filter: `id_url='${shortId}'`
        });

        if (!records.items.length) {
          return shortId;
        }
        attempts++;
      }

      // If we've exhausted attempts at current length, increase length
      console.warn(`URL generation with length ${length} exhausted, increasing length`);
      length++;
    }

    throw new Error(`Failed to generate unique URL even with maximum length of ${maxLength}`);
  } catch (err) {
    console.error('Generate random error', err);
    throw err;
  }
}