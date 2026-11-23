import 'reflect-metadata';
import { createEmptySheetDocumentState, createSheetEditor } from '@searsuite/sear-assembly-setup';
import {
  WorkbookActiveSheetEditorObservation,
  WorkbookFormulaPlugin,
  createWorkbookEditor,
  type WorkbookEditor,
} from '@searsuite/sear-assembly-workbook';
import {
  BrowserPlatform,
  WebCanvasRenderContext,
  WebScroller,
  WebEventRegistrar,
  WebKeyboardRouter,
  WebPointerCapture,
  WebTextInput,
  WebCursorEngine,
  WebSocketTransport,
} from '@searsuite/sear-browser-adapters';
import { Scroller } from '@searsuite/sear-render-scroll';
import { SearWebBottomBar } from '@searsuite/sear-plugin-web-sheet-tabbar';
import { HeadlessToolbar } from '@searsuite/sear-assembly-plugin';
import { WebSheetAdapterDefaults } from '@searsuite/sear-plugin-web-toolbar';
import { createSheetEmbeddedSearCoreEditor } from '@searsuite/sear-plugin-sheet-doc-adapter';
import { createDemoWorkbook } from './workbook';

declare global {
  interface Window {
    workbookEditor?: WorkbookEditor;
  }
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const bottomBar = new SearWebBottomBar(new BrowserPlatform());

const editor = createWorkbookEditor({
  viewport: { width: canvas.clientWidth, height: canvas.clientHeight },
  documentState: createDemoWorkbook(),
  plugins: [WorkbookFormulaPlugin],
  sheetEditorFactory: ({ configuration }) => createSheetEditor({
    ...configuration,
    embeddedEditor: createSheetEmbeddedSearCoreEditor(),
  }),
  adapters: {
    ...WebSheetAdapterDefaults,
    platform: BrowserPlatform,
    createRenderContexts() {
      const renderContext = new WebCanvasRenderContext(canvas, false, new BrowserPlatform());
      return {
        renderContext,
        offScreenRenderContext: renderContext.cloneNode(),
        hitRenderContext: renderContext.createHitNode(),
      };
    },
    scroller: WebScroller,
    eventRegistrar: WebEventRegistrar,
    textInput: WebTextInput,
    keyboardRouter: WebKeyboardRouter,
    pointerCapture: WebPointerCapture,
    cursorEngine: WebCursorEngine,
    collabTransport: WebSocketTransport,
    toolbar: HeadlessToolbar,
    registerEnvironment(container) {
      container.registerInstance(Scroller.ContainerSymbol, canvas);
      container.registerInstance(WebKeyboardRouter.eventTargetSymbol, document);
      container.registerInstance(WebPointerCapture.eventTargetSymbol, document);
    },
  },
});

window.workbookEditor = editor;
editor.observations.subscribe(WorkbookActiveSheetEditorObservation, () => {
  const bottomBarContainer = document.getElementById('bottom-bar-container');
  if (bottomBarContainer) {
    bottomBar.mount(bottomBarContainer, {
      workbook: { editor, createSheetState: () => createEmptySheetDocumentState(120, 26) },
      statusText: '',
    });
  }
});

export function destroy(): void {
  bottomBar.destroy();
  editor.destroy();
  delete window.workbookEditor;
}
