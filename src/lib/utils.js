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

export function localizeDate(date) {
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
        unit = 'day';
    } else if (hours >= 1) {
        value = hours;
        unit = 'hour';
    } else if (minutes >= 1) {
        value = minutes;
        unit = 'minute';
    } else if (seconds >= 1) {
        value = seconds;
        unit = 'second';
    } else {
        return 'just now';
    }

    const suffix = isPast ? 'ago' : 'from now';
    let article = 'a';
    if (value === 1) {
        if (unit === 'hour') article = 'an';
        else if (['a', 'e', 'i', 'o', 'u'].includes(unit[0])) article = 'an';
        return `${article} ${unit} ${suffix}`;
    } else {
        return `${value} ${unit}s ${suffix}`;
    }
}

export function findUrl(str) {
	const regex =
		/^(https:\/\/[a-z]+\.spotify\.com\/)(playlist|artist|album|track|episode|show|user)\/.*$/gm;
	let urls = str.match(regex);
	return urls ? urls[0] : null;
}