import { serializeNonPOJOs } from "$lib/utils.js"
import { error } from "@sveltejs/kit"



export const load = ({ locals, url }) => {
    let userTypeRes = serializeNonPOJOs(locals.user?.collectionName)
    


    if (locals.user)  {
        if (userTypeRes === 'users') {
            console.log('user')
        }

        return {
            user: locals.user,
            userType: userTypeRes,
            currentPath: url.pathname,
        }
    };

    return {
        user: undefined,
        currentPath: url.pathname
    }

}