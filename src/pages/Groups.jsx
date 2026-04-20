// src/pages/Groups.jsx
// Thin wrapper — redirects to Dashboard (groups listed there).
// Kept as a separate route entry point for routing completeness.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Groups() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dashboard') }, [navigate])
  return null
}