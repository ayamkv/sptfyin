import Blob from 'cors-blob'

export const handle = async ({event, resolve}) => {
    if (event.request.method !== "OPTIONS")
        return await resolve(event)
    return new Response(new Blob(), {status: 200})
}