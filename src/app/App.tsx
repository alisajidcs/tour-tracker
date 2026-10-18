import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { AppLayout } from '@/components/layout/AppLayout'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}
