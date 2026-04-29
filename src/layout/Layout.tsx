import React from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Toast from '../components/Toast'

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Outlet />
      </div>
      <Toast />
    </div>
  )
}

export default Layout
