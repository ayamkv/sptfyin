import PocketBase from 'pocketbase';
import { myFetch } from './fetchWrapper.js';
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
export async function getRecentRecords(collection) {
  const res = await fetch(`${pocketBaseURL}/api/collections/random_short/records?sort=-created&fields=id_url,from,created`)
  return res.json();
}


  
export async function createRecord(collection, data) {
  try {
    return await pb.collection(collection).create(data);
  } catch (err) {
    console.error('Create error', err);
    throw err;
  }
}

export async function updateRecord(collection, id, data) {
  try {
    return await pb.collection(collection).update(id, data);
  } catch (err) {
    console.error('Update error', err);
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
    let exists = true;
    let shortId = null;
    while (exists) {
      const newId = Math.random().toString(36).substring(2, 6);
      const records = await pb.collection('random_short').getList(1, 1, { 
        filter: `id_url='${newId}'`
      });
      if (!records.items.length) {
        shortId = newId;
        exists = false;
      }
    }
    return shortId;
  } catch (err) {
    console.error('Generate random error', err);
    throw err;
  }
}