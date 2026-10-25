/** Shared Clerk UI tokens — graphite + electric cyan. */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#008ea8',
    colorDanger: '#c62828',
    colorSuccess: '#008ea8',
    colorWarning: '#d9730d',
    colorText: '#12141a',
    colorTextSecondary: '#5c6370',
    colorBackground: '#f1f2f4',
    colorInputBackground: '#f7f8fa',
    colorInputText: '#12141a',
    borderRadius: '0.25rem',
  },
  elements: {
    rootBox: 'mx-auto w-full',
    card: 'rounded-sm border border-border/80 bg-card/80 shadow-none backdrop-blur-sm',
    formButtonPrimary:
      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-none',
    footerActionLink: 'text-primary hover:text-primary/80',
  },
} as const
