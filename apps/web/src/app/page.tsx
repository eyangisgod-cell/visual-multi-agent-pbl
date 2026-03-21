export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-primary mb-4">
        可视项目式学习平台
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        扮演 CEO，调度智能体，完成项目挑战！
      </p>
      <div className="flex gap-4">
        <a
          href="/auth/login"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700"
        >
          开始学习
        </a>
        <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
          查看作品
        </button>
      </div>
    </main>
  )
}
