import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Para User Site: https://jdrperalta.github.io/  -> base "/"
export default defineConfig({
  plugins: [react()],
  base: "/",
});
