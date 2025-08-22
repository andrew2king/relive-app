import './globals.css'

export const metadata = {
  title: 'RELIVE - AI照片修复平台',
  description: '用AI技术让每一张珍贵的老照片重新焕发生命力，让回忆变得更加生动',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
