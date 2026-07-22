import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type Theme = 'light' | 'dark'

interface UIState {
  theme: Theme; sidebar: 'expanded' | 'collapsed'; mobileSidebarOpen: boolean;
  searchQuery: string;
  notifications: { id: string; title: string; body: string; time: string; read: boolean; type: string }[]
}

const savedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('bibliotheca-theme')) as Theme | null
const initialState: UIState = {
  theme: savedTheme || 'light', sidebar: 'expanded', mobileSidebarOpen: false, searchQuery: '',
  notifications: [
    { id: '1', title: 'Overdue Alert', body: '3 books are overdue today', time: '5m ago', read: false, type: 'warning' },
    { id: '2', title: 'New Registration', body: 'Aarav Sharma joined as Student', time: '1h ago', read: false, type: 'info' },
    { id: '3', title: 'Fine Collected', body: '₹15 collected from Diya Patel', time: '2h ago', read: true, type: 'success' },
  ],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      if (typeof localStorage !== 'undefined') localStorage.setItem('bibliotheca-theme', state.theme)
    },
    toggleSidebar(state) { state.sidebar = state.sidebar === 'expanded' ? 'collapsed' : 'expanded' },
    toggleMobileSidebar(state) { state.mobileSidebarOpen = !state.mobileSidebarOpen },
    closeMobileSidebar(state) { state.mobileSidebarOpen = false },
    setSearch(state, action: PayloadAction<string>) { state.searchQuery = action.payload },
    markAllRead(state) { state.notifications.forEach((n) => (n.read = true)) },
  },
})

export const { toggleTheme, toggleSidebar, toggleMobileSidebar, closeMobileSidebar, setSearch, markAllRead } = uiSlice.actions
export default uiSlice.reducer
