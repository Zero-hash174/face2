/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // 👇 هذا السطر يحل المشكلة بإجبار Next.js على معالجة هذه المكتبات
  transpilePackages: ['undici', 'firebase', '@firebase/storage'],
}

export default nextConfig