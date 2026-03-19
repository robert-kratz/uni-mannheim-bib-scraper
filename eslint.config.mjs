import nextConfig from 'eslint-config-next';
import tseslint from 'typescript-eslint';

const eslintConfig = [
    ...nextConfig,
    {
        plugins: { '@typescript-eslint': tseslint.plugin },
        rules: {
            'no-console': ['warn', { allow: ['error', 'warn'] }],
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
    {
        ignores: ['node_modules/', '.next/', 'drizzle/migrations/', 'script/'],
    },
];

export default eslintConfig;

