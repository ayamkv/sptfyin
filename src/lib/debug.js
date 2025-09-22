import { toast } from 'svelte-sonner';
export let toastGroups = [
	{
		title: 'Toast with description',
		buttons: [
			{
				label: 'Loading Toast',
				onClick: () => {
					toast.loading('Loading...', {
						description: 'Please wait a moment.'
					});
				},
				class: 'mt-2 bg-slate-600 text-white'
			},
			{
				label: 'Success Toast',
				onClick: () => {
					toast.success('Success 🥳', {
						description: 'The link has been shortened!'
					});
				},
				class: 'mt-2'
			},
			{
				label: 'Error Toast',
				onClick: () => {
					toast.error('Error... 😔', {
						description: 'Something went wrong. Please try again.'
					});
				},
				class: 'mt-2 bg-red-600'
			}
		]
	},
	{
		title: 'Toast without description',
		buttons: [
			{
				label: 'Loading Toast w/o desc',
				onClick: () => {
					toast.loading('Loading...');
				},
				class: 'mt-2 bg-slate-600 text-white'
			},
			{
				label: 'Success Toast w/o desc',
				onClick: () => {
					toast.success('Success 🥳');
				},
				class: 'mt-2'
			},
			{
				label: 'Error Toast w/o desc',
				onClick: () => {
					toast.error('Error... 😔');
				},
				class: 'mt-2 bg-red-600'
			}
		]
	}
];
