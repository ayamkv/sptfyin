
import { myFetch } from './fetchWrapper.js';

import { nanoid, customAlphabet } from 'nanoid'



let pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;
let cfSecret = import.meta.env.VITE_CF_SECRET;

export async function validateToken(token) {
  const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
          mode: 'cors',
          method: 'POST',
          headers: {
              'content-type': 'application/json',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': '*',
          },
          body: JSON.stringify({
              response: token,
              secret: cfSecret,
          }),
      },
  );
  
  response.headers.append('Access-Control-Allow-Origin', '*');

  const data = await response.json();

  return {
      // Return the status
      success: data.success,

      // Return the first error if it exists
      error: data['error-codes']?.length ? data['error-codes'][0] : null,
  };
}

export async function getRecords(collection) {
    const res = await myFetch(`${pocketBaseURL}/api/collections/${collection}/records`);
    return res.json();
  }

  // get recent
export async function getRecentRecords(collection) {
  const res = await fetch(`${pocketBaseURL}/api/collections/random_short/records?sort=-created&fields=id_url,from,created`)
  return res.json();
}
  
export async function createRecord(collection, data) {
  const res = await myFetch(`${pocketBaseURL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateRecord(collection, id, data) {
  const res = await myFetch(`${pocketBaseURL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteRecord(collection, id) {
  const res = await myFetch(`${pocketBaseURL}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function generateRandomURL() {
	const nanoid = customAlphabet('1234567890abcdef', 4)
    let idUrl;
    let exists = true;
    let collection = 'random_short';

    while (exists) {
        const newUrl = nanoid();
        // Check if the generated URL already exists
        const res = await fetch(`${pocketBaseURL}/api/collections/${collection}/records?filter=(id_url='${newUrl}')`);
        const data = await res.json();
        console.log(data)

        // If no items are returned, it means the URL does not exist
        if (!data.items || data.items.length === 0) {
            idUrl = newUrl;
            exists = false;
        } else {
            console.log('URL already exists')
            idUrl = null
        }
    }
    console.log(idUrl)
    return idUrl;
}