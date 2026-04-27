// Markdown -> DOCX converter for Cloud Farm docs (CN)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageOrientation, PageNumber, Header, Footer,
  TabStopType, TabStopPosition, TableOfContents, ImageRun
} = require('docx');

// ---------- PNG size reader ----------
function pngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature + IHDR chunk: width at byte 16, height at byte 20 (BE uint32)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), buf };
}

// Max display width in Word (A4 minus 1" margins ~ 620px at 96dpi)
const MAX_IMAGE_WIDTH_PX = 620;

const CN_FONT = 'Microsoft YaHei';
const MONO_FONT = 'Consolas';

// ---------- Inline parser (bold + inline code) ----------
function parseInline(text, baseRun = {}) {
  const runs = [];
  // Split by backticks first (code), then bold
  const codeRegex = /`([^`]+)`/g;
  const boldRegex = /\*\*([^*]+)\*\*/g;

  // Simple sequential tokenization
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        tokens.push({ type: 'code', value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > i) {
        tokens.push({ type: 'bold', value: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    // find next special
    let next = text.length;
    const nc = text.indexOf('`', i);
    const nb = text.indexOf('**', i);
    if (nc !== -1) next = Math.min(next, nc);
    if (nb !== -1) next = Math.min(next, nb);
    tokens.push({ type: 'text', value: text.slice(i, next) });
    i = next;
  }

  for (const tk of tokens) {
    if (tk.value === '') continue;
    if (tk.type === 'code') {
      runs.push(new TextRun({ text: tk.value, font: MONO_FONT, size: 20, ...baseRun }));
    } else if (tk.type === 'bold') {
      runs.push(new TextRun({ text: tk.value, bold: true, font: CN_FONT, size: 22, ...baseRun }));
    } else {
      runs.push(new TextRun({ text: tk.value, font: CN_FONT, size: 22, ...baseRun }));
    }
  }
  return runs;
}

// ---------- Table parser ----------
function parseTable(lines) {
  // lines: [headerLine, separatorLine, ...rowLines]
  const splitRow = (l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
  const header = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow);
  return { header, rows };
}

function renderTable(tbl) {
  const nCols = tbl.header.length;
  const totalWidth = 9360;
  const colWidth = Math.floor(totalWidth / nCols);
  const columnWidths = new Array(nCols).fill(colWidth);
  // Adjust last column to make sum equal totalWidth
  columnWidths[nCols - 1] = totalWidth - colWidth * (nCols - 1);

  const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

  const makeCell = (text, isHeader, idx) => new TableCell({
    borders,
    width: { size: columnWidths[idx], type: WidthType.DXA },
    shading: isHeader ? { fill: 'E8F4EA', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: parseInline(text || '', { bold: isHeader }) })],
  });

  const rows = [];
  rows.push(new TableRow({
    tableHeader: true,
    children: tbl.header.map((h, i) => makeCell(h, true, i)),
  }));
  for (const r of tbl.rows) {
    rows.push(new TableRow({
      children: r.map((c, i) => makeCell(c, false, i)).concat(
        // pad short rows
        new Array(Math.max(0, nCols - r.length)).fill(0).map((_, j) => makeCell('', false, r.length + j))
      ).slice(0, nCols),
    }));
  }

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows,
  });
}

// ---------- Main MD parser ----------
function mdToDocxChildren(md) {
  const lines = md.split(/\r?\n/);
  const children = [];
  let i = 0;

  const pushEmpty = () => children.push(new Paragraph({ children: [new TextRun({ text: '', font: CN_FONT, size: 22 })] }));

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Image: ![alt](path) on its own line
    const imgMatch = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const alt = imgMatch[1] || 'image';
      let imgPath = imgMatch[2];
      // resolve relative to docBaseDir if set
      if (!path.isAbsolute(imgPath) && global.__docBaseDir) {
        imgPath = path.resolve(global.__docBaseDir, imgPath);
      }
      try {
        const { width, height, buf } = pngSize(imgPath);
        let dispW = Math.min(width, MAX_IMAGE_WIDTH_PX);
        let dispH = Math.round(height * (dispW / width));
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new ImageRun({
            type: 'png',
            data: buf,
            transformation: { width: dispW, height: dispH },
            altText: { title: alt, description: alt, name: alt },
          })],
        }));
        if (alt) {
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 180 },
            children: [new TextRun({ text: alt, italics: true, color: '666666', font: CN_FONT, size: 20 })],
          }));
        }
      } catch (e) {
        children.push(new Paragraph({ children: [new TextRun({ text: `[缺图: ${imgPath}]`, color: 'CC0000', font: CN_FONT, size: 22 })] }));
      }
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4CA777', space: 1 } },
        children: [new TextRun({ text: '', font: CN_FONT })],
      }));
      i++;
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      for (const bl of buf) {
        children.push(new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: 'F5F5F5', color: 'auto' },
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: bl || ' ', font: MONO_FONT, size: 20 })],
        }));
      }
      pushEmpty();
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const textContent = hMatch[2].trim();
      const sizeByLevel = { 1: 40, 2: 32, 3: 28, 4: 24, 5: 22, 6: 22 };
      const colorByLevel = { 1: '2E7D32', 2: '388E3C', 3: '4CA777', 4: '2E7D32', 5: '000000', 6: '000000' };
      const headingLevelMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      children.push(new Paragraph({
        heading: headingLevelMap[level],
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: textContent,
          bold: true,
          font: CN_FONT,
          size: sizeByLevel[level],
          color: colorByLevel[level],
        })],
      }));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      children.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: 'F0F7F2', color: 'auto' },
        indent: { left: 240 },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: '4CA777', space: 8 } },
        children: parseInline(buf.join(' '), { italics: true, color: '555555' }),
      }));
      continue;
    }

    // Table (starts with | and next line is separator)
    if (line.startsWith('|') && i + 1 < lines.length && /^\|\s*:?-+/.test(lines[i + 1])) {
      const tblLines = [line];
      i++;
      tblLines.push(lines[i]);
      i++;
      while (i < lines.length && lines[i].startsWith('|')) {
        tblLines.push(lines[i]);
        i++;
      }
      const tbl = parseTable(tblLines);
      children.push(renderTable(tbl));
      pushEmpty();
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)[-*]\s+(.*)$/);
        const indent = Math.floor(m[1].length / 2);
        buf.push({ indent, text: m[2] });
        i++;
      }
      for (const b of buf) {
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: Math.min(b.indent, 2) },
          children: parseInline(b.text),
        }));
      }
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)$/);
        const indent = Math.floor(m[1].length / 2);
        buf.push({ indent, text: m[2] });
        i++;
      }
      for (const b of buf) {
        children.push(new Paragraph({
          numbering: { reference: 'numbers', level: Math.min(b.indent, 2) },
          children: parseInline(b.text),
        }));
      }
      continue;
    }

    // Regular paragraph — concatenate consecutive non-special lines
    const pbuf = [line];
    i++;
    while (i < lines.length
      && lines[i].trim() !== ''
      && !lines[i].startsWith('#')
      && !lines[i].startsWith('```')
      && !lines[i].startsWith('|')
      && !lines[i].startsWith('>')
      && !/^-{3,}$/.test(lines[i].trim())
      && !/^\s*[-*]\s+/.test(lines[i])
      && !/^\s*\d+\.\s+/.test(lines[i])) {
      pbuf.push(lines[i]);
      i++;
    }
    children.push(new Paragraph({
      spacing: { before: 80, after: 80, line: 360 },
      children: parseInline(pbuf.join(' ')),
    }));
  }

  return children;
}

function buildDoc(title, children) {
  return new Document({
    creator: '云上田园项目组',
    title,
    styles: {
      default: {
        document: { run: { font: CN_FONT, size: 22 } },
      },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 40, bold: true, font: CN_FONT, color: '2E7D32' },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: CN_FONT, color: '388E3C' },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: CN_FONT, color: '4CA777' },
          paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 2 } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: CN_FONT, color: '2E7D32' },
          paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 3 } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets', levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
          { level: 2, format: LevelFormat.BULLET, text: '\u25AA', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
        ] },
        { reference: 'numbers', levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.DECIMAL, text: '%2.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
          { level: 2, format: LevelFormat.DECIMAL, text: '%3.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
        ] },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: title, font: CN_FONT, size: 18, color: '888888' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '第 ', font: CN_FONT, size: 18, color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], font: CN_FONT, size: 18, color: '888888' }),
              new TextRun({ text: ' 页 / 共 ', font: CN_FONT, size: 18, color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: CN_FONT, size: 18, color: '888888' }),
              new TextRun({ text: ' 页', font: CN_FONT, size: 18, color: '888888' }),
            ],
          })],
        }),
      },
      children,
    }],
  });
}

async function convert(mdPath, docxPath, title) {
  global.__docBaseDir = path.dirname(mdPath);
  const md = fs.readFileSync(mdPath, 'utf-8');
  const children = mdToDocxChildren(md);
  const doc = buildDoc(title, children);
  const buffer = await Packer.toBuffer(doc);
  try {
    fs.writeFileSync(docxPath, buffer);
    console.log('[OK] ' + docxPath + ' (' + buffer.length + ' bytes)');
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      const alt = docxPath.replace(/\.docx$/, '.new.docx');
      fs.writeFileSync(alt, buffer);
      console.log('[WARN] target in use — wrote ' + alt + ' instead (' + buffer.length + ' bytes)');
    } else throw e;
  }
}

(async () => {
  const base = 'C:/TestProject/Cloud_Farm_project/';
  const args = process.argv.slice(2);
  const targets = [
    ['01_云上田园_项目书_v2', '云上田园 · 项目商业计划书 v2.0'],
    ['02_云上田园_需求说明书_v1', '云上田园 · 产品需求说明书 v1.0'],
    ['03_云上田园_软件架构图_v1', '云上田园 · 软件架构设计文档 v1.0'],
  ];
  for (const [name, title] of targets) {
    if (args.length && !args.some(a => name.includes(a))) continue;
    await convert(base + name + '.md', base + name + '.docx', title);
  }
})().catch(e => { console.error(e); process.exit(1); });
