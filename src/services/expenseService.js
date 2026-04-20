// src/services/expenseService.js
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Groups ────────────────────────────────────────────────────
export const createGroup = (data) =>
  addDoc(collection(db, 'groups'), {
    ...data,
    createdAt: serverTimestamp(),
  })

export const updateGroup = (groupId, data) =>
  updateDoc(doc(db, 'groups', groupId), data)

export const deleteGroup = (groupId) =>
  deleteDoc(doc(db, 'groups', groupId))

// ── Expenses ──────────────────────────────────────────────────
export const addExpense = (groupId, data) =>
  addDoc(collection(db, 'groups', groupId, 'expenses'), {
    ...data,
    createdAt: serverTimestamp(),
  })

export const updateExpense = (groupId, expenseId, data) =>
  updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), data)

export const deleteExpense = (groupId, expenseId) =>
  deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId))

// ── Settlements ───────────────────────────────────────────────
export const addSettlement = (groupId, data) =>
  addDoc(collection(db, 'groups', groupId, 'settlements'), {
    ...data,
    settledAt: serverTimestamp(),
  })

export const deleteSettlement = (groupId, settlementId) =>
  deleteDoc(doc(db, 'groups', groupId, 'settlements', settlementId))  

// ── Activity Audit Trail (✨ THIS WAS MISSING) ────────────────
export const logActivity = (groupId, text) =>
  addDoc(collection(db, 'groups', groupId, 'activity'), {
    text,
    createdAt: serverTimestamp(),
  })

export const subscribeToActivity = (groupId, callback) => {
  const q = query(collection(db, 'groups', groupId, 'activity'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

// ── Real-time listeners ───────────────────────────────────────
export const subscribeToExpenses = (groupId, callback) => {
  const q = query(
    collection(db, 'groups', groupId, 'expenses'),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export const subscribeToSettlements = (groupId, callback) => {
  const q = query(
    collection(db, 'groups', groupId, 'settlements'),
    orderBy('settledAt', 'desc'),
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export const subscribeToGroups = (user, callback) => {
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'))
  
  return onSnapshot(q, (snap) => {
    const groups = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => 
        g.members?.some((m) => 
          m.uid === user.uid || 
          (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase())
        )
      )
    callback(groups)
  }, (error) => {
    console.error("Error fetching groups:", error) 
  })
}