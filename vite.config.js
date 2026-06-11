import { existsSync } from "node:fs";

const localModules = "C:/Users/lucas/AppData/Local/Temp/fluxo-caixa-verify/frontend/node_modules";
const localAliases = existsSync(localModules)
  ? {
      react: `${localModules}/react`,
      "react-dom/client": `${localModules}/react-dom/client.js`,
      "lucide-react": `${localModules}/lucide-react/dist/esm/lucide-react.js`,
      recharts: `${localModules}/recharts/es6/index.js`,
    }
  : {};

export default {
  resolve: {
    alias: localAliases,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
};
