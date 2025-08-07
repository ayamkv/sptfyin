import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";

// import { randomBytes } from "node:crypto";
// let publicUrl = import.meta.env.VITE_POCKETBASE_URL;



export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const flyAndScale = (
	node,
	params = { y: -8, x: 0, start: 0.95, duration: 150 }
) => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	const scaleConversion = (valueA, scaleA, scaleB) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style) => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, "");
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};


export const serializeNonPOJOs = (obj) => {
    return structuredClone(obj);
}


// export const generateUsername = (name) => {
//     const id = randomBytes(2).toString('hex')
//     return `${name.slice(0, 5)}${id}`
// }

// export const getImageURL = (collectionId, recordId, fileName, size = '0x0') => {
//     return `${publicUrl}/api/files/${collectionId}/${recordId}/${fileName}?thumb=${size}`;
// }

export const hideEmail = (email) => {
    const partialEmail = email.replace(/(\w{3})[\w.-]+@([\w.]+\w)/, "$1***@$2")
    return partialEmail
}



// export const validateData = async (formData, schema) => {
// 	const body = Object.fromEntries(formData);

// 	try {
// 		const data = schema.parse(body);
// 		return {
// 			formData: data,
// 			errors: null
// 		};
// 	} catch (err) {
// 		console.log('Error: ', err);
// 		const errors = err.flatten();
// 		return {
// 			formData: body,
// 			errors
// 		};
// 	}
// };

export function localizeDate(date, shorthand = false) {
    const inputDate = new Date(date);
    const now = new Date();
    const elapsedMs = inputDate.getTime() - now.getTime();
    const isPast = elapsedMs < 0;
    const elapsed = Math.abs(elapsedMs);

    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let unit;
    let value;

    if (days >= 1) {
        value = days;
        unit = shorthand ? 'd' : 'day';
    } else if (hours >= 1) {
        value = hours;
        unit = shorthand ? 'hr' : 'hour';
    } else if (minutes >= 1) {
        value = minutes;
        unit = shorthand ? 'm' : 'minute';
    } else if (seconds >= 1) {
        value = seconds;
        unit = shorthand ? 's' : 'second';
    } else {
        return 'just now';
    }

    const suffix = isPast ? 'ago' : 'from now';
    
    if (value === 1 && !shorthand) {
        let article = 'a';
        if (unit === 'hour') article = 'an';
        else if (['a', 'e', 'i', 'o', 'u'].includes(unit[0])) article = 'an';
        return `${article} ${unit} ${suffix}`;
    } else {
        const plural = value !== 1 && !shorthand ? 's' : '';
        return `${value}${shorthand ? '' : ' '}${unit}${plural} ${suffix}`;
    }
}

//localizeDate but to DD/MM/YYYY
//include the time in the format HH:MM
export function localizeDate2(date) {
	const inputDate = new Date(date);
	return inputDate.toLocaleString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
}
// export function localizeDate2(date) {
//     const inputDate = new Date(date);
//     return inputDate.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//     });
// }

export function findUrl(str) {
	console.log('Original input:', str);
	
	// remove parentheses format if present
	str = str.replace(/\s*\([^)]*\)/g, '').trim();
	
	// handle concatenated URLs (urlurl case)
	str = str.replace(/(https:\/\/[a-z]+\.spotify\.com\/[^?]+)\1/g, '$1');
	
	// extract the first complete Spotify URL
	const spotifyUrlRegex = /(https:\/\/[a-z]+\.spotify\.com\/(?:playlist|artist|album|track|episode|show|user|listeningstats)\/[^\s]+?)(?:\s+https:\/\/|$)/;
	const match = str.match(spotifyUrlRegex);
	
	if (match) {
		let cleanedStr = match[1].trim();
		console.log('Final cleaned URL:', cleanedStr);
		return cleanedStr;
	}
	
	console.log('No URL match found');
	return null;
}



export const createLoadObserver = handler => {
	let waiting = 0

	const onload = el => {
		waiting++
		el.addEventListener('load', () => {
			waiting--
			if (waiting === 0) {
				handler()
			}
		})
	}

	return onload
}
