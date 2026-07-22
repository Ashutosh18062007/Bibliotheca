import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Role } from '@/types'

export interface AuthUser {
  id: string; name: string; email: string; role: Role;
  lastLogin: string; loginIp: string; device: string;
}

interface AuthState {
  user: AuthUser | null; isAuthenticated: boolean; isInitializing: boolean;
  loginAttempts: number; lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5
const LOCK_MS = 5 * 60 * 1000
const initialState: AuthState = {
  user: null, isAuthenticated: false, isInitializing: true,
  loginAttempts: 0, lockedUntil: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ id: string; email: string } | null>) {
      if (action.payload) {
        const email = action.payload.email
        const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        state.user = {
          id: action.payload.id, name, email, role: 'Super Admin',
          lastLogin: new Date().toISOString(), loginIp: '203.0.113.42',
          device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
        }
        state.isAuthenticated = true
      } else {
        state.user = null; state.isAuthenticated = false
      }
      state.isInitializing = false
    },
    setRole(state, action: PayloadAction<Role>) {
      if (state.user) state.user.role = action.payload
    },
    loginFailure(state) {
      state.loginAttempts += 1
      if (state.loginAttempts >= MAX_ATTEMPTS) state.lockedUntil = Date.now() + LOCK_MS
    },
    resetAttempts(state) { state.loginAttempts = 0; state.lockedUntil = null },
    logout(state) { state.user = null; state.isAuthenticated = false },
  },
})

export const { setSession, setRole, loginFailure, resetAttempts, logout } = authSlice.actions
export default authSlice.reducer
export const MAX_LOGIN_ATTEMPTS = MAX_ATTEMPTS
