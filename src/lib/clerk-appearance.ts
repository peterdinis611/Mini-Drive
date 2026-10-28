/**
 * Explicit hex tokens only — never Tailwind semantic classes
 * (`bg-card`, `text-foreground`) that flip under `.dark` and break Clerk.
 * Matched to Mini Drive landing palette.
 */
export const clerkAppearanceDark = {
  variables: {
    colorPrimary: '#b9a6ff',
    colorDanger: '#ef5350',
    colorSuccess: '#86efac',
    colorWarning: '#fbbf24',
    colorText: '#f2efe8',
    colorTextSecondary: '#9b97a8',
    colorBackground: '#1c1f2c',
    colorInputBackground: '#14161f',
    colorInputText: '#f2efe8',
    colorNeutral: '#9b97a8',
    borderRadius: '0.9rem',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[400px]',
    cardBox: 'shadow-none',
    card: 'border-2 border-[#b9a6ff]/55 bg-[#1c1f2c] shadow-none rounded-2xl',
    headerTitle: '!text-[#f2efe8]',
    headerSubtitle: '!text-[#9b97a8]',
    socialButtonsBlockButton:
      'border-2 border-[#b9a6ff]/40 !bg-[#14161f] !text-[#f2efe8] hover:!bg-[#252836] rounded-xl',
    socialButtonsBlockButtonText: '!text-[#f2efe8]',
    dividerLine: 'bg-[#b9a6ff]/30',
    dividerText: '!text-[#9b97a8]',
    formFieldLabel: '!text-[#9b97a8]',
    formFieldInput:
      '!bg-[#14161f] !text-[#f2efe8] border-[#b9a6ff]/35 placeholder:!text-[#6b7280] rounded-xl',
    formButtonPrimary:
      '!bg-[#b9a6ff] !text-[#0c0a14] hover:!bg-[#c4b5fd] shadow-none rounded-full font-semibold',
    footerActionText: '!text-[#9b97a8]',
    footerActionLink: '!text-[#b9a6ff] hover:!text-[#c4b5fd]',
    identityPreviewText: '!text-[#f2efe8]',
    identityPreviewEditButton: '!text-[#b9a6ff]',
    formFieldAction: '!text-[#b9a6ff]',
    footer: '!bg-[#1c1f2c]',
  },
} as const

export const clerkAppearanceLight = {
  variables: {
    colorPrimary: '#b6ec2e',
    colorDanger: '#dc2626',
    colorSuccess: '#178a45',
    colorWarning: '#d9730d',
    colorText: '#071820',
    colorTextSecondary: '#2f4552',
    colorBackground: '#ffffff',
    colorInputBackground: '#f6faf7',
    colorInputText: '#071820',
    colorNeutral: '#2f4552',
    borderRadius: '0.9rem',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[400px]',
    cardBox: 'shadow-none',
    card: 'border-2 border-[#071820] bg-[#ffffff] shadow-none rounded-2xl',
    headerTitle: '!text-[#071820]',
    headerSubtitle: '!text-[#2f4552]',
    socialButtonsBlockButton:
      'border-2 border-[#071820] !bg-[#f6faf7] !text-[#071820] hover:!bg-[#eef8f1] rounded-xl',
    socialButtonsBlockButtonText: '!text-[#071820]',
    dividerLine: 'bg-[#071820]/20',
    dividerText: '!text-[#2f4552]',
    formFieldLabel: '!text-[#2f4552]',
    formFieldInput:
      '!bg-[#f6faf7] !text-[#071820] border-[#071820]/25 placeholder:!text-[#7a8f9a] rounded-xl',
    formButtonPrimary:
      '!bg-[#b6ec2e] !text-[#071820] hover:!bg-[#c8f135] shadow-none rounded-full font-semibold',
    footerActionText: '!text-[#2f4552]',
    footerActionLink: '!text-[#178a45] hover:!text-[#071820]',
    identityPreviewText: '!text-[#071820]',
    identityPreviewEditButton: '!text-[#178a45]',
    formFieldAction: '!text-[#178a45]',
    footer: '!bg-[#ffffff]',
  },
} as const

/** Default for SSR / before theme resolves — light landing palette. */
export const clerkAppearance = clerkAppearanceLight
