/* Elemente comune pentru toate documentele legale EQUIL.
   Textul dintre [[...]] devine un camp evidentiat, de completat. */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, Footer, PageNumber, convertMillimetersToTwip,
} = require('docx');

const FONT = 'Calibri';
const INK = '111614';
const GREEN = '0B7A58';
const GREY = '595F5C';
const LINE = 'C9CFCB';
const SAND = 'F2EDE4';
const TOTAL_W = 9360; // latime utila pentru A4 cu margini de 2 cm

/* --- text cu campuri de completat --------------------------------- */
function runs(text, opts = {}) {
  const base = { font: FONT, size: opts.size || 21, color: opts.color || INK, bold: opts.bold, italics: opts.italics };
  const out = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    // fundal pe run, nu "highlight": docx-js emite un element highlightCs invalid
    out.push(new TextRun({
      ...base, text: '[' + m[1] + ']', bold: true, color: '9A3412',
      shading: { type: ShadingType.CLEAR, fill: 'FFE9A8' },
    }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(new TextRun({ ...base, text: text.slice(last) }));
  if (!out.length) out.push(new TextRun({ ...base, text: '' }));
  return out;
}

/* --- blocuri ------------------------------------------------------- */
const Title = (t) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: t, font: FONT, size: 34, bold: true, color: INK })],
});

const Sub = (t) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 320 },
  children: runs(t, { size: 20, color: GREY, italics: true }),
});

const H1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 },
  children: [new TextRun({ text: t, font: FONT, size: 26, bold: true, color: GREEN })],
});

const H2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 },
  children: [new TextRun({ text: t, font: FONT, size: 22, bold: true, color: INK })],
});

const P = (t, o = {}) => new Paragraph({
  spacing: { after: o.after === undefined ? 130 : o.after, line: 276 },
  alignment: o.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
  indent: o.indent ? { left: 340 } : undefined,
  children: runs(t, o),
});

const Bullet = (t) => new Paragraph({
  numbering: { reference: 'puncte', level: 0 },
  spacing: { after: 70, line: 276 },
  alignment: AlignmentType.JUSTIFIED,
  children: runs(t),
});

const Spacer = (h = 120) => new Paragraph({ spacing: { after: h }, children: [new TextRun('')] });

/* Caseta de avertizare din capul fiecarui document.
   Construita ca tabel cu o celula: docx-js serializeaza bordurile de paragraf
   in ordinea top/bottom/left/right, pe care schema OOXML o respinge. */
const Nota = (t) => new Table({
  columnWidths: [TOTAL_W],
  width: { size: TOTAL_W, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: 'E0A800' },
    left: { style: BorderStyle.SINGLE, size: 18, color: 'E0A800' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0A800' },
    right: { style: BorderStyle.SINGLE, size: 6, color: 'E0A800' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  },
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: TOTAL_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'FFF8E1' },
      margins: { top: 130, bottom: 130, left: 170, right: 170 },
      children: [new Paragraph({
        spacing: { after: 0, line: 264 },
        alignment: AlignmentType.JUSTIFIED,
        children: runs(t, { size: 19 }),
      })],
    })],
  })],
});

/* linie despartitoare */
const Rule = () => new Paragraph({
  spacing: { before: 140, after: 140 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } },
  children: [new TextRun('')],
});

/* --- tabele -------------------------------------------------------- */
const TOTAL = TOTAL_W;

function tabel(headers, rows, weights) {
  const w = weights || headers.map(() => 1);
  const sum = w.reduce((a, b) => a + b, 0);
  const widths = w.map((x) => Math.round((x / sum) * TOTAL));
  widths[widths.length - 1] = TOTAL - widths.slice(0, -1).reduce((a, b) => a + b, 0);

  const cell = (text, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: SAND } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: String(text).split('\n').map((line) => new Paragraph({
      spacing: { after: 0, line: 252 },
      children: runs(line, { size: 18, bold: head }),
    })),
  });

  return new Table({
    columnWidths: widths,
    width: { size: TOTAL, type: WidthType.DXA },
    borders: {
      // ordinea impusa de schema CT_TblBorders: top, left, bottom, right, insideH, insideV
      top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}

/* --- blocul de semnaturi ------------------------------------------- */
function semnaturi(stangaTitlu, dreaptaTitlu) {
  const half = Math.round(TOTAL / 2);
  const box = (titlu) => new TableCell({
    width: { size: half, type: WidthType.DXA },
    margins: { top: 140, bottom: 300, left: 120, right: 120 },
    children: [
      new Paragraph({ spacing: { after: 420 }, children: runs(titlu, { bold: true, size: 20 }) }),
      new Paragraph({ spacing: { after: 60 }, children: runs('Nume: [[NUME ȘI PRENUME]]', { size: 19 }) }),
      new Paragraph({ spacing: { after: 60 }, children: runs('Funcția: [[FUNCȚIA]]', { size: 19 }) }),
      new Paragraph({ spacing: { after: 60 }, children: runs('Data: [[ZZ.LL.AAAA]]', { size: 19 }) }),
      new Paragraph({ spacing: { after: 0 }, children: runs('Semnătura: ______________________', { size: 19 }) }),
    ],
  });
  return new Table({
    columnWidths: [half, TOTAL - half],
    width: { size: TOTAL, type: WidthType.DXA },
    borders: {
      // ordinea impusa de schema CT_TblBorders: top, left, bottom, right, insideH, insideV
      top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    },
    rows: [new TableRow({ children: [box(stangaTitlu), box(dreaptaTitlu)] })],
  });
}

/* --- documentul ---------------------------------------------------- */
function construieste(children, opts = {}) {
  return new Document({
    creator: 'EQUIL',
    title: opts.titlu || 'Document EQUIL',
    description: 'Șablon — necesită validare juridica înainte de utilizare',
    numbering: {
      config: [{
        reference: 'puncte',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 240 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertMillimetersToTwip(20), bottom: convertMillimetersToTwip(20),
            left: convertMillimetersToTwip(22), right: convertMillimetersToTwip(22),
          },
          size: opts.landscape ? { orientation: require('docx').PageOrientation.LANDSCAPE } : undefined,
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
            spacing: { before: 100 },
            children: [
              new TextRun({ text: (opts.titlu || '') + '  ·  EQUIL  ·  pagina ', font: FONT, size: 16, color: GREY }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GREY }),
              new TextRun({ text: ' din ', font: FONT, size: 16, color: GREY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GREY }),
            ],
          })],
        }),
      },
      children,
    }],
  });
}

async function scrie(nume, doc) {
  const fs = require('fs');
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(nume, buf);
  console.log('  scris:', nume, '(' + Math.round(buf.length / 1024) + ' KB)');
}

const AVERTISMENT = 'ȘABLON. Acest document este un model de lucru, nu un act juridic finalizat. Înainte de semnare sau publicare trebuie completat cu datele reale ale societății și validat de un avocat sau consilier juridic. Câmpurile evidentiate necesită completare.';

module.exports = { runs, Title, Sub, H1, H2, P, Bullet, Spacer, Nota, Rule, tabel, semnaturi, construieste, scrie, AVERTISMENT, TOTAL };
