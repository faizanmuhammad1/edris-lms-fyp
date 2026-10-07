import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  { ignores: ["./lib/generated/**"] },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    files: [
      "app/admin/**/actions.ts",
      "app/admin/**/*-test/**/*.{ts,tsx}",
      "app/dashboard/forum/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["components/cart/cart-drawer.tsx"],
    rules: {
      "react-hooks/exhaustive-deps": [
        "warn",
        {
          additionalHooks: "(useCallback)",
        },
      ],
    },
  },
];

export default eslintConfig;
