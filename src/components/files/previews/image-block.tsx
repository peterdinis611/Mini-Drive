import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
  Check,
  ClipboardCopy,
  Copy,
  Crop,
  Download,
  Eraser,
  ExternalLink,
  FlipHorizontal2,
  FlipVertical2,
  ImageOff,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  PenLine,
  Redo2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  SlidersHorizontal,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { ImageDrawLayer } from '#/components/files/previews/image-draw-layer'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import {
  buildCssFilter,
  clampViewZoom,
  downloadBlob,
  filtersAreDefault,
  getCroppedImageBlob,
  getTransformedImageBlob,
  withCroppedName,
  withEditedName,
  type DrawStroke,
  type ImageFilterValues,
} from '#/lib/crop-image'
import { formatFileSize } from '#/lib/format'
import { loadImageMeta, saveImageMeta } from '#/lib/image-meta'
import { toast } from '#/lib/toast'
import { uploadFiles } from '#/lib/uploadthing'
import { cn } from '#/lib/utils'

import type { PreviewShellProps } from './types'

type AspectId = 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16' | 'A4'
type ViewFit = 'contain' | 'actual'
type ViewerMode = 'view' | 'crop' | 'draw'

const ASPECTS: Array<{ id: AspectId; label: string; value: number | undefined }> =
  [
    { id: 'free', label: 'Voľný', value: undefined },
    { id: '1:1', label: '1:1', value: 1 },
    { id: '4:3', label: '4:3', value: 4 / 3 },
    { id: '3:2', label: '3:2', value: 3 / 2 },
    { id: '16:9', label: '16:9', value: 16 / 9 },
    { id: '9:16', label: '9:16', value: 9 / 16 },
    { id: 'A4', label: 'A4', value: 210 / 297 },
  ]

const STROKE_COLORS = ['#ffffff', '#b6ec2e', '#7eb8ff', '#f43f5e', '#fbbf24'] as const

const STROKE_WIDTHS = [
  { id: 's', label: 'Tenké', value: 0.006 },
  { id: 'm', label: 'Stredné', value: 0.01 },
  { id: 'l', label: 'Hrubé', value: 0.018 },
] as const

type FilterPresetId = 'reset' | 'vivid' | 'muted' | 'bw' | 'sepia' | 'bright'

const FILTER_PRESETS: Array<{
  id: FilterPresetId
  label: string
  values: Required<ImageFilterValues>
}> = [
  {
    id: 'reset',
    label: 'Originál',
    values: {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'vivid',
    label: 'Živý',
    values: {
      brightness: 1.05,
      contrast: 1.15,
      saturation: 1.35,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'muted',
    label: 'Tlmený',
    values: {
      brightness: 0.98,
      contrast: 0.92,
      saturation: 0.65,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'bw',
    label: 'B&W',
    values: {
      brightness: 1,
      contrast: 1.1,
      saturation: 1,
      grayscale: 1,
      sepia: 0,
    },
  },
  {
    id: 'sepia',
    label: 'Sépia',
    values: {
      brightness: 1.05,
      contrast: 1.05,
      saturation: 0.9,
      grayscale: 0,
      sepia: 0.65,
    },
  },
  {
    id: 'bright',
    label: 'Svetlý',
    values: {
      brightness: 1.25,
      contrast: 0.95,
      saturation: 1.05,
      grayscale: 0,
      sepia: 0,
    },
  },
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
  fileSize,
  fileId,
  folderId = null,
  onRequestShare,
  onSavedToDrive,
}: PreviewShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const [failed, setFailed] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [mode, setMode] = useState<ViewerMode>('view')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [viewZoom, setViewZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [aspectId, setAspectId] = useState<AspectId>('free')
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [fit, setFit] = useState<ViewFit>('contain')
  const [showMeta, setShowMeta] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [saturation, setSaturation] = useState(1)
  const [grayscale, setGrayscale] = useState(0)
  const [sepia, setSepia] = useState(0)
  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState(fileName)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  )
  const [strokes, setStrokes] = useState<DrawStroke[]>([])
  const [redoStrokes, setRedoStrokes] = useState<DrawStroke[]>([])
  const [strokeColor, setStrokeColor] = useState<string>(STROKE_COLORS[1])
  const [strokeWidthNorm, setStrokeWidthNorm] = useState(0.01)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const filterValues: ImageFilterValues = {
    brightness,
    contrast,
    saturation,
    grayscale,
    sepia,
  }

  const panDrag = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const aspect = ASPECTS.find((item) => item.id === aspectId)?.value
  const cropping = mode === 'crop'
  const drawing = mode === 'draw'
  const hasEdits =
    rotation !== 0 ||
    flipH ||
    flipV ||
    viewZoom !== 1 ||
    fit !== 'contain' ||
    !filtersAreDefault(filterValues) ||
    strokes.length > 0
  const hasExportableEdits =
    rotation !== 0 ||
    flipH ||
    flipV ||
    !filtersAreDefault(filterValues) ||
    strokes.length > 0

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  function applyFilterPreset(preset: (typeof FILTER_PRESETS)[number]) {
    setBrightness(preset.values.brightness)
    setContrast(preset.values.contrast)
    setSaturation(preset.values.saturation)
    setGrayscale(preset.values.grayscale)
    setSepia(preset.values.sepia)
  }

  function resetTransforms() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setViewZoom(1)
    setPan({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAspectId('free')
    setBrightness(1)
    setContrast(1)
    setSaturation(1)
    setGrayscale(0)
    setSepia(0)
    setStrokes([])
    setRedoStrokes([])
    setFit('contain')
    setMode('view')
  }

  function updateStrokes(next: DrawStroke[]) {
    setStrokes(next)
    setRedoStrokes([])
  }

  function undoStroke() {
    setStrokes((current) => {
      if (current.length === 0) return current
      const removed = current[current.length - 1]!
      setRedoStrokes((redo) => [...redo, removed])
      return current.slice(0, -1)
    })
  }

  function redoStroke() {
    setRedoStrokes((redo) => {
      if (redo.length === 0) return redo
      const restored = redo[redo.length - 1]!
      setStrokes((current) => [...current, restored])
      return redo.slice(0, -1)
    })
  }

  useEffect(() => {
    const meta = loadImageMeta(fileId, fileName)
    setFailed(false)
    setImageLoading(true)
    setMode('view')
    setCaption(meta.caption)
    setAltText(meta.altText)
    setNaturalSize(null)
    setViewZoom(1)
    setPan({ x: 0, y: 0 })
    setFit('contain')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAspectId('free')
    setBrightness(1)
    setContrast(1)
    setSaturation(1)
    setGrayscale(0)
    setSepia(0)
    setStrokes([])
    setRedoStrokes([])
    setStrokeWidthNorm(0.01)
    setShowMeta(Boolean(meta.caption))
    setShowFilters(false)
  }, [url, fileName, fileId])

  useEffect(() => {
    saveImageMeta(fileId, { caption, altText })
  }, [fileId, caption, altText])

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === rootRef.current)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.key === 'Escape' && mode !== 'view') {
        event.preventDefault()
        setMode('view')
        return
      }
      if (cropping) return
      switch (event.key.toLowerCase()) {
        case '+':
        case '=':
          event.preventDefault()
          setViewZoom((v) => clampViewZoom(v + 0.1))
          break
        case '-':
        case '_':
          event.preventDefault()
          setViewZoom((v) => clampViewZoom(v - 0.1))
          break
        case '0':
          event.preventDefault()
          setViewZoom(1)
          setPan({ x: 0, y: 0 })
          setFit('contain')
          break
        case 'r':
          if (!event.shiftKey) {
            event.preventDefault()
            setRotation((v) => ((v + 90) % 360 + 360) % 360)
          }
          break
        case 'c':
          event.preventDefault()
          setMode('crop')
          break
        case 'd':
          event.preventDefault()
          setMode((m) => {
            if (m === 'draw') return 'view'
            if (rotation % 360 !== 0) {
              toast.error('Pred kreslením nastav rotáciu na 0°')
              return m
            }
            return 'draw'
          })
          break
        case 'f':
          event.preventDefault()
          void toggleFullscreen()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, cropping, rotation])

  function exitCrop() {
    setMode('view')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  async function toggleFullscreen() {
    const el = rootRef.current
    if (!el) return
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {
      toast.error('Fullscreen nie je dostupný')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Odkaz skopírovaný')
    } catch {
      toast.error('Kopírovanie zlyhalo')
    }
  }

  async function copyImage() {
    try {
      if (!('clipboard' in navigator) || !window.ClipboardItem) {
        toast.error('Schránka nepodporuje obrázky')
        return
      }
      const blob = hasExportableEdits
        ? await getTransformedImageBlob(url, rotation, {
            ...exportOptions(),
            mimeType: 'image/png',
          })
        : await (await fetch(url)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob }),
      ])
      toast.success(
        hasExportableEdits
          ? 'Upravený obrázok v schránke'
          : 'Obrázok v schránke',
      )
    } catch {
      toast.error('Kopírovanie obrázka zlyhalo')
    }
  }

  function exportOptions() {
    const outMime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg'
    return {
      flipHorizontal: flipH,
      flipVertical: flipV,
      mimeType: outMime,
      brightness,
      contrast,
      saturation,
      grayscale,
      sepia,
      strokes,
    }
  }

  async function buildCroppedFile() {
    if (!croppedAreaPixels) return null
    const blob = await getCroppedImageBlob(
      url,
      croppedAreaPixels,
      rotation,
      exportOptions(),
    )
    return new File([blob], withCroppedName(fileName), {
      type: exportOptions().mimeType,
    })
  }

  async function buildEditedFile() {
    const opts = exportOptions()
    const blob = await getTransformedImageBlob(url, rotation, opts)
    return new File([blob], withEditedName(fileName), { type: opts.mimeType })
  }

  async function applyCropAndDownload() {
    setBusy(true)
    try {
      const file = await buildCroppedFile()
      if (!file) return
      downloadBlob(file, file.name)
      toast.success('Orezané a stiahnuté')
      exitCrop()
    } catch {
      toast.error('Orezanie zlyhalo — skús stiahnuť originál')
    } finally {
      setBusy(false)
    }
  }

  async function applyCropAndSave(saveMode: 'replace' | 'saveAs') {
    if (!fileId) {
      toast.error('Chýba ID súboru')
      return
    }
    setBusy(true)
    try {
      const file = await buildCroppedFile()
      if (!file) return
      await uploadFiles('driveUploader', {
        files: [file],
        input: {
          folderId: saveMode === 'saveAs' ? folderId : null,
          replaceFileId: saveMode === 'replace' ? fileId : null,
          saveAsName: saveMode === 'saveAs' ? file.name : null,
        },
      })
      toast.success(
        saveMode === 'replace'
          ? 'Uložené ako nová verzia'
          : 'Uložené ako nový súbor',
      )
      exitCrop()
      onSavedToDrive?.()
    } catch {
      toast.error('Uloženie do Drive zlyhalo')
    } finally {
      setBusy(false)
    }
  }

  async function saveEdits(saveMode: 'download' | 'replace' | 'saveAs') {
    setBusy(true)
    try {
      const file = await buildEditedFile()
      if (saveMode === 'download') {
        downloadBlob(file, file.name)
        toast.success('Úpravy stiahnuté')
        return
      }
      if (!fileId) {
        toast.error('Chýba ID súboru')
        return
      }
      await uploadFiles('driveUploader', {
        files: [file],
        input: {
          folderId: saveMode === 'saveAs' ? folderId : null,
          replaceFileId: saveMode === 'replace' ? fileId : null,
          saveAsName: saveMode === 'saveAs' ? file.name : null,
        },
      })
      toast.success(
        saveMode === 'replace'
          ? 'Úpravy uložené ako nová verzia'
          : 'Úpravy uložené ako nový súbor',
      )
      resetTransforms()
      onSavedToDrive?.()
    } catch {
      toast.error('Export úprav zlyhal')
    } finally {
      setBusy(false)
    }
  }

  function onStageWheel(event: React.WheelEvent) {
    if (cropping) return
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    setViewZoom((value) => clampViewZoom(value + delta))
  }

  function onStagePointerDown(event: React.PointerEvent) {
    if (cropping || drawing || viewZoom <= 1) return
    if (event.button !== 0) return
    panDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onStagePointerMove(event: React.PointerEvent) {
    const drag = panDrag.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setPan({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    })
  }

  function onStagePointerUp(event: React.PointerEvent) {
    if (panDrag.current?.pointerId === event.pointerId) {
      panDrag.current = null
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
      <div
        ref={rootRef}
        className="flex h-[min(72vh,680px)] flex-col bg-[#0c0e12] data-[fs=true]:h-screen"
        data-fs={isFullscreen || undefined}
      >
        <div className="relative z-20 flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-[#12151b]/90 px-2 py-1.5 backdrop-blur-md">
          <div className="mr-auto hidden min-w-0 max-w-[28%] px-1 lg:block">
            <p className="truncate text-[11px] text-white/55">{fileName}</p>
            <p className="truncate text-[10px] text-white/35">
              {formatFileSize(fileSize)}
              {mimeType ? ` · ${mimeType}` : ''}
            </p>
          </div>

          {!cropping ? (
            <>
              <ToolButton
                label="Orezať (C)"
                active={false}
                onClick={() => setMode('crop')}
              >
                <Crop className="size-4" />
              </ToolButton>
              <ToolButton
                label="Otočiť doľava"
                onClick={() =>
                  setRotation((value) => ((value - 90) % 360 + 360) % 360)
                }
              >
                <RotateCcw className="size-4" />
              </ToolButton>
              <ToolButton
                label="Otočiť doprava (R)"
                onClick={() =>
                  setRotation((value) => ((value + 90) % 360 + 360) % 360)
                }
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
                label="Oddialiť (−)"
                onClick={() => setViewZoom((value) => clampViewZoom(value - 0.1))}
              >
                <ZoomOut className="size-4" />
              </ToolButton>
              <ToolButton
                label="Priblížiť (+)"
                onClick={() => setViewZoom((value) => clampViewZoom(value + 0.1))}
              >
                <ZoomIn className="size-4" />
              </ToolButton>
              <ToolButton
                label={fit === 'contain' ? 'Skutočná veľkosť (0)' : 'Prispôsobiť (0)'}
                active={fit === 'actual'}
                onClick={() => {
                  setFit((value) => (value === 'contain' ? 'actual' : 'contain'))
                  setViewZoom(1)
                  setPan({ x: 0, y: 0 })
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
                label="Kresliť (D)"
                active={drawing}
                onClick={() => {
                  if (rotation % 360 !== 0) {
                    toast.error('Pred kreslením nastav rotáciu na 0°')
                    return
                  }
                  setMode((m) => (m === 'draw' ? 'view' : 'draw'))
                }}
              >
                <PenLine className="size-4" />
              </ToolButton>
              <ToolButton
                label="Jas / kontrast"
                active={showFilters}
                onClick={() => setShowFilters((value) => !value)}
              >
                <SlidersHorizontal className="size-4" />
              </ToolButton>
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
                label="Kopírovať obrázok"
                onClick={() => void copyImage()}
              >
                <ClipboardCopy className="size-4" />
              </ToolButton>
              <ToolButton
                label="Otvoriť na novej karte"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-4" />
              </ToolButton>
              <ToolButton
                label="Fullscreen (F)"
                active={isFullscreen}
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </ToolButton>
              <ToolButton
                label="Reset úprav"
                onClick={resetTransforms}
                disabled={!hasEdits}
              >
                <RefreshCw className="size-4" />
              </ToolButton>
              {fileId && onRequestShare ? (
                <ToolButton label="Safe URL (zdieľať)" onClick={onRequestShare}>
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
              {hasExportableEdits ? (
                <>
                  <div className="mx-1 h-5 w-px bg-white/10" />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1.5 bg-white text-black hover:bg-white/90"
                    disabled={busy}
                    onClick={() => void saveEdits('download')}
                  >
                    {busy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    Export
                  </Button>
                  {fileId ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={busy}
                      onClick={() => void saveEdits('replace')}
                    >
                      <Save className="size-3.5" />
                      Uložiť
                    </Button>
                  ) : null}
                </>
              ) : null}
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
              {fileId ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={busy || !croppedAreaPixels}
                    onClick={() => void applyCropAndSave('replace')}
                  >
                    {busy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Nahradiť
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-1.5"
                    disabled={busy || !croppedAreaPixels}
                    onClick={() => void applyCropAndSave('saveAs')}
                  >
                    Uložiť ako
                  </Button>
                </>
              ) : null}
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
                {busy ? 'Export…' : 'Stiahnuť'}
              </Button>
            </>
          )}
        </div>

        {drawing ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#12151b]/80 px-3 py-1.5">
            <span className="text-[10px] tracking-wide text-white/40 uppercase">
              Pero
            </span>
            {STROKE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Farba ${color}`}
                className={cn(
                  'size-5 rounded-full ring-offset-2 ring-offset-[#12151b]',
                  strokeColor === color && 'ring-2 ring-white',
                )}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
              />
            ))}
            <div className="mx-0.5 h-5 w-px bg-white/10" />
            {STROKE_WIDTHS.map((width) => (
              <Button
                key={width.id}
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  'h-7 px-2 text-[11px] text-white/70 hover:bg-white/10 hover:text-white',
                  strokeWidthNorm === width.value && 'bg-white/15 text-white',
                )}
                onClick={() => setStrokeWidthNorm(width.value)}
              >
                {width.label}
              </Button>
            ))}
            <ToolButton
              label="Späť ťah"
              disabled={strokes.length === 0}
              onClick={undoStroke}
            >
              <Undo2 className="size-4" />
            </ToolButton>
            <ToolButton
              label="Znova ťah"
              disabled={redoStrokes.length === 0}
              onClick={redoStroke}
            >
              <Redo2 className="size-4" />
            </ToolButton>
            <ToolButton
              label="Vymazať kresbu"
              disabled={strokes.length === 0}
              onClick={() => {
                setStrokes([])
                setRedoStrokes([])
              }}
            >
              <Eraser className="size-4" />
            </ToolButton>
            <span className="text-[11px] text-white/40">
              {strokes.length} ťahov · Esc ukončí kreslenie
            </span>
          </div>
        ) : null}

        {showFilters ? (
          <div className="space-y-3 border-b border-white/10 bg-[#12151b]/80 px-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => applyFilterPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-3 text-[11px] text-white/55">
                Jas
                <input
                  type="range"
                  min={0.4}
                  max={1.8}
                  step={0.05}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-8 tabular-nums text-white/70">
                  {Math.round(brightness * 100)}%
                </span>
              </label>
              <label className="flex items-center gap-3 text-[11px] text-white/55">
                Kontrast
                <input
                  type="range"
                  min={0.4}
                  max={1.8}
                  step={0.05}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-8 tabular-nums text-white/70">
                  {Math.round(contrast * 100)}%
                </span>
              </label>
              <label className="flex items-center gap-3 text-[11px] text-white/55">
                Saturácia
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-8 tabular-nums text-white/70">
                  {Math.round(saturation * 100)}%
                </span>
              </label>
              <label className="flex items-center gap-3 text-[11px] text-white/55">
                B&W
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={grayscale}
                  onChange={(e) => setGrayscale(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-8 tabular-nums text-white/70">
                  {Math.round(grayscale * 100)}%
                </span>
              </label>
              <label className="flex items-center gap-3 text-[11px] text-white/55">
                Sépia
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={sepia}
                  onChange={(e) => setSepia(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-8 tabular-nums text-white/70">
                  {Math.round(sepia * 100)}%
                </span>
              </label>
              <label className="flex items-center gap-3 text-[11px] text-white/55">
                Jemné
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={1}
                  value={(() => {
                    const nearest = Math.round(rotation / 90) * 90
                    return Math.max(-15, Math.min(15, rotation - nearest))
                  })()}
                  onChange={(e) => {
                    const fine = Number(e.target.value)
                    const nearest = Math.round(rotation / 90) * 90
                    setRotation(nearest + fine)
                  }}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 tabular-nums text-white/70">
                  {Math.round(rotation)}°
                </span>
              </label>
            </div>
          </div>
        ) : null}

        <div
          ref={stageRef}
          className={cn(
            'relative min-h-0 flex-1',
            viewZoom > 1 && !cropping && !drawing && 'cursor-grab active:cursor-grabbing',
          )}
          onWheel={onStageWheel}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerUp}
        >
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
            <div className="flex h-full items-center justify-center overflow-hidden p-4">
              <div
                className="relative max-h-full max-w-full transition-transform duration-150"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${viewZoom})`,
                  filter: buildCssFilter(filterValues),
                }}
              >
                <img
                  src={url}
                  alt={altText || fileName}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className={cn(
                    'rounded-md object-contain shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/10 select-none',
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
                    setNaturalSize({
                      w: img.naturalWidth,
                      h: img.naturalHeight,
                    })
                    if (img.naturalWidth < 2 || img.naturalHeight < 2) {
                      setFailed(true)
                    }
                  }}
                />
                <ImageDrawLayer
                  enabled={drawing && Math.abs(rotation % 360) < 0.01}
                  color={strokeColor}
                  widthNorm={strokeWidthNorm}
                  strokes={strokes}
                  onChange={updateStrokes}
                  flipHorizontal={flipH}
                  flipVertical={flipV}
                />
              </div>
            </div>
          )}
        </div>

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
            <span className="truncate">
              {fileName}
              <span className="text-white/25">
                {' '}
                · {formatFileSize(fileSize)}
              </span>
            </span>
            <span>
              {naturalSize
                ? `${naturalSize.w}×${naturalSize.h}px`
                : imageLoading
                  ? '…'
                  : '—'}
              {viewZoom !== 1 ? ` · ${Math.round(viewZoom * 100)}%` : ''}
              {strokes.length > 0 ? ` · ${strokes.length} ťahov` : ''}
            </span>
          </div>
          {cropping ? (
            <p className="text-center text-[11px] text-white/40">
              Posuň a priblíž, potom ulož alebo stiahni orez.
            </p>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  )
}
