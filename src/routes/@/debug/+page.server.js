import { createBatch } from '$lib/pocketbase.js';

// Debug route may not ship with idList; provide a fallback to avoid build errors
let botIds = [];
try {
	// In dev you can add src/routes/debug/idList.js exporting { botIds }
	// Avoid bundler resolution with Vite-ignore comment
	const mod = await import(/* @vite-ignore */ './' + 'idList' + '.js');
	botIds = mod.botIds ?? [];
} catch {
	// optional file missing in production; keep empty list
}

export const actions = {
	deleteBots: async () => {
		try {
			const batch = createBatch();

			// Register delete requests for each bot ID
			botIds.forEach((id) => {
				console.log(`Registering delete request for ID: ${id}`);
				batch.collection('analytics').delete(id);
			});

			// Send the batch request
			console.log('Sending batch delete request...');
			const result = await batch.send();
			console.log('Batch delete result:', result);

			return {
				success: true,
				message: `Successfully deleted ${botIds.length} bot records`,
				deletedCount: botIds.length
			};
		} catch (error) {
			console.error('Error in batch delete:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}
};

export function load() {
	return {
		botIds
	};
}
//         'telegrambot'
//     ];

//     try {        // Get all records from analytics collection with specific fields
//         const records = await getRecords('analytics', {
//             fields: ['id', 'utm_userAgent'],
//             perPage: 1200
//         });

//         // Filter records that match any of the bot keywords in utm_userAgent
//         const botRecords = records.filter(record => {
//             const userAgent = (record.utm_userAgent || '').toLowerCase();
//             return botKeywords.some(keyword => userAgent.includes(keyword.toLowerCase()));
//         });

//         // Extract just the IDs and user agent fields for display
//         const botData = botRecords.map(record => ({
//             id: record.id,
//             userAgent: record.utm_userAgent
//         }));

//         return {
//             botData
//         };    } catch (error) {
//         console.error('Error fetching bot data:', error);
//         return {
//             botData: [],
//             error: error.message
//         };
//     }
// }

// export async function load() {
//     return await getBotData();
// }
