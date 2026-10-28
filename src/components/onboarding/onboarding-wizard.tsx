import { useEffect, useId, useState, useTransition } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, HardDrive, Shield, Upload } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toast } from '#/lib/toast'

import { UploadZone } from '#/components/files/upload-zone'
import { useDriveUpload } from '#/components/files/use-drive-upload'
import { AtmosphereShell } from '#/components/layout/atmosphere-shell'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SwapPresence } from '#/components/motion/animated-presence'
import { FadeIn } from '#/components/motion/fade-in'
import { Stagger, StaggerItem } from '#/components/motion/stagger'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Progress } from '#/components/ui/progress'
import { APP_NAME, ONBOARDING_STEPS } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { riseTransition } from '#/lib/motion'
import { onboardingPreferencesSchema } from '#/lib/validation'
import {
  completeOnboarding,
  markOnboardingUploadDone,
  saveOnboardingPreferences,
  setOnboardingStep,
  skipOnboarding,
} from '#/server/functions/onboarding'

type ViewPreference = 'grid' | 'list'

export type OnboardingState = {
  name: string
  onboardedAt: Date | null
  onboardingStep: number
  viewPreference: ViewPreference
}

type Props = {
  initial: OnboardingState
}

export function OnboardingWizard({ initial }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(
    Math.min(Math.max(initial.onboardingStep, 1), ONBOARDING_STEPS),
  )
  const [name, setName] = useState(initial.name)
  const [viewPreference, setViewPreference] = useState<ViewPreference>(
    initial.viewPreference === 'grid' ? 'grid' : 'list',
  )
  const [uploadDone, setUploadDone] = useState(false)
  const [pending, startTransition] = useTransition()
  const nameId = useId()

  useEffect(() => {
    const key = 'mini-drive:onboarding-step'
    const stored = Number(window.localStorage.getItem(key))
    if (
      Number.isFinite(stored) &&
      stored >= 1 &&
      stored <= ONBOARDING_STEPS &&
      stored > step
    ) {
      setStep(stored)
    }
  }, [step])

  useEffect(() => {
    window.localStorage.setItem('mini-drive:onboarding-step', String(step))
  }, [step])

  function persistStep(next: number) {
    setStep(next)
    startTransition(async () => {
      try {
        await setOnboardingStep({ data: next })
      } catch {
        toast.error('Nepodarilo sa uložiť krok onboarding-u')
      }
    })
  }

  function goNextFromWelcome() {
    persistStep(2)
  }

  function savePreferences() {
    const parsed = onboardingPreferencesSchema.safeParse({
      name,
      viewPreference,
    })
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? 'Neplatné preferencie',
      )
      return
    }

    startTransition(async () => {
      try {
        await saveOnboardingPreferences({
          data: parsed.data,
        })
        setStep(3)
        toast.success('Preferencie uložené')
      } catch (error) {
        toast.error(getErrorMessage(error, 'Uloženie zlyhalo'))
      }
    })
  }

  function finishUploadStep() {
    startTransition(async () => {
      try {
        await markOnboardingUploadDone()
        setStep(4)
      } catch {
        toast.error('Nepodarilo sa pokračovať')
      }
    })
  }

  function finish() {
    startTransition(async () => {
      try {
        await completeOnboarding()
        window.localStorage.removeItem('mini-drive:onboarding-step')
        toast.success('Onboarding dokončený')
        await navigate({ to: '/files' })
      } catch {
        toast.error('Dokončenie zlyhalo')
      }
    })
  }

  function skip() {
    startTransition(async () => {
      try {
        await skipOnboarding()
        window.localStorage.removeItem('mini-drive:onboarding-step')
        toast.message('Onboarding preskočený')
        await navigate({ to: '/files' })
      } catch {
        toast.error('Preskočenie zlyhalo')
      }
    })
  }

  const progressValue = (step / ONBOARDING_STEPS) * 100
  const reduce = useReducedMotion()

  return (
    <AtmosphereShell
      wide
      intensity="soft"
      headerRight={
        <Button
          type="button"
          variant="ghost"
          onClick={skip}
          disabled={pending}
        >
          Preskočiť
        </Button>
      }
    >
      <div className="flex flex-1 flex-col gap-8 py-4">
        <FadeIn>
          <div>
            <p className="font-script text-2xl leading-none text-foreground">
              {APP_NAME}
            </p>
            <h1 className="font-display mt-2 text-4xl">Vitaj</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pripravíme tvoje úložisko za pár krokov.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="space-y-2 rounded-2xl border-2 border-foreground/12 bg-card/80 p-4 backdrop-blur-md dark:border-primary/30">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Krok {step} / {ONBOARDING_STEPS}
              </span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} aria-label="Postup onboarding-u" />
          </div>
        </FadeIn>

        <section
          aria-live="polite"
          className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm backdrop-blur-md sm:p-6"
        >
          <SwapPresence id={step}>
            {step === 1 ? (
              <WelcomeStep onContinue={goNextFromWelcome} pending={pending} />
            ) : null}
            {step === 2 ? (
              <PreferencesStep
                nameId={nameId}
                name={name}
                viewPreference={viewPreference}
                pending={pending}
                onNameChange={setName}
                onViewChange={setViewPreference}
                onBack={() => persistStep(1)}
                onContinue={savePreferences}
              />
            ) : null}
            {step === 3 ? (
              <UploadStep
                uploadDone={uploadDone}
                pending={pending}
                onUploaded={() => {
                  setUploadDone(true)
                  finishUploadStep()
                }}
                onBack={() => persistStep(2)}
                onContinue={finishUploadStep}
              />
            ) : null}
            {step === 4 ? (
              <DoneStep pending={pending} onFinish={finish} reduce={reduce} />
            ) : null}
          </SwapPresence>
        </section>
      </div>
    </AtmosphereShell>
  )
}

function WelcomeStep({
  onContinue,
  pending,
}: {
  onContinue: () => void
  pending: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Mini Drive</h2>
        <p className="text-muted-foreground">
          Súkromné úložisko so súbormi, priečinkami a UploadThing uploadom.
        </p>
      </div>
      <Stagger className="space-y-3">
        {[
          {
            icon: HardDrive,
            title: 'Súkromné súbory',
            body: 'Private ACL — prístup len cez signed URL.',
          },
          {
            icon: Upload,
            title: 'Priečinky',
            body: 'Vnorená štruktúra so breadcrumbs.',
          },
          {
            icon: Shield,
            title: 'Zdieľanie',
            body: 'Safe-url s expiráciou a revoke.',
          },
        ].map((item) => (
          <StaggerItem key={item.title}>
            <motion.li
              className="flex list-none gap-3 rounded-xl border border-border/60 bg-muted/40 p-3 transition-colors hover:bg-accent"
              whileHover={{ y: -2 }}
              transition={riseTransition}
            >
              <item.icon
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            </motion.li>
          </StaggerItem>
        ))}
      </Stagger>
      <Button type="button" onClick={onContinue} disabled={pending}>
        Pokračovať
      </Button>
    </div>
  )
}

function PreferencesStep({
  nameId,
  name,
  viewPreference,
  pending,
  onNameChange,
  onViewChange,
  onBack,
  onContinue,
}: {
  nameId: string
  name: string
  viewPreference: ViewPreference
  pending: boolean
  onNameChange: (value: string) => void
  onViewChange: (value: ViewPreference) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Profil a preferencie</h2>
        <p className="text-sm text-muted-foreground">
          Ako sa máš zobrazovať a ako chceš vidieť súbory.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Meno</Label>
          <Input
            id={nameId}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Tvoje meno"
            autoFocus
          />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Zobrazenie súborov</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: 'list', label: 'Zoznam', hint: 'Kompaktná tabuľka' },
                { value: 'grid', label: 'Mriežka', hint: 'Karty so súbormi' },
              ] as const
            ).map((option) => {
              const selected = viewPreference === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-md border p-4 text-left transition ${
                    selected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:bg-muted/60'
                  }`}
                  aria-pressed={selected}
                  onClick={() => onViewChange(option.value)}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.hint}</p>
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          Späť
        </Button>
        <Button type="button" onClick={onContinue} disabled={pending}>
          Uložiť a pokračovať
        </Button>
      </div>
    </div>
  )
}

function OnboardingUpload({ onUploaded }: { onUploaded: () => void }) {
  const { uploadFiles, isUploading, percent, queue } = useDriveUpload({
    onComplete: () => onUploaded(),
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <UploadZone
        folderId={null}
        folders={[]}
        isUploading={isUploading}
        percent={percent}
        queue={queue}
        onUpload={(files, dest) => void uploadFiles(files, dest)}
      />
    </DndProvider>
  )
}

function UploadStep({
  uploadDone,
  pending,
  onUploaded,
  onBack,
  onContinue,
}: {
  uploadDone: boolean
  pending: boolean
  onUploaded: () => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Prvý súbor</h2>
        <p className="text-sm text-muted-foreground">
          Nahraj súbor cez UploadThing. Môžeš tento krok aj preskočiť.
        </p>
      </div>

      <OnboardingUpload onUploaded={onUploaded} />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          Späť
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onContinue}
          disabled={pending}
        >
          {uploadDone ? 'Pokračovať' : 'Preskočiť upload'}
        </Button>
      </div>
    </div>
  )
}

function DoneStep({
  pending,
  onFinish,
  reduce,
}: {
  pending: boolean
  onFinish: () => void
  reduce: boolean | null
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <motion.span
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={riseTransition}
        >
          <CheckCircle2 className="mt-1 size-7 text-primary" aria-hidden />
        </motion.span>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Hotovo</h2>
          <p className="text-sm text-muted-foreground">
            Účet je pripravený. Pokračuj do súborov.
          </p>
        </div>
      </div>
      <Button type="button" onClick={onFinish} disabled={pending}>
        Prejsť do dashboardu
      </Button>
    </div>
  )
}
