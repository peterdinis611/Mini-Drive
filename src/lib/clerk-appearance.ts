/**
 * Explicit hex tokens only — never Tailwind semantic classes
 * (`bg-card`, `text-foreground`) that flip under `.dark` and break Clerk.
 * Light = day cobalt · Dark = slate + soft blue.
 */
export const clerkAppearanceDark = {
  variables: {
    colorPrimary: '#7eb8ff',
    colorDanger: '#ef5350',
    colorSuccess: '#86efac',
    colorWarning: '#fbbf24',
    colorText: '#eef3f8',
    colorTextSecondary: '#8b97a8',
    colorBackground: '#1a2030',
    colorInputBackground: '#12161f',
    colorInputText: '#eef3f8',
    colorNeutral: '#8b97a8',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[400px]',
    cardBox: 'shadow-none',
    card: 'border-2 border-[#7eb8ff]/55 bg-[#1a2030] shadow-none rounded-2xl',
    headerTitle: '!text-[#eef3f8]',
    headerSubtitle: '!text-[#8b97a8]',
    socialButtonsBlockButton:
      'border-2 border-[#7eb8ff]/40 !bg-[#12161f] !text-[#eef3f8] hover:!bg-[#232a3a] rounded-xl',
    socialButtonsBlockButtonText: '!text-[#eef3f8]',
    dividerLine: 'bg-[#7eb8ff]/30',
    dividerText: '!text-[#8b97a8]',
    formFieldLabel: '!text-[#8b97a8]',
    formFieldInput:
      '!bg-[#12161f] !text-[#eef3f8] border-[#7eb8ff]/35 placeholder:!text-[#6b7280] rounded-xl',
    formButtonPrimary:
      '!bg-[#7eb8ff] !text-[#071018] hover:!bg-[#93c5fd] shadow-none rounded-full font-semibold',
    footerActionText: '!text-[#8b97a8]',
    footerActionLink: '!text-[#7eb8ff] hover:!text-[#93c5fd]',
    identityPreviewText: '!text-[#eef3f8]',
    identityPreviewEditButton: '!text-[#7eb8ff]',
    formFieldAction: '!text-[#7eb8ff]',
    footer: '!bg-[#1a2030]',
  },
} as const

export const clerkAppearanceLight = {
  variables: {
    colorPrimary: '#2f6fed',
    colorDanger: '#e11d48',
    colorSuccess: '#0f7a4a',
    colorWarning: '#d97706',
    colorText: '#101828',
    colorTextSecondary: '#667085',
    colorBackground: '#ffffff',
    colorInputBackground: '#f5f7fb',
    colorInputText: '#101828',
    colorNeutral: '#667085',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[400px]',
    cardBox: 'shadow-none',
    card: 'border-2 border-[#101828]/15 bg-[#ffffff] shadow-none rounded-2xl',
    headerTitle: '!text-[#101828]',
    headerSubtitle: '!text-[#667085]',
    socialButtonsBlockButton:
      'border-2 border-[#101828]/15 !bg-[#f5f7fb] !text-[#101828] hover:!bg-[#e8eef8] rounded-xl',
    socialButtonsBlockButtonText: '!text-[#101828]',
    dividerLine: 'bg-[#101828]/12',
    dividerText: '!text-[#667085]',
    formFieldLabel: '!text-[#667085]',
    formFieldInput:
      '!bg-[#f5f7fb] !text-[#101828] border-[#101828]/15 placeholder:!text-[#98a2b3] rounded-xl',
    formButtonPrimary:
      '!bg-[#2f6fed] !text-[#ffffff] hover:!bg-[#2563d9] shadow-none rounded-full font-semibold',
    footerActionText: '!text-[#667085]',
    footerActionLink: '!text-[#2f6fed] hover:!text-[#101828]',
    identityPreviewText: '!text-[#101828]',
    identityPreviewEditButton: '!text-[#2f6fed]',
    formFieldAction: '!text-[#2f6fed]',
    footer: '!bg-[#ffffff]',
  },
} as const

/** Default for SSR / before theme resolves — light landing palette. */
export const clerkAppearance = clerkAppearanceLight
