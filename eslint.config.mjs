import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import tseslint from 'typescript-eslint';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default tseslint.config(
  {
    ignores: ["src/generated/**"],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
  eslintConfig
);
