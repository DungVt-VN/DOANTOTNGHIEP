import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react({
      // (Tùy chọn) Thêm cấu hình này giúp tên class dễ đọc hơn khi debug
      babel: {
        plugins: [
          [
            "babel-plugin-styled-components",
            {
              displayName: true,
              fileName: false,
            },
          ],
        ],
      },
    }),
    nodePolyfills({
      include: [
        "path",
        "url",
        "util",
        "stream",
        "events",
        "fs",
        "buffer",
        "process",
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // --- KHẮC PHỤC LỖI styled_default ---
      // Dòng này ép buộc Vite trỏ thẳng vào file ESM của trình duyệt
      // Giúp tránh lỗi import default bị sai lệch
      "styled-components":
        "styled-components/dist/styled-components.browser.esm.js",
    },
  },

  optimizeDeps: {
    // XÓA "styled-components" khỏi đây.
    // Việc ép nó vào include thường gây ra lỗi conflict module v6.
    include: ["source-map-js"],
    // Nếu vẫn lỗi, hãy thử uncomment dòng dưới để loại trừ hẳn nó ra
    // exclude: ['styled-components'],
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
