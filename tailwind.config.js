/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			spacing: {
				// Map Tailwind spacing to CSS variables
				'content': 'var(--content-padding)',
				'content-lg': 'var(--content-padding-lg)',
				'section': 'var(--section-gap)',
			},
			height: {
				'titlebar': 'var(--titlebar-height)',
				'statusbar': 'var(--statusbar-height)',
			},
			width: {
				'sidebar': 'var(--sidebar-width)',
			},
			colors: {
				// Use CSS variables for colors
				primary: {
					50: 'var(--color-primary-50)',
					100: 'var(--color-primary-100)',
					200: 'var(--color-primary-200)',
					300: 'var(--color-primary-300)',
					400: 'var(--color-primary-400)',
					500: 'var(--color-primary-500)',
					600: 'var(--color-primary-600)',
					700: 'var(--color-primary-700)',
					800: 'var(--color-primary-800)',
					900: 'var(--color-primary-900)',
				},
				accent: {
					400: 'var(--color-accent-400)',
					500: 'var(--color-accent-500)',
					600: 'var(--color-accent-600)',
				},
			},
			borderRadius: {
				'sm': 'var(--radius-sm)',
				'md': 'var(--radius-md)',
				'lg': 'var(--radius-lg)',
				'xl': 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)',
			},
		},
	},
	// Disable Tailwind's default spacing that conflicts with tokens
	corePlugins: {
		// Keep preflight for resets but don't let it override our tokens
		preflight: true,
	},
	plugins: [],
}
