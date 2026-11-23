import { createEmptySheetDocumentState, type SheetDocumentState } from '@searsuite/sear-assembly-setup';
import { createWorkbookDocumentState } from '@searsuite/sear-domain-workbook';

export function createDemoWorkbook() {
  const budget = createEmptySheetDocumentState(120, 26);
  const rows = [
    ['Project budget', 'Owner', 'Planned', 'Actual', 'Remaining'],
    ['Design', 'Maya', 2400, 2180, '=C2-D2'],
    ['Engineering', 'Noah', 5600, 4920, '=C3-D3'],
    ['Testing', 'Ava', 1800, 1450, '=C4-D4'],
    ['Launch', 'Leo', 1200, 960, '=C5-D5'],
    ['Total', '', '=SUM(C2:C5)', '=SUM(D2:D5)', '=C6-D6'],
  ] as const;

  rows.forEach((cells, row) => cells.forEach((value, column) => {
    if (value === '') return;
    budget.sheetData.addItem(row, column, typeof value === 'number'
      ? { type: 'number', value }
      : value.startsWith('=')
        ? { type: 'formula', formula: value }
        : { type: 'string', value });
  }));
  budget.columnSizes.addItem(0, 0, 160);
  budget.columnSizes.addItem(0, 1, 100);
  for (let column = 2; column < 5; column += 1) budget.columnSizes.addItem(0, column, 112);
  for (const row of [0, 5]) {
    for (let column = 0; column < 5; column += 1) {
      budget.cellFills.addItem(row, column, row === 0 ? '#e5f2ed' : '#eff3f4');
    }
  }

  return createWorkbookDocumentState<SheetDocumentState>({
    id: 'website-demo',
    sheets: [
      { id: 'budget', name: 'Budget', color: '#24745e' },
      { id: 'blank', name: 'Blank sheet' },
    ],
    sheetStates: {
      budget,
      blank: createEmptySheetDocumentState(120, 26),
    },
  });
}
