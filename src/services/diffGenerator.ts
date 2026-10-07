// Code diff generator utility for side-by-side PySpark vs DLT comparison

export interface DiffLine {
  lineNumLeft?: number;
  lineNumRight?: number;
  textLeft: string;
  textRight: string;
  type: 'same' | 'modified' | 'added' | 'removed';
  syntaxHighlight?: 'dlt-decorator' | 'spark-read' | 'comment' | 'import' | 'function' | 'expectation' | 'normal';
}

/**
 * Normalizes code by stripping empty trailing lines
 */
function cleanLines(code: string): string[] {
  return code.replace(/\r\n/g, '\n').split('\n');
}

/**
 * Computes side-by-side diff between standard PySpark (Notebook / Script) and DLT code
 */
export function computeSideBySideDiff(pysparkCode: string, dltCode: string): DiffLine[] {
  const leftLines = cleanLines(pysparkCode);
  const rightLines = cleanLines(dltCode);
  const diffs: DiffLine[] = [];

  const maxLen = Math.max(leftLines.length, rightLines.length);

  // We perform an aligned line comparison with heuristics for DLT decorators vs standard PySpark dataframes
  let lIdx = 0;
  let rIdx = 0;

  while (lIdx < leftLines.length || rIdx < rightLines.length) {
    const lLine = lIdx < leftLines.length ? leftLines[lIdx] : undefined;
    const rLine = rIdx < rightLines.length ? rightLines[rIdx] : undefined;

    if (lLine === undefined && rLine !== undefined) {
      // Line added in DLT
      diffs.push({
        lineNumRight: rIdx + 1,
        textLeft: '',
        textRight: rLine,
        type: 'added',
        syntaxHighlight: categorizeSyntax(rLine)
      });
      rIdx++;
    } else if (lLine !== undefined && rLine === undefined) {
      // Line removed in DLT
      diffs.push({
        lineNumLeft: lIdx + 1,
        textLeft: lLine,
        textRight: '',
        type: 'removed',
        syntaxHighlight: categorizeSyntax(lLine)
      });
      lIdx++;
    } else if (lLine !== undefined && rLine !== undefined) {
      const lTrim = lLine.trim();
      const rTrim = rLine.trim();

      if (lTrim === rTrim) {
        // Exactly identical line
        diffs.push({
          lineNumLeft: lIdx + 1,
          lineNumRight: rIdx + 1,
          textLeft: lLine,
          textRight: rLine,
          type: 'same',
          syntaxHighlight: categorizeSyntax(lLine)
        });
        lIdx++;
        rIdx++;
      } else {
        // Difference detected
        diffs.push({
          lineNumLeft: lIdx + 1,
          lineNumRight: rIdx + 1,
          textLeft: lLine,
          textRight: rLine,
          type: 'modified',
          syntaxHighlight: categorizeSyntax(rLine || lLine)
        });
        lIdx++;
        rIdx++;
      }
    }
  }

  return diffs;
}

function categorizeSyntax(line: string): DiffLine['syntaxHighlight'] {
  const trimmed = line.trim();
  if (trimmed.startsWith('@dlt.') || trimmed.includes('dlt.table') || trimmed.includes('dlt.view') || trimmed.includes('dlt.apply_changes')) {
    return 'dlt-decorator';
  }
  if (trimmed.includes('@dlt.expect') || trimmed.includes('dlt.expect_or_fail') || trimmed.includes('dlt.expect_or_drop')) {
    return 'expectation';
  }
  if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
    return 'import';
  }
  if (trimmed.startsWith('#')) {
    return 'comment';
  }
  if (trimmed.includes('def ') || trimmed.includes('class ')) {
    return 'function';
  }
  if (trimmed.includes('spark.read') || trimmed.includes('DeltaTable') || trimmed.includes('spark.table')) {
    return 'spark-read';
  }
  return 'normal';
}
