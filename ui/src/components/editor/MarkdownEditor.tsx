import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { type Extension, Prec } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import {
  ActionIcon,
  Divider,
  FileButton,
  Group,
  Loader,
  Menu,
  SegmentedControl,
  Text,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core'
import { useDisclosure, useHotkeys, useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import CodeMirror from '@uiw/react-codemirror'
import { type ComponentType, type ReactNode, useDeferredValue, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { errorCode } from '../../api/client'
import {
  IconBold,
  IconCode,
  IconHeading,
  IconHelp,
  IconItalic,
  IconLink,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconMath,
  IconMathFunction,
  IconMaximize,
  IconMinimize,
  IconPhoto,
  IconQuote,
  IconSeparatorHorizontal,
  IconSourceCode,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTable,
  IconTemplate,
} from '../../icons'
import { Markdown } from '../Markdown'
import {
  BULLET_PREFIX,
  HEADING_PREFIX,
  insertBlock,
  link,
  prefixLines,
  QUOTE_PREFIX,
  wrap,
} from './commands'
import { MarkdownHelp } from './MarkdownHelp'
import classes from './MarkdownEditor.module.css'

type Mode = 'edit' | 'split' | 'preview'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  /** Upload an image and return its URL. Without it the image button, paste and drop are disabled. */
  uploadImage?: (file: File) => Promise<string>
  placeholder?: string
  /** Editor height in pixels when not fullscreen. */
  height?: number
  label?: ReactNode
  description?: ReactNode
}

// Colours for Markdown syntax inside the editor, readable in both colour schemes.
const highlightLight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: '700', color: '#3b5bdb' },
  { tag: tags.strong, fontWeight: '700', color: '#c2255c' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#c2255c' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#1971c2' },
  { tag: tags.url, color: '#1971c2', textDecoration: 'underline' },
  { tag: tags.monospace, color: '#d6336c' },
  { tag: tags.quote, color: '#868e96', fontStyle: 'italic' },
  { tag: [tags.processingInstruction, tags.contentSeparator], color: '#adb5bd' },
  { tag: tags.list, color: '#5f3dc4' },
])
const highlightDark = HighlightStyle.define([
  { tag: tags.heading, fontWeight: '700', color: '#91a7ff' },
  { tag: tags.strong, fontWeight: '700', color: '#faa2c1' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#faa2c1' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#74c0fc' },
  { tag: tags.url, color: '#74c0fc', textDecoration: 'underline' },
  { tag: tags.monospace, color: '#f783ac' },
  { tag: tags.quote, color: '#909296', fontStyle: 'italic' },
  { tag: [tags.processingInstruction, tags.contentSeparator], color: '#5c5f66' },
  { tag: tags.list, color: '#b197fc' },
])

const baseTheme = EditorView.theme({
  '&': { fontSize: '14px', height: '100%', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mantine-font-family-monospace)', lineHeight: '1.6' },
  '.cm-content': { padding: '12px 0' },
  '.cm-line': { padding: '0 14px' },
  '.cm-gutters': { display: 'none' },
})

function ToolButton(props: { label: string; shortcut?: string; icon: ComponentType<{ size?: number }>; onClick: () => void }) {
  const { icon: Icon } = props
  return (
    <Tooltip label={props.shortcut ? `${props.label} (${props.shortcut})` : props.label} withArrow openDelay={300}>
      <ActionIcon variant="subtle" color="gray" size="md" onClick={props.onClick} aria-label={props.label}>
        <Icon size={18} />
      </ActionIcon>
    </Tooltip>
  )
}

/**
 * Markdown editor for problem statements and editorials: syntax-highlighted source (CodeMirror),
 * formatting toolbar with shortcuts, image upload (button, paste, drag-and-drop), live preview
 * side by side, fullscreen and a syntax guide.
 */
export function MarkdownEditor({
  value,
  onChange,
  uploadImage,
  placeholder,
  height = 560,
  label,
  description,
}: MarkdownEditorProps) {
  const { t } = useTranslation()
  const scheme = useComputedColorScheme('light')
  const wide = useMediaQuery('(min-width: 62em)', true)
  const [mode, setMode] = useState<Mode | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [helpOpened, help] = useDisclosure(false)
  const viewRef = useRef<EditorView | null>(null)
  const preview = useDeferredValue(value)
  const effectiveMode: Mode = mode ?? (wide ? 'split' : 'edit')

  useHotkeys([['Escape', () => setFullscreen(false)]], [], true)

  const run = (fn: (view: EditorView) => void) => () => {
    if (viewRef.current) fn(viewRef.current)
  }

  // Upload images, then insert Markdown for each at `pos` (or the cursor).
  const uploadRef = useRef(uploadImage)
  uploadRef.current = uploadImage
  const insertImages = async (files: File[], pos?: number) => {
    const upload = uploadRef.current
    const view = viewRef.current
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (!upload || !view || images.length === 0) return
    setUploading((n) => n + images.length)
    const snippets: string[] = []
    for (const file of images) {
      try {
        snippets.push(`![${file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '')}](${await upload(file)})`)
      } catch (e) {
        notifications.show({ color: 'red', message: `${file.name}: ${t(`errors.${errorCode(e)}`)}` })
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (snippets.length === 0) return
    const at = pos ?? view.state.selection.main.head
    const text = snippets.join('\n')
    view.dispatch({ changes: { from: at, insert: text }, selection: { anchor: at + text.length }, scrollIntoView: true })
    view.focus()
  }
  const insertImagesRef = useRef(insertImages)
  insertImagesRef.current = insertImages

  const extensions = useMemo<Extension[]>(
    () => [
      markdown({ base: markdownLanguage }),
      EditorView.lineWrapping,
      baseTheme,
      syntaxHighlighting(scheme === 'dark' ? highlightDark : highlightLight),
      ...(placeholder ? [placeholderExt(placeholder)] : []),
      Prec.high(
        keymap.of([
          { key: 'Mod-b', run: (v) => (wrap(v, '**', '**', t('editor.boldText')), true) },
          { key: 'Mod-i', run: (v) => (wrap(v, '*', '*', t('editor.italicText')), true) },
          { key: 'Mod-k', run: (v) => (link(v, t('editor.linkText')), true) },
          { key: 'Mod-e', run: (v) => (wrap(v, '`', '`', 'code'), true) },
          { key: 'Mod-m', run: (v) => (wrap(v, '$', '$', 'x'), true) },
        ]),
      ),
      EditorView.domEventHandlers({
        paste: (event, view) => {
          const files = Array.from(event.clipboardData?.files ?? [])
          if (!files.some((f) => f.type.startsWith('image/'))) return false
          event.preventDefault()
          void insertImagesRef.current(files, view.state.selection.main.head)
          return true
        },
        drop: (event, view) => {
          const files = Array.from(event.dataTransfer?.files ?? [])
          if (files.length === 0) return false
          event.preventDefault()
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? undefined
          void insertImagesRef.current(files, pos)
          return true
        },
      }),
    ],
    [scheme, placeholder, t],
  )

  const sample = [
    `**${t('editor.sampleInput')}**`,
    '```',
    '3 5',
    '```',
    '',
    `**${t('editor.sampleOutput')}**`,
    '```',
    '8',
    '```',
  ].join('\n')
  const statementTemplate = [
    `### ${t('editor.tplStatement')}`,
    t('editor.tplStatementText'),
    '',
    `### ${t('editor.tplInput')}`,
    t('editor.tplInputText'),
    '',
    `### ${t('editor.tplOutput')}`,
    t('editor.tplOutputText'),
    '',
    `### ${t('editor.tplConstraints')}`,
    '- $1 \\le n \\le 10^5$',
    '',
    `### ${t('editor.tplSamples')}`,
    sample,
    '',
    `### ${t('editor.tplExplanation')}`,
    t('editor.tplExplanationText'),
  ].join('\n')
  const table = [
    `| ${t('editor.tableSubtask')} | ${t('editor.tablePoints')} | ${t('editor.tableConstraints')} |`,
    '|:---:|:---:|---|',
    '| 1 | 30 | $n \\le 100$ |',
    `| 2 | 70 | ${t('editor.tableNoExtra')} |`,
  ].join('\n')

  const sep = <Divider orientation="vertical" mx={4} />
  const toolbar = (
    <Group gap={2} wrap="nowrap" className={classes.tools}>
      <ToolButton label={t('editor.bold')} shortcut="Ctrl+B" icon={IconBold} onClick={run((v) => wrap(v, '**', '**', t('editor.boldText')))} />
      <ToolButton label={t('editor.italic')} shortcut="Ctrl+I" icon={IconItalic} onClick={run((v) => wrap(v, '*', '*', t('editor.italicText')))} />
      <ToolButton label={t('editor.strike')} icon={IconStrikethrough} onClick={run((v) => wrap(v, '~~', '~~', t('editor.strikeText')))} />
      <Menu position="bottom-start" withArrow>
        <Menu.Target>
          <Tooltip label={t('editor.heading')} withArrow openDelay={300}>
            <ActionIcon variant="subtle" color="gray" size="md" aria-label={t('editor.heading')}>
              <IconHeading size={18} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          {[2, 3, 4].map((level) => (
            <Menu.Item key={level} onClick={run((v) => prefixLines(v, `${'#'.repeat(level)} `, HEADING_PREFIX))}>
              <Text fw={700} size={level === 2 ? 'lg' : level === 3 ? 'md' : 'sm'}>
                {t('editor.headingLevel', { level })}
              </Text>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
      {sep}
      <ToolButton label={t('editor.superscript')} icon={IconSuperscript} onClick={run((v) => wrap(v, '<sup>', '</sup>', '2'))} />
      <ToolButton label={t('editor.subscript')} icon={IconSubscript} onClick={run((v) => wrap(v, '<sub>', '</sub>', 'i'))} />
      <ToolButton label={t('editor.inlineMath')} shortcut="Ctrl+M" icon={IconMath} onClick={run((v) => wrap(v, '$', '$', 'x^2'))} />
      <ToolButton label={t('editor.blockMath')} icon={IconMathFunction} onClick={run((v) => insertBlock(v, '$$\n\\sum_{i=1}^{n} a_i\n$$', '\\sum_{i=1}^{n} a_i'))} />
      {sep}
      <ToolButton label={t('editor.inlineCode')} shortcut="Ctrl+E" icon={IconCode} onClick={run((v) => wrap(v, '`', '`', 'code'))} />
      <ToolButton label={t('editor.codeBlock')} icon={IconSourceCode} onClick={run((v) => insertBlock(v, '```\n\n```', ''))} />
      <ToolButton label={t('editor.quote')} icon={IconQuote} onClick={run((v) => prefixLines(v, '> ', QUOTE_PREFIX))} />
      <ToolButton label={t('editor.bulletList')} icon={IconList} onClick={run((v) => prefixLines(v, '- ', BULLET_PREFIX))} />
      <ToolButton label={t('editor.numberedList')} icon={IconListNumbers} onClick={run((v) => prefixLines(v, (i) => `${i + 1}. `, BULLET_PREFIX))} />
      <ToolButton label={t('editor.hr')} icon={IconSeparatorHorizontal} onClick={run((v) => insertBlock(v, '---'))} />
      {sep}
      <ToolButton label={t('editor.link')} shortcut="Ctrl+K" icon={IconLink} onClick={run((v) => link(v, t('editor.linkText')))} />
      {uploadImage && (
        <FileButton onChange={(files) => void insertImages(files)} accept="image/png,image/jpeg,image/gif,image/webp" multiple>
          {(props) => (
            <Tooltip label={t('editor.image')} withArrow openDelay={300}>
              <ActionIcon {...props} variant="subtle" color="gray" size="md" aria-label={t('editor.image')}>
                {uploading > 0 ? <Loader size={14} /> : <IconPhoto size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
        </FileButton>
      )}
      <ToolButton label={t('editor.table')} icon={IconTable} onClick={run((v) => insertBlock(v, table))} />
      <ToolButton label={t('editor.sample')} icon={IconListCheck} onClick={run((v) => insertBlock(v, sample))} />
      <ToolButton label={t('editor.template')} icon={IconTemplate} onClick={run((v) => insertBlock(v, statementTemplate))} />
    </Group>
  )

  return (
    <div className={classes.wrapper}>
      {(label || description) && (
        <div className={classes.header}>
          {label && (
            <Text size="sm" fw={500}>
              {label}
            </Text>
          )}
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </div>
      )}
      <div className={fullscreen ? classes.fullscreen : classes.frame}>
        <div className={classes.toolbar}>
          {effectiveMode !== 'preview' ? toolbar : <div className={classes.tools} />}
          <Group gap={4} wrap="nowrap" className={classes.right}>
            <SegmentedControl
              size="xs"
              value={effectiveMode}
              onChange={(v) => setMode(v as Mode)}
              data={[
                { value: 'edit', label: t('editor.modeEdit') },
                ...(wide || fullscreen ? [{ value: 'split', label: t('editor.modeSplit') }] : []),
                { value: 'preview', label: t('editor.modePreview') },
              ]}
            />
            <ToolButton
              label={fullscreen ? t('editor.exitFullscreen') : t('editor.fullscreen')}
              shortcut={fullscreen ? 'Esc' : undefined}
              icon={fullscreen ? IconMinimize : IconMaximize}
              onClick={() => setFullscreen((f) => !f)}
            />
            <ToolButton label={t('editor.help')} icon={IconHelp} onClick={help.open} />
          </Group>
        </div>
        <div className={classes.body} data-mode={effectiveMode} style={fullscreen ? undefined : { height }}>
          {effectiveMode !== 'preview' && (
            <div className={classes.source}>
              <CodeMirror
                value={value}
                onChange={onChange}
                extensions={extensions}
                theme={scheme === 'dark' ? 'dark' : 'light'}
                height="100%"
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  highlightActiveLineGutter: false,
                  autocompletion: false,
                  searchKeymap: true,
                }}
                onCreateEditor={(view) => {
                  viewRef.current = view
                }}
                className={classes.codemirror}
              />
            </div>
          )}
          {effectiveMode !== 'edit' && (
            <div className={classes.preview}>
              {preview.trim() ? (
                <Markdown source={preview} />
              ) : (
                <Text c="dimmed" size="sm">
                  {t('editor.emptyPreview')}
                </Text>
              )}
            </div>
          )}
        </div>
        <div className={classes.status}>
          <Text size="xs" c="dimmed" truncate>
            {uploading > 0 ? t('editor.uploading') : t('editor.statusHint')}
          </Text>
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {t('editor.chars', { count: value.length })}
          </Text>
        </div>
      </div>
      <MarkdownHelp opened={helpOpened} onClose={help.close} />
    </div>
  )
}
