import React from 'react'
import { Link } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <nav className="w-full md:w-64 bg-white shadow-md flex flex-row md:flex-col items-center md:items-start p-2 md:p-6 gap-2 md:gap-4">
        <Link to="/" className="text-xl font-bold text-blue-700 mb-0 md:mb-4">HomeThrive</Link>
        <Link to="/" className="text-gray-700 hover:text-blue-700 text-base md:text-lg">Dashboard</Link>
        <Link to="/medications/add" className="text-gray-700 hover:text-blue-700 text-base md:text-lg">Add Medication</Link>
      </nav>
      <main className="flex-1 p-2 md:p-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
