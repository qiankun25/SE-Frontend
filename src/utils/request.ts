
/**
 * 动态获取 API 的 baseURL
 * - 开发环境：使用完整的 HTTP(S) 地址（如 http://localhost:8000）
 * - 生产环境：自动检测当前页面的子路径（如 /cxxt/），拼接为 /cxxt/api
 */
export function getApiBaseUrl(): string {
   const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  // 开发环境：通常运行在根路径，且后端在 localhost:8000
  if (envBaseUrl && (envBaseUrl.startsWith('http://') || envBaseUrl.startsWith('https://'))) {
    return envBaseUrl
  }
  
  // 生产环境：检测当前页面的 base path
  const pathname = window.location.pathname
  
  // 如果在子路径下（如 /xcct/），将其添加到 API 路径前
  const basePathMatch = pathname.match(/^(\/[^\/]+\/)/)
  if (basePathMatch && basePathMatch[1] !== '/') {
    const basePath = basePathMatch[1].replace(/\/$/, '')
    return `${basePath}/api`
  }
  
  // 根路径部署
  return '/api'
}




