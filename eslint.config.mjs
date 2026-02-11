import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
    powerbiVisualsConfigs.configs.recommended,
    {
        ignores: ["node_modules/**", "dist/**", ".vscode/**", ".tmp/**", "*.js", "tests/__mocks__/**"],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                tsconfigRootDir: __dirname,  // ✅ Ruta absoluta
                project: ["./tsconfig.eslint.json"]
            }
        },
        plugins: {
            "@typescript-eslint": typescriptEslint
        }
    }
];