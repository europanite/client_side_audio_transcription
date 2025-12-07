import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/client_side_audio_transcription/",

  plugins: [react()],

  build: {
    target: "es2022",
    sourcemap: true
  },

  optimizeDeps: {
    // transformers.js is too heavy to import first
    exclude: ["@huggingface/transformers"]
  }
});
