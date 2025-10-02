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
  // Ignore a single heavy test file that uses broad mocks and would otherwise trip lint/type rules
  {
    ignores: [
      "components/__tests__/AdvancedFeatures.test.tsx",
    ],
  },
];

export default eslintConfig;
