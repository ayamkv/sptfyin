import { tv } from 'tailwind-variants';
import Root from './button.svelte';
const buttonVariants = tv({
	base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-secondary disabled:text-secondary-foreground',
	variants: {
		variant: {
			default:
				'bg-primary text-primary-foreground hover:bg-primary highlight hover:highlightHover hover:scale-95 md:hover:scale-105  hover:-rotate-1 active:scale-100 active:bg-secondary active:text-foreground transition-all active:highlightCard ',
			destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
			outline:
				'border border-input bg-background active:bg-secondary hover:bg-primary hover:text-primary-foreground hover:scale-95',
			secondary:
				'bg-gradient-to-br from-[#38334f] via-secondary/40 via-30% text-secondary-foreground hover:from-[#afffdc] hover:via-primary hover:to-primary hover:text-secondary highlightSecondary active:scale-95 transition-all',
			ghost:
				'hover:bg-accent hover:text-accent-foreground hover:bg-secondary/80 hover:outline-primary hover:inverseShadow',
			ghost2:
				'bg-gradient-to-br from-[#38334f] via-30% text-secondary-foreground  hover:text-accent-foreground hover:bg-secondary/80 hover:outline-primary hover:inverseShadow highlightSecondary active:scale-95 active:to-primary active:from-[#afffdc] active:text-secondary active:via-primary border-t disabled:text-secondary-foreground/40 disabled:bg-background/80 disabled:to-background/80 disabled:via-background/80 disabled:from-background/60 disabled:inverseShadow highlightGhost',
			link: 'text-primary underline-offset-4 hover:underline'
		},
		size: {
			default: 'h-10 px-4 py-2',
			sm: 'h-9 rounded-md px-3',
			lg: 'h-11 rounded-md px-8',
			icon: 'h-10 w-10'
		}
	},
	defaultVariants: {
		variant: 'default',
		size: 'default'
	}
});
export {
	Root,
	//
	Root as Button,
	buttonVariants
};

// this has custom styling
