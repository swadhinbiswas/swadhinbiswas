/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'class',
    theme: {
        extend: {
            typography: (theme) => ({
                DEFAULT: {
                    css: {
                        maxWidth: 'none',
                        color: theme('colors.text'),
                        a: {
                            color: theme('colors.sky.300'),
                            '&:hover': {
                                color: theme('colors.sky.400'),
                            },
                        },
                        'code::before': {
                            content: '""',
                        },
                        'code::after': {
                            content: '""',
                        },
                        code: {
                            color: theme('colors.pink.300'),
                            backgroundColor: theme('colors.surface0'),
                            padding: '0.2em 0.4em',
                            borderRadius: '0.25rem',
                            fontWeight: '400',
                        },
                        'pre code': {
                            padding: '0',
                            backgroundColor: 'transparent',
                        },
                        pre: {
                            backgroundColor: theme('colors.surface0'),
                            color: theme('colors.text'),
                            border: `1px solid ${theme('colors.surface1')}`,
                        },
                        table: {
                            width: '100%',
                            borderCollapse: 'collapse',
                        },
                        thead: {
                            borderBottomWidth: '2px',
                            borderBottomColor: theme('colors.surface1'),
                        },
                        'thead th': {
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontWeight: '600',
                        },
                        'tbody tr': {
                            borderBottomWidth: '1px',
                            borderBottomColor: theme('colors.surface0'),
                        },
                        'tbody td': {
                            padding: '0.75rem',
                        },
                    },
                },
                invert: {
                    css: {
                        color: theme('colors.subtext0'),
                        'h1, h2, h3, h4': {
                            color: theme('colors.text'),
                        },
                        strong: {
                            color: theme('colors.text'),
                        },
                        code: {
                            color: theme('colors.pink.300'),
                            backgroundColor: theme('colors.surface0'),
                        },
                        pre: {
                            backgroundColor: theme('colors.surface0'),
                            color: theme('colors.text'),
                        },
                        blockquote: {
                            color: theme('colors.subtext1'),
                            borderLeftColor: theme('colors.mauve'),
                        },
                    },
                },
            }),
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
