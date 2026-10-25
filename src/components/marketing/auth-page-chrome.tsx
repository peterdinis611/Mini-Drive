import { APP_NAME } from '#/lib/constants'
import { SITE } from '#/lib/site'

type Props = {
  mode: 'login' | 'register'
}

/** Server-friendly auth intro copy (no client hooks). */
export function AuthPageChrome({ mode }: Props) {
  const isLogin = mode === 'login'
  return (
    <div className="mb-8 space-y-3 text-center sm:text-left">
      <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
        {APP_NAME}
      </p>
      <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] leading-tight font-semibold tracking-tight text-foreground">
        {isLogin ? 'Vitaj späť v archíve' : 'Vytvor si súkromný archív'}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
        {isLogin
          ? 'Prihlás sa a pokračuj v súboroch, zdieľaniach a koši.'
          : SITE.shortDescription}
      </p>
    </div>
  )
}
