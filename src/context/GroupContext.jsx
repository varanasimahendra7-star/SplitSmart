// src/context/GroupContext.jsx
import { createContext, useContext, useState } from 'react'

const GroupContext = createContext(null)

export function GroupProvider({ children }) {
  const [activeGroup, setActiveGroup] = useState(null)

  return (
    <GroupContext.Provider value={{ activeGroup, setActiveGroup }}>
      {children}
    </GroupContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGroup = () => {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used within GroupProvider')
  return ctx
}