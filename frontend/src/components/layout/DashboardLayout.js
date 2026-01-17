import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="pt-16">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}