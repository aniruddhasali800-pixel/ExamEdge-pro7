import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Home from './pages/Home'
import useGetCurrentUser from './hooks/useGetCurrentUser'
import { useSelector } from 'react-redux'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import WebsiteEditor from './pages/Editor'
import LiveSite from './pages/LiveSite'
import Pricing from './pages/Pricing'

export const serverUrl = "http://localhost:5000"
function App() {
  useGetCurrentUser()
  const { userData } = useSelector(state => state.user)
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/generate' element={<Generate />} />
        <Route path='/editor/:id' element={<WebsiteEditor />} />
        <Route path='/site/:id' element={<LiveSite />} />
        <Route path='/pricing' element={<Pricing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
