'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: '仪表盘', href: '/admin', icon: '📊' },
    { name: '项目管理', href: '/admin/projects', icon: '📁' },
    { name: '智能体管理', href: '/admin/agents', icon: '🤖' },
    { name: 'LLM 配置', href: '/admin/llm', icon: '🧠' },
    { name: '用户管理', href: '/admin/users', icon: '👥' },
    { name: '场景模板', href: '/admin/scenes', icon: '🎬' },
    { name: '系统设置', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`bg-indigo-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-indigo-700">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">管理后台</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-indigo-800 rounded-lg"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'text-indigo-200 hover:bg-indigo-800'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Back to Home */}
          <div className="p-4 border-t border-indigo-700">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-indigo-200 hover:bg-indigo-800 rounded-lg transition-colors"
            >
              <span>🏠</span>
              {sidebarOpen && <span>返回首页</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
