/**
 * All UI colors and color-related Tailwind classes are defined here.
 * Do not use raw color classes (text-*, bg-*, border-*, ring-*) in JSX; use theme tokens only.
 */
const theme = {
  // Body (applied from React so index.html has no colors)
  body: 'bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 antialiased transition-colors duration-200',

  // Page / layout
  pageBg: 'bg-gray-50 dark:bg-gray-900',
  pageText: 'text-gray-800 dark:text-gray-100',
  pageTextSecondary: 'text-gray-700 dark:text-gray-200',
  pageTextMuted: 'text-gray-500 dark:text-gray-400',
  pageTextSubtle: 'text-gray-400 dark:text-gray-500',

  // Surfaces
  cardBg: 'bg-white dark:bg-gray-800',
  cardBorder: 'border-gray-200 dark:border-gray-700',
  cardBorderMuted: 'border-gray-100 dark:border-gray-700',
  surfaceMuted: 'bg-gray-50 dark:bg-gray-700/50',
  skeletonBg: 'bg-gray-200 dark:bg-gray-700',

  // Interactive
  interactiveMuted: 'text-gray-600 dark:text-gray-400',
  interactiveHover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
  interactiveMutedHover: 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
  navDropdownItem: 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
  dangerText: 'text-red-600 dark:text-red-400',
  dangerHover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
  dangerButton: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',

  // Icons
  iconAccent: 'text-orange-600 dark:text-orange-400',
  iconMuted: 'text-gray-500 dark:text-gray-400',
  iconInverse: 'text-white',

  // Toggle (ThemeToggle)
  toggle: {
    track: 'bg-gray-200 dark:bg-gray-600',
    knob: 'bg-white shadow-md',
    sun: 'text-amber-500',
    moon: 'text-indigo-500',
  },

  // Modal overlay
  overlay: 'bg-black/50 dark:bg-black/60',

  // NumberInput / stepper
  numberInputWrap: 'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700',
  numberInputBorder: 'border-gray-200 dark:border-gray-600',
  numberInputButton: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent',
  label: 'text-gray-700 dark:text-gray-300',
  requiredAsterisk: 'text-red-500 dark:text-red-400',

  focusRing: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',

  navBar: 'border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
  avatarCircle: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  dropdown: 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800',
  dropdownDivider: 'border-b border-gray-100 dark:border-gray-700',
  cancelButton: 'rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50',
  dangerButtonBg: 'rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 transition disabled:opacity-50',
  profileBanner: 'bg-gradient-to-b from-orange-500 to-white dark:from-orange-600 dark:to-gray-800',
  profileAvatarRing: 'border-4 border-white dark:border-gray-800',
  profileAvatarGradient: 'bg-gradient-to-br from-orange-500 to-amber-400 dark:from-orange-600 dark:to-amber-500 text-white',
  profileMetaIconBg: 'bg-gray-100 dark:bg-gray-700',
  mobileNavBorder: 'border-t border-gray-100 dark:border-gray-700/50',

  tableHeadBg: 'bg-gray-50/60 dark:bg-gray-700/30',
  tableRowHover: 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30',
  tableDivider: 'divide-gray-100 dark:divide-gray-700/50',
  clearFiltersBtn: 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
  paginationBtn: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
  paginationBtnActive: 'bg-orange-600 text-white shadow-sm dark:bg-orange-500',
  filterButtonActive: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  filterButtonInactive: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  dropdownOptionActive: 'bg-orange-50 text-orange-700 font-medium dark:bg-orange-900/30 dark:text-orange-400',
  dropdownOptionInactive: 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
  dropdownPlaceholder: 'text-gray-400 dark:text-gray-500',
  dropdownInput: 'text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500',

  // Link secondary (e.g. Back to Home)
  linkSecondary: 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400',

  // Status badges (moved from StatusBadge.jsx)
  statusBadge: {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30',
    achieved: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/30',
    cancelled: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-500/30',
    scheduled: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-500/30',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30',
    operational: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30',
    under_repair: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30',
    out_of_service: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30',
    reported: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30',
    in_progress: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-500/30',
    resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30',
    default: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-500/30',
  },

  // Booking type badges (admin dashboard)
  badgeClass: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-500/30',
  badgeSession: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-500/30',

  // Composite tokens (existing, kept for compatibility)
  btn: 'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50 transition dark:bg-orange-500 dark:hover:bg-orange-400',
  btnSmall: 'rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500 transition dark:bg-orange-500 dark:hover:bg-orange-400',
  input: 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-orange-400',
  inputLg: 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-orange-400',

  navActive: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  navInactive: 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
  navBrand: 'text-orange-600 dark:text-orange-400',
  roleBadge: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',

  authBg: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800',
  authCard: 'rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700',

  link: 'font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300',
  filterActive: 'bg-orange-600 text-white shadow-sm dark:bg-orange-500',
  filterInactive: 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700',
  tabActive: 'border-b-2 border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400',
  tabInactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
  spinner: 'border-orange-500 dark:border-orange-400',

  statIcon: {
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },

  // Section icon colors (member dashboard)
  sectionIconOrange: 'text-orange-500',
  sectionIconEmerald: 'text-emerald-500',
  sectionIconAmber: 'text-amber-500',
  sectionIconViolet: 'text-violet-500',

  chartPrimary: '#ea580c',
  chartSecondary: '#f97316',
  chartGradientFrom: '#f97316',
  chartBar: '#d97706',

  chartColors: {
    weight: '#ea580c',
    bodyFat: '#8b5cf6',
    bodyFatGradientTo: '#a78bfa',
    heartRate: '#059669',
    bpSystolic: '#dc2626',
    bpDiastolic: '#2563eb',
  },

  chartGridStroke: { light: '#e5e7eb', dark: '#4b5563' },
  chartTickFill: { light: '#6b7280', dark: '#9ca3af' },
  chartTooltip: {
    light: {
      content: { backgroundColor: '#ffffff', color: '#1f2937', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      label: { color: '#1f2937' },
      item: { color: '#1f2937' },
      cursor: { fill: 'rgba(0,0,0,0.06)', stroke: 'none' },
    },
    dark: {
      content: { backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #4b5563', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
      label: { color: '#f3f4f6' },
      item: { color: '#f3f4f6' },
      cursor: { fill: 'rgba(75, 85, 99, 0.4)', stroke: 'none' },
    },
  },
};

export default theme;
