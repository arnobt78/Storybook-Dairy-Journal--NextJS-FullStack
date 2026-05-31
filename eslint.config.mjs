import nextConfig from "eslint-config-next";

/** Next.js 16 ships a native flat config array — avoid FlatCompat (circular JSON with ESLint 9.39+). */
const eslintConfig = [...nextConfig];

export default eslintConfig;
