/* ═══════════════════════════════════════════════════
   IMPORTAR PREGUNTAS  (texto pegado desde Excel, CSV o TSV)

   Acepta estos formatos (con o sin fila de encabezados):

   A) Una pregunta por fila, respuesta y puntos alternados:
      Pregunta | Resp 1 | Pts 1 | Resp 2 | Pts 2 | …

   B) Una pregunta por fila, primero todas las respuestas y luego todos los puntos:
      Pregunta | Resp 1 | Resp 2 | … | Pts 1 | Pts 2 | …

   C) Una respuesta por fila (la pregunta puede repetirse o quedar vacía debajo):
      Pregunta | Respuesta | Puntos

   D) La pregunta sola en una fila y debajo sus respuestas:
      Pregunta
      Respuesta | Puntos
═══════════════════════════════════════════════════ */

export const MAX_ANSWERS = 5; // el tablero del show tiene 5 barras

/* ── Lector de texto separado por tabuladores / ; / , (soporta comillas) ── */
function readRows(raw) {
  const text = String(raw).replace(/^\uFEFF/, "");
  const firstLines = text.split(/\r?\n/).slice(0, 20).join("\n");
  const count = ch => (firstLines.match(new RegExp(`\\${ch}`, "g")) || []).length;
  const delim = count("\t") > 0 ? "\t" : count(";") >= count(",") && count(";") > 0 ? ";" : ",";

  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = ""; rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }

  return rows
    .map(r => r.map(c => c.replace(/\s+/g, " ").trim()))
    .map(r => { while (r.length && r[r.length - 1] === "") r.pop(); return r; })
    .filter(r => r.length > 0);
}

const toNum = s => {
  if (s === undefined || s === null || s === "") return null;
  const t = String(s).replace("%", "").replace(",", ".").trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? Math.round(parseFloat(t)) : null;
};
const isNum = s => toNum(s) !== null;
const isHeader = r => !r.some(isNum) && /pregunta|respuesta|punt|pts/i.test(r.join(" "));

/* ── Una fila = una pregunta (formatos A y B) ── */
function parseWideRow(r) {
  const q = r[0];
  const rest = r.slice(1);
  const answers = [];

  // A: alternados texto / número
  const alternated = rest.length >= 2 && !isNum(rest[0]) && isNum(rest[1]) &&
    rest.every((c, i) => (i % 2 === 0 ? !isNum(c) || c === "" : isNum(c) || c === ""));
  if (alternated) {
    for (let i = 0; i < rest.length; i += 2) {
      if (rest[i] === "" && !rest[i + 1]) continue;
      answers.push({ text: rest[i], pts: toNum(rest[i + 1]) });
    }
  } else {
    // B: todos los textos primero y luego todos los números
    const half = Math.floor(rest.length / 2);
    const texts = rest.slice(0, half), nums = rest.slice(half);
    texts.forEach((t, i) => { if (t !== "") answers.push({ text: t, pts: toNum(nums[i]) }); });
  }
  return { question: q, answers };
}

/**
 * @returns {{questions: {question:string, answers:{text:string, pts:number}[]}[], warnings:string[]}}
 */
export function parseQuestions(raw) {
  const warnings = [];
  let rows = readRows(raw).filter(r => !isHeader(r));
  // Si todas las filas empiezan con un número (columna "N°" / índice), se quita esa columna
  if (rows.length && rows.every(r => isNum(r[0]) && r.length >= 4)) rows = rows.map(r => r.slice(1));
  const questions = [];

  const isWide = r => r.length >= 5 && !isNum(r[0]) && r.slice(1).filter(isNum).length >= 2;

  if (rows.some(isWide)) {
    rows.forEach((r, n) => {
      if (isWide(r)) questions.push(parseWideRow(r));
      else warnings.push(`Fila ${n + 1} ignorada: no se entendió el formato ("${r.join(" | ").slice(0, 50)}").`);
    });
  } else {
    // Formatos C y D: respuestas en filas separadas
    let cur = null;
    const startQ = text => { cur = { question: text, answers: [] }; questions.push(cur); };
    rows.forEach((r, n) => {
      if (r.length === 1 && !isNum(r[0])) { startQ(r[0]); return; }                   // D: título solo
      if (r.length >= 3 && isNum(r[r.length - 1])) {                                  // C: pregunta | resp | pts
        const [q, a] = [r[0], r[r.length - 2]];
        if (q && (!cur || cur.question !== q)) startQ(q);
        if (!cur) { warnings.push(`Fila ${n + 1} ignorada: respuesta sin pregunta.`); return; }
        cur.answers.push({ text: a, pts: toNum(r[r.length - 1]) });
        return;
      }
      if (r.length === 2 && isNum(r[1])) {                                            // D: resp | pts
        if (!cur) { warnings.push(`Fila ${n + 1} ignorada: respuesta sin pregunta.`); return; }
        cur.answers.push({ text: r[0], pts: toNum(r[1]) });
        return;
      }
      warnings.push(`Fila ${n + 1} ignorada: no se entendió el formato ("${r.join(" | ").slice(0, 50)}").`);
    });
  }

  // Validar y limpiar
  const clean = [];
  questions.forEach((q, i) => {
    const label = `Pregunta ${i + 1}`;
    const answers = q.answers.filter(a => {
      if (!a.text) { warnings.push(`${label}: una respuesta sin texto se omitió.`); return false; }
      if (a.pts === null || a.pts < 0) { warnings.push(`${label}: "${a.text}" no tiene puntos válidos y se omitió.`); return false; }
      return true;
    });
    if (!q.question) { warnings.push(`${label}: no tiene texto y se omitió.`); return; }
    if (!answers.length) { warnings.push(`${label} ("${q.question.slice(0, 40)}"): no tiene respuestas y se omitió.`); return; }
    if (answers.length > MAX_ANSWERS) {
      warnings.push(`${label}: tiene ${answers.length} respuestas; el tablero solo muestra ${MAX_ANSWERS}, se quedaron las primeras ${MAX_ANSWERS}.`);
    }
    clean.push({ question: q.question, answers: answers.slice(0, MAX_ANSWERS) });
  });

  return { questions: clean, warnings };
}

/* ── Leer un archivo CSV/TSV/TXT (UTF-8, o Windows-1252 si Excel lo guardó "normal") ── */
export async function readTextFile(file) {
  const buf = await file.arrayBuffer();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); }
  catch { return new TextDecoder("windows-1252").decode(buf); }
}
