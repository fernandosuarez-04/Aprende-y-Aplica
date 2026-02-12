const fs = require('fs');
const filePath = 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let removedCount = 0;
let cleanedCount = 0;
let keptCount = 0;
const linesToRemove = new Set();

function countParensInLine(text) {
  let count = 0;
  let inString = false;
  let stringChar = '';
  for (let c = 0; c < text.length; c++) {
    const ch = text[c];
    if (inString) {
      if (ch === '\\' && c + 1 < text.length) { c++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === '(') count++;
    if (ch === ')') count--;
  }
  return count;
}

function findEndOfStatement(allLines, startIdx) {
  let parenCount = 0;
  for (let i = startIdx; i < Math.min(startIdx + 20, allLines.length); i++) {
    parenCount += countParensInLine(allLines[i]);
    if (parenCount <= 0 && i >= startIdx) return i;
  }
  return startIdx;
}

function stripEmojis(line) {
  let c = line;
  // Real Unicode emojis
  c = c.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  c = c.replace(/[\u{2600}-\u{27BF}]/gu, '');
  c = c.replace(/[\u{FE00}-\u{FE0F}]/gu, '');
  c = c.replace(/[\u{200D}]/gu, '');
  c = c.replace(/[\u{20E3}]/gu, '');
  c = c.replace(/[\u{1FA00}-\u{1FAFF}]/gu, '');
  c = c.replace(/[\u{2702}-\u{27B0}]/gu, '');
  c = c.replace(/[\u{2300}-\u{23FF}]/gu, '');
  c = c.replace(/[\u{26A0}]/gu, '');
  c = c.replace(/[\u{274C}]/gu, '');
  c = c.replace(/[\u{2705}]/gu, '');
  c = c.replace(/[\u{2714}]/gu, '');
  c = c.replace(/[\u{26D4}]/gu, '');
  c = c.replace(/[\u{2795}]/gu, '');
  c = c.replace(/[\u{2796}]/gu, '');
  c = c.replace(/[\u{270F}]/gu, '');
  c = c.replace(/[\u{2B50}]/gu, '');
  
  // Corrupted/mojibake sequences
  c = c.replace(/⌜\s*/g, '[ERROR] ');
  c = c.replace(/⚠ ️\s*/g, '[WARN] ');
  c = c.replace(/ð/g, '');
  c = c.replace(/ðï¸/g, '');
  c = c.replace(/ð/g, '');
  c = c.replace(/ð¥/g, '');
  c = c.replace(/ð/g, '');
  c = c.replace(/ð/g, '');
  c = c.replace(/ð¢¢/g, '');
  c = c.replace(/ð/g, '');
  c = c.replace(/ð¥/g, '');
  c = c.replace(/â¹ï¸/g, '');
  c = c.replace(/â³ /g, '');
  c = c.replace(/â°°/g, '');
  c = c.replace(/â»/g, '');
  c = c.replace(/ð/g, '');

  // Clean up multiple spaces
  c = c.replace(/  +/g, ' ');

  return c;
}

// Process each line
for (let i = 0; i < lines.length; i++) {
  if (linesToRemove.has(i)) continue;

  const line = lines[i];
  const trimmed = line.trim();

  // 1. Remove commented-out console statements
  if (/^\/\/\s*console\.(log|warn|error|info)\s*\(/.test(trimmed)) {
    const endLine = findEndOfStatement(lines, i);
    for (let j = i; j <= endLine; j++) linesToRemove.add(j);
    removedCount++;
    continue;
  }

  // Check if line contains a console statement
  if (!/console\.(log|warn|error|info)\s*\(/.test(line)) continue;

  const isLog = /console\.log\s*\(/.test(line);
  const isError = /console\.error\s*\(/.test(line);
  const isWarn = /console\.warn\s*\(/.test(line);

  if (isLog) {
    // Remove ALL console.log - debug/tracing
    const endLine = findEndOfStatement(lines, i);
    for (let j = i; j <= endLine; j++) linesToRemove.add(j);
    removedCount++;
  } else if (isError || isWarn) {
    // Keep but strip emojis
    const endLine = findEndOfStatement(lines, i);
    let modified = false;
    for (let j = i; j <= endLine; j++) {
      const original = lines[j];
      lines[j] = stripEmojis(lines[j]);
      if (lines[j] !== original) modified = true;
    }
    if (modified) cleanedCount++;
    keptCount++;
  }
}

// Remove lines in reverse order
const sorted = Array.from(linesToRemove).sort((a, b) => b - a);
for (const idx of sorted) {
  lines.splice(idx, 1);
}

// Clean up excessive blank lines (max 2 consecutive)
const finalLines = [];
let blankCount = 0;
for (const line of lines) {
  if (line.trim() === '') {
    blankCount++;
    if (blankCount <= 2) finalLines.push(line);
  } else {
    blankCount = 0;
    finalLines.push(line);
  }
}

fs.writeFileSync(filePath, finalLines.join('\n'), 'utf-8');

console.log('=== Console Cleanup Results ===');
console.log('console.log removed:', removedCount);
console.log('console.error/warn emoji-cleaned:', cleanedCount);
console.log('console.error/warn total kept:', keptCount);
console.log('Total lines removed:', sorted.length);
console.log('Original line count:', content.split('\n').length);
console.log('New line count:', finalLines.length);