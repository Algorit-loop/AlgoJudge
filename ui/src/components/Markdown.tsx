import 'katex/dist/katex.min.css'

import { ActionIcon, CopyButton, Tooltip } from '@mantine/core'
import type { ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { IconCheck, IconCopy } from '../icons'
import classes from './Markdown.module.css'

function textOf(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: unknown } }).props.children)
  }
  return ''
}

/** Code blocks get a copy button, so sample input/output can be copied in one click. */
function Pre({ children, ...rest }: ComponentPropsWithoutRef<'pre'>) {
  const { t } = useTranslation()
  const text = textOf(children).replace(/\n$/, '')
  return (
    <div className={classes.codeBlock}>
      <pre {...rest}>{children}</pre>
      <CopyButton value={text} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? t('markdown.copied') : t('markdown.copy')} withArrow position="left">
            <ActionIcon
              className={classes.copy}
              variant="default"
              size="sm"
              onClick={copy}
              aria-label={t('markdown.copy')}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </div>
  )
}

function Link({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  const external = !!href && /^https?:\/\//.test(href)
  return (
    <a href={href} {...rest} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

const components: Components = { pre: Pre, a: Link }

const FENCE = /^\s*(```|~~~)/

/** Apply `fn` to the parts of each line that are outside ``` fences and `inline code`. */
function mapOutsideCode(source: string, fn: (text: string) => string): string {
  let inFence = false
  return source
    .split('\n')
    .map((line) => {
      if (FENCE.test(line)) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      // Odd-indexed parts are `inline code` spans.
      return line
        .split(/(`+[^`]*`+)/)
        .map((part, i) => (i % 2 === 1 ? part : fn(part)))
        .join('')
    })
    .join('\n')
}

/**
 * Normalise the math syntaxes setters actually use into what remark-math understands:
 * - `~x~` inline math (the DMOJ/VNOJ convention) becomes `$x$`; `~~strike~~` is left alone;
 * - a line that is only `$$ formula $$` becomes a fenced display block (remark-math needs $$ on their own lines).
 */
export function normalizeMath(source: string): string {
  const tildes = mapOutsideCode(source, (text) =>
    text.replace(/(?<!~)~(?!~)([^~\n]+?)(?<!~)~(?!~)/g, (_m, math: string) => `$${math}$`),
  )
  let inFence = false
  return tildes
    .split('\n')
    .map((line) => {
      if (FENCE.test(line)) inFence = !inFence
      if (inFence) return line
      const m = /^(\s*)\$\$(.+?)\$\$\s*$/.exec(line)
      return m ? `${m[1]}$$\n${m[1]}${m[2].trim()}\n${m[1]}$$` : line
    })
    .join('\n')
}

// HTML allowed inside statements: GitHub's safe subset (sup, sub, details, kbd, tables, img...) without scripts,
// event handlers or javascript: URLs. Math nodes keep the classes rehype-katex needs.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./, 'math-inline', 'math-display']],
  },
}

/**
 * Renders problem statements: GitHub-flavoured Markdown, LaTeX ($...$, ~...~, $$...$$) and a safe HTML subset.
 * Plugin order matters: math is parsed first, raw HTML is parsed then sanitised, and KaTeX runs last so its own
 * output is not stripped by the sanitiser.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className={classes.markdown}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
        components={components}
      >
        {normalizeMath(source)}
      </ReactMarkdown>
    </div>
  )
}
