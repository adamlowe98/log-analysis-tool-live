// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  // ============================================================================
  // PLUGINS CONFIGURATION
  // ============================================================================
  plugins: [
    /**
     * React plugin provides:
     * - JSX transformation
     * - Fast Refresh for hot module replacement
     * - React-specific optimizations
     */
    react()
  ],
  // ============================================================================
  // DEPENDENCY OPTIMIZATION
  // ============================================================================
  optimizeDeps: {
    /**
     * Exclude lucide-react from pre-bundling
     * 
     * This prevents Vite from pre-bundling the lucide-react icon library,
     * which can improve build performance and avoid potential issues with
     * dynamic icon imports and tree-shaking.
     */
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8qKlxuICogVml0ZSBDb25maWd1cmF0aW9uXG4gKiBcbiAqIFRoaXMgY29uZmlndXJhdGlvbiBmaWxlIHNldHMgdXAgdGhlIFZpdGUgYnVpbGQgdG9vbCBmb3IgdGhlIFJlYWN0IGFwcGxpY2F0aW9uLlxuICogVml0ZSBwcm92aWRlcyBmYXN0IGRldmVsb3BtZW50IHNlcnZlciBhbmQgb3B0aW1pemVkIHByb2R1Y3Rpb24gYnVpbGRzLlxuICogXG4gKiBDb25maWd1cmF0aW9uIGluY2x1ZGVzOlxuICogLSBSZWFjdCBwbHVnaW4gZm9yIEpTWCBzdXBwb3J0IGFuZCBGYXN0IFJlZnJlc2hcbiAqIC0gT3B0aW1pemF0aW9uIHNldHRpbmdzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAqIC0gRGV2ZWxvcG1lbnQgc2VydmVyIGNvbmZpZ3VyYXRpb25cbiAqIFxuICogVGhlIG9wdGltaXplRGVwcy5leGNsdWRlIHNldHRpbmcgZm9yICdsdWNpZGUtcmVhY3QnIHByZXZlbnRzIFZpdGUgZnJvbVxuICogcHJlLWJ1bmRsaW5nIHRoaXMgZGVwZW5kZW5jeSwgd2hpY2ggY2FuIGhlbHAgd2l0aCBidWlsZCBwZXJmb3JtYW5jZVxuICogYW5kIGF2b2lkIHBvdGVudGlhbCBpc3N1ZXMgd2l0aCBpY29uIGxvYWRpbmcuXG4gKi9cblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gUExVR0lOUyBDT05GSUdVUkFUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgXG4gIHBsdWdpbnM6IFtcbiAgICAvKipcbiAgICAgKiBSZWFjdCBwbHVnaW4gcHJvdmlkZXM6XG4gICAgICogLSBKU1ggdHJhbnNmb3JtYXRpb25cbiAgICAgKiAtIEZhc3QgUmVmcmVzaCBmb3IgaG90IG1vZHVsZSByZXBsYWNlbWVudFxuICAgICAqIC0gUmVhY3Qtc3BlY2lmaWMgb3B0aW1pemF0aW9uc1xuICAgICAqL1xuICAgIHJlYWN0KClcbiAgXSxcbiAgXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gREVQRU5ERU5DWSBPUFRJTUlaQVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgLyoqXG4gICAgICogRXhjbHVkZSBsdWNpZGUtcmVhY3QgZnJvbSBwcmUtYnVuZGxpbmdcbiAgICAgKiBcbiAgICAgKiBUaGlzIHByZXZlbnRzIFZpdGUgZnJvbSBwcmUtYnVuZGxpbmcgdGhlIGx1Y2lkZS1yZWFjdCBpY29uIGxpYnJhcnksXG4gICAgICogd2hpY2ggY2FuIGltcHJvdmUgYnVpbGQgcGVyZm9ybWFuY2UgYW5kIGF2b2lkIHBvdGVudGlhbCBpc3N1ZXMgd2l0aFxuICAgICAqIGR5bmFtaWMgaWNvbiBpbXBvcnRzIGFuZCB0cmVlLXNoYWtpbmcuXG4gICAgICovXG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBbUJsQixJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUsxQixTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFPUCxNQUFNO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsY0FBYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFRWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
