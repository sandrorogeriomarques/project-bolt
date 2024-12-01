// vite.config.ts
import { defineConfig } from "file:///C:/Users/User/Downloads/project-bolt-sb1-fdhim5%20(2wind)/project/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/User/Downloads/project-bolt-sb1-fdhim5%20(2wind)/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Permite acesso de outros dispositivos na rede
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  assetsInclude: ["**/*.png"]
  // Incluir arquivos PNG como assets
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJjOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERvd25sb2Fkc1xcXFxwcm9qZWN0LWJvbHQtc2IxLWZkaGltNSAoMndpbmQpXFxcXHByb2plY3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcImM6XFxcXFVzZXJzXFxcXFVzZXJcXFxcRG93bmxvYWRzXFxcXHByb2plY3QtYm9sdC1zYjEtZmRoaW01ICgyd2luZClcXFxccHJvamVjdFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYzovVXNlcnMvVXNlci9Eb3dubG9hZHMvcHJvamVjdC1ib2x0LXNiMS1mZGhpbTUlMjAoMndpbmQpL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsIC8vIFBlcm1pdGUgYWNlc3NvIGRlIG91dHJvcyBkaXNwb3NpdGl2b3MgbmEgcmVkZVxuICAgIHBvcnQ6IDUxNzMsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIGFzc2V0c0luY2x1ZGU6IFsnKiovKi5wbmcnXSwgLy8gSW5jbHVpciBhcnF1aXZvcyBQTkcgY29tbyBhc3NldHNcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2WCxTQUFTLG9CQUFvQjtBQUMxWixPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLGVBQWUsQ0FBQyxVQUFVO0FBQUE7QUFDNUIsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
