const statusElement = document.querySelector<HTMLParagraphElement>("#status");

if (statusElement === null) {
  throw new Error("Playground status element is missing.");
}

statusElement.textContent = "패키지 스캐폴드가 준비되었습니다.";
