import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
  Check,
  Copy,
  Crop,
  Download,
  ExternalLink,
  FlipHorizontal2,
  FlipVertical2,
  ImageOff,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import {
  downloadBlob,
  getCroppedImageBlob,
  withCroppedName,
} from '#/lib/crop-image'
import { toast } from '#/lib/toast'
import { cn } from '#/lib/utils'

import type { PreviewShellProps } from './types'

type AspectId = 'free' | '1:1' | '4:3' | '16:9' | '3:2'
type ViewFit = 'contain' | 'actual'

const ASPECTS: Array<{ id: AspectId; label: string; value: number | undefined }> =
  [
    { id: 'free', label: 'Voľný', value: undefined },
    { id: '1:1', label: '1:1', value: 1 },
    { id: '4:3', label: '4:3', value: 4 / 3 },
    { id: '3:2', label: '3:2', value: 3 / 2 },
    { id: '16:9', label: '16:9', value: 16 / 9 },
  ]

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={active ? 'secondary' : 'ghost'}
          className={
            active
              ? 'size-8 shrink-0 bg-white/15 text-white'
              : 'size-8 shrink-0 text-white/80 hover:bg-white/10 hover:text-white'
          }
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export function ImageBlock({
  url,
  fileName,
  mimeType,
  fileId,
  onRequestShare,
}: PreviewShellProps) {
  const [failed, setFailed] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [cropping, setCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [viewZoom, setViewZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [aspectId, setAspectId] = useState<AspectId>('free')
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [fit, setFit] = useState<ViewFit>('contain')
  const [showMeta, setShowMeta] = useState(false)
  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState(fileName)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  )

  const aspect = ASPECTS.find((item) => item.id === aspectId)?.value

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  function resetTransforms() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setViewZoom(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAspectId('free')
  }

  useEffect(() => {
    setFailed(false)
    setImageLoading(true)
    setCropping(false)
    setCaption('')
    setAltText(fileName)
    setNaturalSize(null)
    setViewZoom(1)
    setFit('contain')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAspectId('free')
  }, [url, fileName])

  function exitCrop() {
    setCropping(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Odkaz skopírovaný')
    } catch {
      toast.error('Kopírovanie zlyhalo')
    }
  }

  async function applyCropAndDownload() {
    if (!croppedAreaPixels) return
    setBusy(true)
    try {
      const blob = await getCroppedImageBlob(url, croppedAreaPixels, rotation, {
        flipHorizontal: flipH,
        flipVertical: flipV,
        mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
      })
      downloadBlob(blob, withCroppedName(fileName))
      toast.success('Orezané a stiahnuté')
      exitCrop()
    } catch {
      toast.error('Orezanie zlyhalo — skús stiahnuť originál')
    } finally {
      setBusy(false)
    }
  }

  if (failed) {
    return (
      <div className="flex h-[min(70vh,640px)] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
        <ImageOff className="size-8 opacity-60" />
        <p>
          Obrázok sa nepodarilo zobraziť (poškodený súbor alebo vypršaný odkaz).
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={url} target="_blank" rel="noreferrer">
            <Download />
            Otvoriť originál
          </a>
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-[min(72vh,680px)] flex-col bg-[#0c0e12]">
        <div className="relative z-20 flex flex-wrap items-center justify-center gap-0.5 border-b border-white/10 bg-[#12151b]/90 px-2 py-1.5 backdrop-blur-md">
          {!cropping ? (
            <>
              <ToolButton label="Orezať" onClick={() => setCropping(true)}>
                <Crop className="size-4" />
              </ToolButton>
              <ToolButton
                label="Otočiť doľava"
                onClick={() => setRotation((value) => (value - 90) % 360)}
              >
                <RotateCcw className="size-4" />
              </ToolButton>
              <ToolButton
                label="Otočiť doprava"
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                <RotateCw className="size-4" />
              </ToolButton>
              <ToolButton
                label="Prevrátiť vodorovne"
                active={flipH}
                onClick={() => setFlipH((value) => !value)}
              >
                <FlipHorizontal2 className="size-4" />
              </ToolButton>
              <ToolButton
                label="Prevrátiť zvisle"
                active={flipV}
                onClick={() => setFlipV((value) => !value)}
              >
                <FlipVertical2 className="size-4" />
              </ToolButton>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <ToolButton
                label="Oddialiť"
                onClick={() =>
                  setViewZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(2))))
                }
              >
                <ZoomOut className="size-4" />
              </ToolButton>
              <ToolButton
                label="Priblížiť"
                onClick={() =>
                  setViewZoom((value) => Math.min(3, Number((value + 0.1).toFixed(2))))
                }
              >
                <ZoomIn className="size-4" />
              </ToolButton>
              <ToolButton
                label={fit === 'contain' ? 'Skutočná veľkosť' : 'Prispôsobiť'}
                active={fit === 'actual'}
                onClick={() => {
                  setFit((value) => (value === 'contain' ? 'actual' : 'contain'))
                  setViewZoom(1)
                }}
              >
                {fit === 'contain' ? (
                  <Maximize2 className="size-4" />
                ) : (
                  <Minimize2 className="size-4" />
                )}
              </ToolButton>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <ToolButton
                label="Popis / alt text"
                active={showMeta}
                onClick={() => setShowMeta((value) => !value)}
              >
                <Type className="size-4" />
              </ToolButton>
              <ToolButton label="Kopírovať odkaz" onClick={() => void copyLink()}>
                <Copy className="size-4" />
              </ToolButton>
              <ToolButton
                label="Otvoriť na novej karte"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-4" />
              </ToolButton>
              <ToolButton
                label="Reset úprav"
                onClick={resetTransforms}
                disabled={
                  rotation === 0 &&
                  !flipH &&
                  !flipV &&
                  viewZoom === 1 &&
                  fit === 'contain'
                }
              >
                <RefreshCw className="size-4" />
              </ToolButton>
              {fileId && onRequestShare ? (
                <ToolButton
                  label="Safe URL (zdieľať)"
                  onClick={onRequestShare}
                >
                  <Link2 className="size-4" />
                </ToolButton>
              ) : null}
              <ToolButton
                label="Stiahnuť originál"
                onClick={() => {
                  const anchor = document.createElement('a')
                  anchor.href = url
                  anchor.download = fileName
                  anchor.target = '_blank'
                  anchor.rel = 'noreferrer'
                  anchor.click()
                }}
              >
                <Download className="size-4" />
              </ToolButton>
            </>
          ) : (
            <>
              <ToolButton label="Zrušiť orez" onClick={exitCrop}>
                <X className="size-4" />
              </ToolButton>
              <div className="mx-1 h-5 w-px bg-white/10" />
              {ASPECTS.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-8 px-2 text-xs text-white/75 hover:bg-white/10 hover:text-white',
                    aspectId === item.id && 'bg-white/15 text-white',
                  )}
                  onClick={() => setAspectId(item.id)}
                >
                  {item.label}
                </Button>
              ))}
              <div className="mx-1 h-5 w-px bg-white/10" />
              <ToolButton
                label="Oddialiť"
                onClick={() => setZoom((value) => Math.max(1, value - 0.1))}
              >
                <ZoomOut className="size-4" />
              </ToolButton>
              <input
                aria-label="Zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mx-1 w-24 accent-white"
              />
              <ToolButton
                label="Priblížiť"
                onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
              >
                <ZoomIn className="size-4" />
              </ToolButton>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 bg-white text-black hover:bg-white/90"
                disabled={busy || !croppedAreaPixels}
                onClick={() => void applyCropAndDownload()}
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {busy ? 'Export…' : 'Orezať a stiahnuť'}
              </Button>
            </>
          )}
        </div>

        <div className="relative min-h-0 flex-1">
          {imageLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0c0e12]/80 text-sm text-white/60">
              <Loader2 className="size-6 animate-spin text-white/80" />
              Načítavam obrázok…
            </div>
          ) : null}

          {cropping ? (
            <Cropper
              image={url}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              showGrid
              objectFit="contain"
              style={{
                containerStyle: { background: '#0c0e12' },
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <div
                className="relative max-h-full max-w-full transition-transform duration-200"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${viewZoom})`,
                }}
              >
                <img
                  src={url}
                  alt={altText || fileName}
                  referrerPolicy="no-referrer"
                  className={cn(
                    'rounded-md object-contain shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
                    fit === 'contain'
                      ? 'max-h-[min(56vh,520px)] max-w-full'
                      : 'max-w-none',
                    imageLoading && 'opacity-0',
                  )}
                  onError={() => {
                    setImageLoading(false)
                    setFailed(true)
                  }}
                  onLoad={(event) => {
                    const img = event.currentTarget
                    setImageLoading(false)
                    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
                    if (img.naturalWidth < 2 || img.naturalHeight < 2) {
                      setFailed(true)
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Notion-like caption / meta strip */}
        <div className="space-y-2 border-t border-white/10 bg-[#12151b]/95 px-4 py-3 backdrop-blur-md">
          {showMeta ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] tracking-wide text-white/40 uppercase">
                  Popis
                </label>
                <Input
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Pridať popis…"
                  className="h-8 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/35"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-wide text-white/40 uppercase">
                  Alt text
                </label>
                <Input
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="Popis pre prístupnosť…"
                  className="h-8 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/35"
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full text-center text-sm text-white/45 transition hover:text-white/70"
              onClick={() => setShowMeta(true)}
            >
              {caption || 'Pridať popis…'}
            </button>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/35">
            <span className="truncate">{fileName}</span>
            <span>
              {naturalSize
                ? `${naturalSize.w}×${naturalSize.h}px`
                : imageLoading
                  ? '…'
                  : '—'}
              {viewZoom !== 1 ? ` · ${Math.round(viewZoom * 100)}%` : ''}
            </span>
          </div>
          {cropping ? (
            <p className="text-center text-[11px] text-white/40">
              Posuň a priblíž, potom „Orezať a stiahnuť“.
            </p>
          ) : null}
        </div>

      </div>
    </TooltipProvider>
  )
}
