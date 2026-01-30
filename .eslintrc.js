module.exports = {
    extends: 'next/core-web-vitals',
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@next/next/no-html-link-for-pages': 'off',
    },
    overrides: [
        {
            files: ['app/admin/**/actions.ts', 'app/admin/**/*-test/**/*.{ts,tsx}', 'app/dashboard/forum/**/*.tsx'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-unused-vars': 'warn',
            },
        },
        {
            files: ['components/cart/cart-drawer.tsx'],
            rules: {
                'react-hooks/exhaustive-deps': ['warn', {
                    additionalHooks: '(useCallback)',
                }],
            },
        },
    ],
};
