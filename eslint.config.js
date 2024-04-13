import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
      ignores: ["src/plugins/", 'dist/']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-empty': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  
);