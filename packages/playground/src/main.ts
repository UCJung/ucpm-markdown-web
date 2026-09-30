import { createVanillaEditor, type VanillaEditor } from "@uc-markdown-web/adapter-vanilla";
import "./styles.css";
import { markdownFixtures, pasteFixtures, type PasteFixture } from "./fixtures.js";

const statusElement = requiredElement<HTMLParagraphElement>("#status");
const fixtureSelect = requiredElement<HTMLSelectElement>("#fixture-select");
const pasteSelect = requiredElement<HTMLSelectElement>("#paste-select");
const markdownInput = requiredElement<HTMLTextAreaElement>("#markdown-input");
const editorElement = requiredElement<HTMLDivElement>("#editor");
const markdownOutput = requiredElement<HTMLPreElement>("#markdown-output");
const domOutput = requiredElement<HTMLPreElement>("#dom-output");
const listeners = new AbortController();

let editor: VanillaEditor | undefined;
let unsubscribe: (() => void) | undefined;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Playground element is missing: ${selector}`);
  }
  return element;
}

function updateOutputs(markdown = editor?.getMarkdown() ?? ""): void {
  markdownOutput.textContent = markdown;
  domOutput.textContent = editorElement.innerHTML;
}

function disposeEditor(): void {
  unsubscribe?.();
  unsubscribe = undefined;
  editor?.destroy();
  editor = undefined;
}

function createEditor(markdown: string, status: string): void {
  disposeEditor();
  editor = createVanillaEditor({ element: editorElement, markdown });
  unsubscribe = editor.subscribe((currentMarkdown) => {
    updateOutputs(currentMarkdown);
    statusElement.textContent = "문서 변경을 subscribe()로 반영했습니다.";
  });
  updateOutputs();
  statusElement.textContent = status;
}

function runExtensionCommand(command: string): void {
  const activeEditor = editor;
  const result = activeEditor?.extensionCommands[command]?.() ?? false;
  updateOutputs();
  statusElement.textContent = result ? `extensionCommands.${command}()를 실행했습니다.` : `${command} 명령을 실행할 수 없습니다.`;
}

function runCoreCommand(command: "toggleBold"): void {
  const result = editor?.commands[command]() ?? false;
  updateOutputs();
  statusElement.textContent = result ? `commands.${command}()를 실행했습니다.` : `${command} 명령을 실행할 수 없습니다.`;
}

function dispatchPaste(fixture: PasteFixture): void {
  const editableDom = editorElement.querySelector<HTMLElement>(".ProseMirror");
  if (editableDom === null) {
    throw new Error("Visual editor DOM is unavailable.");
  }
  const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", {
    configurable: true,
    value: {
      getData(format: string): string {
        return format === "text/html" ? fixture.html : format === "text/plain" ? fixture.plainText : "";
      }
    }
  });
  editableDom.dispatchEvent(event);
  queueMicrotask(() => updateOutputs());
  statusElement.textContent = `${fixture.label} fixture를 편집 DOM paste 경로로 전달했습니다.`;
}

requiredElement<HTMLButtonElement>("#load-fixture").addEventListener("click", () => {
  const fixture = markdownFixtures[fixtureSelect.value];
  if (fixture === undefined) {
    throw new Error("Unknown Markdown fixture.");
  }
  markdownInput.value = fixture.markdown;
  createEditor(fixture.markdown, `${fixture.label} 시나리오를 새 인스턴스로 불러왔습니다.`);
}, { signal: listeners.signal });

requiredElement<HTMLButtonElement>("#load-markdown").addEventListener("click", () => {
  createEditor(markdownInput.value, "입력 Markdown으로 새 인스턴스를 만들었습니다.");
}, { signal: listeners.signal });

requiredElement<HTMLButtonElement>("#refresh-markdown").addEventListener("click", () => {
  updateOutputs();
  statusElement.textContent = "getMarkdown() 결과를 조회했습니다.";
}, { signal: listeners.signal });

document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runExtensionCommand(button.dataset.command ?? ""), { signal: listeners.signal });
});

document.querySelectorAll<HTMLButtonElement>("[data-core-command]").forEach((button) => {
  button.addEventListener("click", () => runCoreCommand("toggleBold"), { signal: listeners.signal });
});

requiredElement<HTMLButtonElement>("#run-paste").addEventListener("click", () => {
  const fixture = pasteFixtures[pasteSelect.value];
  if (fixture === undefined) {
    throw new Error("Unknown paste fixture.");
  }
  dispatchPaste(fixture);
}, { signal: listeners.signal });

window.addEventListener("pagehide", () => {
  listeners.abort();
  disposeEditor();
}, { once: true });

const initialFixture = markdownFixtures.mvp;
if (initialFixture === undefined) {
  throw new Error("Initial Markdown fixture is missing.");
}
markdownInput.value = initialFixture.markdown;
createEditor(initialFixture.markdown, "MVP 문법 시나리오를 불러왔습니다.");
