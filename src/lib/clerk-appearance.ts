/**
 * Explicit hex tokens only — never Tailwind semantic classes
 * (`bg-card`, `text-foreground`) that flip under `.dark` and break Clerk.
 */
export const clerkAppearanceDark = {
  variables: {
    colorPrimary: '#22d3ee',
    colorDanger: '#f87171',
    colorSuccess: '#22d3ee',
    colorWarning: '#fbbf24',
    colorText: '#e8eaed',
    colorTextSecondary: '#9aa3b2',
    colorBackground: '#161a22',
    colorInputBackground: '#0e1014',
    colorInputText: '#e8eaed',
    colorNeutral: '#9aa3b2',
    borderRadius: '0.25rem',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[400px]',
    cardBox: 'shadow-none',
    card: 'border border-[#2a3140] bg-[#161a22] shadow-none',
    headerTitle: '!text-[#e8eaed]',
    headerSubtitle: '!text-[#9aa3b2]',
    socialButtonsBlockButton:
      'border border-[#2a3140] !bg-[#0e1014] !text-[#e8eaed] hover:!bg-[#1c2230]',
    socialButtonsBlockButtonText: '!text-[#e8eaed]',
    dividerLine: 'bg-[#2a3140]',
    dividerText: '!text-[#9aa3b2]',
    formFieldLabel: '!text-[#9aa3b2]',
    formFieldInput:
      '!bg-[#0e1014] !text-[#e8eaed] border-[#2a3140] placeholder:!text-[#6b7280]',
    formButtonPrimary:
      '!bg-[#22d3ee] !text-[#041016] hover:!bg-[#67e8f9] shadow-none',
    footerActionText: '!text-[#9aa3b2]',
    footerActionLink: '!text-[#22d3ee] hover:!text-[#67e8f9]',
    identityPreviewText: '!text-[#e8eaed]',
    identityPreviewEditButton: '!text-[#22d3ee]',
    formFieldAction: '!text-[#22d3ee]',
    footer: '!bg-[#161a22]',
  },
} as const

export const clerkAppearanceLight = {
  variables: {
    colorPrimary: '#008ea8',
    colorDanger: '#c62828',
    colorSuccess: '#008ea8',
    colorWarning: '#d9730d',
    colorText: '#12141a',
    colorTextSecondary: '#5c6370',
    colorBackground: '#f1f2f4',
    colorInputBackground: '#ffffff',
    colorInputText: '#12141a',
    colorNeutral: '#5c6370',
    borderRadius: '0.25rem',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[400px]',
    cardBox: 'shadow-none',
    card: 'border border-[#d5d9e0] bg-[#f1f2f4] shadow-none',
    headerTitle: '!text-[#12141a]',
    headerSubtitle: '!text-[#5c6370]',
    socialButtonsBlockButton:
      'border border-[#d5d9e0] !bg-[#ffffff] !text-[#12141a] hover:!bg-[#e8eaed]',
    socialButtonsBlockButtonText: '!text-[#12141a]',
    dividerLine: 'bg-[#d5d9e0]',
    dividerText: '!text-[#5c6370]',
    formFieldLabel: '!text-[#5c6370]',
    formFieldInput:
      '!bg-[#ffffff] !text-[#12141a] border-[#d5d9e0] placeholder:!text-[#9aa3b2]',
    formButtonPrimary:
      '!bg-[#008ea8] !text-[#f4fdff] hover:!bg-[#007a91] shadow-none',
    footerActionText: '!text-[#5c6370]',
    footerActionLink: '!text-[#008ea8] hover:!text-[#007a91]',
    identityPreviewText: '!text-[#12141a]',
    identityPreviewEditButton: '!text-[#008ea8]',
    formFieldAction: '!text-[#008ea8]',
    footer: '!bg-[#f1f2f4]',
  },
} as const

/** Default for SSR / before theme resolves — match industrial dark landing. */
export const clerkAppearance = clerkAppearanceDark
