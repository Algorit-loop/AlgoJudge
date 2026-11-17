import { Code, Modal, ScrollArea, Table, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { Markdown } from '../Markdown'

// [syntax, i18n key for the description]; the rendered column shows what the syntax produces.
const ROWS: [string, string][] = [
  ['**đậm**  *nghiêng*  ~~gạch~~', 'help.emphasis'],
  ['### Tiêu đề', 'help.heading'],
  ['$a_i \\le 10^9$', 'help.inlineMath'],
  ['~a_i \\le 10^9~', 'help.inlineMathTilde'],
  ['$$\\sum_{i=1}^{n} a_i$$', 'help.blockMath'],
  ['x<sup>2</sup>, a<sub>i</sub>', 'help.supSub'],
  ['`int n;`', 'help.inlineCode'],
  ['```\n3 5\n```', 'help.codeBlock'],
  ['- mục\n1. mục', 'help.lists'],
  ['> trích dẫn', 'help.quote'],
  ['[liên kết](https://vnoi.info)', 'help.link'],
  ['| A | B |\n|---|---|\n| 1 | 2 |', 'help.table'],
  ['<details><summary>Gợi ý</summary>Dùng QHĐ</details>', 'help.details'],
]

export function MarkdownHelp({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal opened={opened} onClose={onClose} title={t('help.title')} size="xl" scrollAreaComponent={ScrollArea.Autosize}>
      <Text size="sm" c="dimmed" mb="sm">
        {t('help.intro')}
      </Text>
      <Table verticalSpacing="xs" withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w="38%">{t('help.colSyntax')}</Table.Th>
            <Table.Th>{t('help.colResult')}</Table.Th>
            <Table.Th w="26%">{t('help.colNote')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {ROWS.map(([syntax, note]) => (
            <Table.Tr key={syntax}>
              <Table.Td>
                <Code block>{syntax}</Code>
              </Table.Td>
              <Table.Td>
                <Markdown source={syntax} />
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {t(note)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text size="xs" c="dimmed" mt="sm">
        {t('help.shortcuts')}
      </Text>
    </Modal>
  )
}
