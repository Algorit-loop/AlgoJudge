import 'katex/dist/katex.min.css'

import { ActionIcon, CopyButton, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import type { ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

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

/**
 * remark-math only treats $$...$$ as display math when the $$ fences sit on their own lines.
 * Problem setters usually write `$$ formula $$` on a single line and expect a centred block,
 * so rewrite such lines into the fenced form. Lines inside ``` code blocks are left alone.
 */
export function normalizeDisplayMath(source: string): string {
  let inFence = false
  return source
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
      if (inFence) return line
      const m = /^(\s*)\$\$(.+?)\$\$\s*$/.exec(line)
      return m ? `${m[1]}$$\n${m[1]}${m[2].trim()}\n${m[1]}$$` : line
    })
    .join('\n')
}

/**
 * Renders problem statements: GitHub-flavoured Markdown + LaTeX ($...$ and $$...$$).
 * Raw HTML in the source is NOT rendered (react-markdown escapes it), so statements cannot inject scripts.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className={classes.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {normalizeDisplayMath(source)}
      </ReactMarkdown>
    </div>
  )
}
