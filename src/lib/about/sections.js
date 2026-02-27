export const ABOUT_SECTIONS = [
	{
		id: 'general',
		label: "what's sptfyin?",
		icon: 'lucide:message-circle-question',
		href: '/about/general'
	},
	{
		id: 'privacy',
		label: 'privacy policy',
		icon: 'lucide:lock',
		href: '/about/privacy'
	},
	{
		id: 'terms',
		label: 'terms and ethics',
		icon: 'lucide:file-check-2',
		href: '/about/terms'
	},
	{
		id: 'socials',
		label: 'socials',
		icon: 'lucide:at-sign',
		href: '/about/socials'
	}
];

export const ABOUT_SECTION_IDS = ABOUT_SECTIONS.map((section) => section.id);
