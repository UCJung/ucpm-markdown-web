# Claude 교차검증 — PRUN-2026-09-0002 (REQ-2026-09-0002)

> Status: PERFORMED
> Mode: auto · interactive
> Executor: Codex orchestrator · Claude CLI headless · claude 2.1.266
> Base: f2d1486dc25750e3b73dead9e93dad6f16a28c5e
> Head: 0d7016d843f0209cc1ec9e2de35f35cc2b1f0025
> Range: f2d1486dc25750e3b73dead9e93dad6f16a28c5e..0d7016d843f0209cc1ec9e2de35f35cc2b1f0025
> Verdict: needs-attention
> Findings: Critical 0 / High 1 / Medium 4 / Low 6
> Executed: 2026-09-30T06:31:39Z
> 렌즈 5종: 로직결함·경계·보안·동시성·공통화/재사용

## Critical

없음

## High

- [high] 명령 반환값이 실제 적용 여부를 반영하지 않음 (dispatch 결과 폐기) (packages/core/src/editor.ts:117-132, 0.82) — `runCommand`/`runExtensionCommand`가 넘기는 dispatch 콜백이 `this.dispatch(transaction)`의 boolean 반환값을 버린다(editor.ts:119-121, 128-130). `this.dispatch`는 `filterTransaction` 플러그인이 transaction을 거부하면 `result.transactions.length === 0`으로 `false`를 반환하는데(editor.ts:83-85), 호출한 ProseMirror 명령(`toggleMark`·`setBlockType` 등)은 dispatch 호출 성공 여부와 무관하게 `true`를 반환한다. 그 결과 `editor.commands.toggleBold()`가 문서가 전혀 바뀌지 않았는데도 `true`를 반환한다.

PLAN.md § 3 인터페이스 설계는 `commands`를 "성공 시 `true`, 적용 불가 시 `false`"로 규정하므로 계약 위반이다. 확인한 사실: dispatch 반환값 미사용·`filterTransaction` 거부 시 false 반환 경로 존재. 현재 테스트에는 filterTransaction과 commands를 조합한 케이스가 없어 회귀가 잡히지 않는다(editor.test.ts의 filtering 테스트는 `editor.dispatch`만 호출). 권고: dispatch 콜백 내부에서 반환값을 지역 플래그에 저장하고, 명령 결과와 AND 결합해 반환하도록 변경한다. 예: `let applied = true; const result = command(this.state, (tr) => { applied = this.dispatch(tr); }); return result && applied;`. 동시에 filterTransaction으로 거부되는 상황에서 `commands.toggleBold()`가 false를 반환하는 테스트를 추가한다.

## Medium

- [medium] `options.schema` 지정 시 확장의 node/mark spec이 조용히 무시됨 (packages/core/src/editor.ts:50-54, 0.85) — 생성자는 `options.schema`가 주어지면 그 스키마를 그대로 쓰고(editor.ts:50), 별도로 `createEditorSchema(this.extensions)`를 호출하지만 반환값을 버린다(editor.ts:52-54). 이 호출은 확장명·spec명 중복 검증이라는 부수효과만 노린 것으로 보이나(코드에 주석 없음 — 의도는 추측), 실제 사용되는 스키마에는 확장이 선언한 `nodes`/`marks`가 전혀 병합되지 않는다. 따라서 node spec을 제공하는 확장을 외부 스키마와 함께 등록하면 오류 없이 무시되고, 해당 노드를 만드는 시점에 원인 파악이 어려운 런타임 오류가 난다.

게다가 이 검증은 제공된 스키마에 이미 존재하는 이름과의 충돌은 검사하지 못한다(기본 spec 집합 기준으로만 검사). PLAN.md의 "확장 이름·node/mark 이름 충돌은 생성 중 오류로 보고한다"가 이 경로에서는 부분적으로만 성립한다. 권고: 둘 중 하나로 계약을 명확히 한다: (a) 확장이 `nodes`/`marks`를 선언했는데 `options.schema`가 주어지면 명시적 오류를 던진다, 또는 (b) 제공된 스키마의 `spec.nodes`/`spec.marks`를 기준으로 확장 spec을 병합해 새 Schema를 만든다. 어느 쪽이든 해당 동작을 검증하는 테스트를 추가하고, 부수효과 목적의 `createEditorSchema` 호출은 의도를 드러내는 전용 검증 함수로 분리한다.
- [medium] 초기 문서 JSON의 최상위 노드 타입을 검증하지 않음 (packages/core/src/editor.ts:231-257, 0.8) — `createInitialDocument`의 JSON 경로는 `schema.nodeFromJSON(document)` 후 `check()`만 수행한다(editor.ts:254-256). `check()`는 노드 자체의 내용 정합성만 보므로, `{ type: "paragraph", ... }`처럼 최상위가 `doc`이 아닌 JSON도 통과해 `EditorState.create({ doc })`에 그대로 전달된다. ProseMirror는 이 경우 doc이 topNodeType인지 검증하지 않으므로, 이후 `setBlockType`·`replaceRange` 등에서 위치 계산이 어긋나거나 예외가 난다. `ProseMirrorNode` 인스턴스 경로도 스키마 동일성만 확인하고(editor.ts:245-251) 타입은 확인하지 않는다.

신뢰할 수 없는 입력(저장된 문서 JSON 등)을 `createEditor`에 넘기는 소비자 관점에서는 입력검증 누락에 해당한다. 권고: 두 경로 모두에서 `node.type !== schema.topNodeType`이면 `Initial document must be a "doc" node.` 류의 명시적 오류를 던지고, 잘못된 최상위 타입에 대한 테스트를 추가한다.
- [medium] listener 오류 집계 시 상태는 갱신됐으나 dispatch가 예외로 종료되어 반환값 계약이 깨짐 (packages/core/src/editor.ts:74-90, 0.7) — `dispatch`는 `this.state`를 갱신한 뒤 `notifyListeners`를 호출하고(editor.ts:87-89), listener에서 오류가 나면 `notifyListeners`가 AggregateError를 던져(editor.ts:188) `dispatch`가 `true`를 반환하지 못한다. 호출자는 "예외 = 실패"로 해석하기 쉬우나 실제로는 transaction이 이미 적용된 상태다. 특히 이 dispatch가 `runCommand`의 콜백 안에서 발생하면 예외가 ProseMirror 명령 실행 도중을 관통해 `editor.commands.*` 밖으로 전파되므로(editor.ts:119-121), 명령 API가 boolean 대신 throw하는 비일관 경로가 생긴다.

PLAN.md는 "나머지 callback을 계속 실행한 뒤 오류를 집계해 반환한다"고만 적고 있어, 적용 성공과 통지 실패를 호출자가 구분할 방법이 정의되어 있지 않다. 권고: listener 오류를 dispatch 반환 경로와 분리한다. 예: `onError` 옵션 또는 전용 에러 채널로 보고하고 dispatch는 `true`를 반환하거나, 최소한 던지는 AggregateError에 "transaction은 이미 적용됨"을 나타내는 필드/메시지를 포함하고 문서화한다.
- [medium] listener 내부 destroy() 후에도 남은 listener 통지가 계속되어 종료 계약이 느슨함 (packages/core/src/editor.ts:107-189, 0.72) — `notifyListeners`는 시작 시 listener 스냅샷을 고정한다(editor.ts:173). listener가 `editor.destroy()`를 호출하면 `destroyed = true`와 `listeners.clear()`가 수행되지만(editor.ts:112-113), 진행 중인 루프는 스냅샷을 계속 순회해 이미 파괴된 편집기 상태로 나머지 listener를 호출한다. 이 listener들이 `dispatch`나 명령을 호출하면 `Editor has been destroyed.` 예외가 나고 그 오류는 집계 대상으로 삼켜진다.

또한 `destroy()`가 통지 중에 호출되면 `destroyExtensions()`가 AggregateError를 던져 listener 예외로 집계되므로, 확장 종료 hook 실패가 호출자에게 원래 형태로 도달하지 않는다. 기존 테스트(lifecycle.test.ts "remains safe when a listener destroys the editor")는 listener가 1개뿐이라 이 경로를 덮지 않는다. 권고: 통지 루프 각 반복 시작에서 `this.destroyed`를 확인해 파괴 이후 남은 listener 통지를 중단하거나, 통지 중 `destroy()` 호출을 지연 처리(통지 종료 후 실행)한다. listener 2개 이상 + 첫 listener가 destroy하는 테스트를 추가한다.

## Low

- [low] 동일 listener 중복 구독 시 구독이 조용히 합쳐지고 첫 해제로 모두 해제됨 (packages/core/src/editor.ts:92-105, 0.85) — `listeners`가 `Set`이므로(editor.ts:43, 94) 같은 함수 참조를 두 번 `subscribe`하면 항목이 1개만 남는다. 각 호출은 서로 다른 해제 함수를 반환하지만, 어느 하나를 호출하면 공유 항목이 제거되어 나머지 구독도 무효가 된다. 멱등 해제 자체는 의도대로 동작하나(editor.ts:97-104), "구독 N회 → 통지 N회" 기대와 "각 해제는 자신의 구독만 취소" 기대가 모두 깨진다. 권고: 중복 구독을 허용하려면 `Set<EditorListener>` 대신 고유 토큰을 키로 갖는 `Map`이나 배열+식별자 구조로 바꾸고, 허용하지 않으려면 중복 구독을 명시적 오류로 거부하고 그 동작을 문서·테스트에 남긴다.
- [low] 확장 command의 dispatch가 여러 번 호출될 때 두 번째부터 stale state 기반으로 동작 (packages/core/src/editor.ts:124-132, 0.6) — `runExtensionCommand`는 생성 시점의 `this.state`를 컨텍스트로 넘기지만(editor.ts:126-131), dispatch 콜백은 `this.state`를 갱신한다. 확장이 한 command 안에서 dispatch를 두 번 호출하면 두 번째 transaction은 첫 dispatch 이전 상태(`context.state`)에서 파생된 것이라 위치가 어긋나 문서 손상이나 예외로 이어질 수 있다. ProseMirror의 일반적 command 관례와 동일한 제약이지만, `ExtensionCommandContext`에는 "dispatch는 1회만"이라는 계약이 명시되어 있지 않다. 권고: `ExtensionCommandContext`의 JSDoc에 dispatch 1회 호출 계약을 명시하거나, 런타임에서 한 command 실행 중 2회째 dispatch를 오류로 거부한다.
- [low] link 마크의 href 값 검증·직렬화 정책 부재 (packages/core/src/schema.ts:11-22, 0.55) — `baseMarkSpecs.link`는 `href`를 기본값 없는 필수 attr로만 선언하고 값에 대한 제약이 없다(schema.ts:14-21). 현재는 `toDOM`/`parseDOM`이 없어 DOM 렌더링 경로가 존재하지 않으므로 실제 XSS는 발생하지 않는다(확인한 사실). 다만 후속 REQ에서 DOM 어댑터·Markdown 직렬화가 붙을 때 `javascript:`·`data:` 스킴이 그대로 통과할 수 있는 지점이므로, 스키마 계약 단계에서 경계를 남겨두는 편이 안전하다. 권고: `link` spec에 허용 스킴 검증(예: http/https/mailto만 허용하는 정규화 함수)을 붙이거나, 최소한 "href 정제는 렌더링/직렬화 계층 책임"임을 주석과 후속 TASK 항목으로 명시한다.
- [low] root typecheck/test가 항상 전체 build를 선행해 검증 비용과 결합이 증가 (package.json:7-13, 0.65) — root `package.json`의 `typecheck`·`test`가 `pnpm build &&`로 시작한다. 이는 core 테스트가 `@uc-markdown-web/extension-api`를 dist 경유로 해석하기 때문으로 보이나(추측 — 해석 경로 직접 확인 안 함), 결과적으로 단위 테스트 1건만 돌려도 전체 패키지 빌드가 선행되고 빌드 실패가 타입검사 결과를 가린다. 또한 `packages/*/tsconfig.json`의 `"types": ["vitest/globals"]`는 vitest globals를 켜지 않은 상태(테스트가 `vitest`에서 명시 import)에서는 불필요하며, `types` 배열 지정으로 다른 앰비언트 타입 자동 포함이 차단된다. 권고: 워크스페이스 패키지 간 참조를 소스(`exports`의 dev condition 또는 vitest `resolve.alias`)로 해석하게 해 build 선행 의존을 제거하거나, 최소한 `test:ci` 같은 별도 스크립트로 분리한다. `"types": ["vitest/globals"]`는 globals를 실제로 켜지 않는다면 제거한다.
- [low] WORK-LIST.md 표 행의 열 개수 불일치 (works/WORK-LIST.md:6-6, 0.95) — `works/WORK-LIST.md:6`의 PRUN-2026-09-0002 행이 `| DONE | 2026-09-30 | | 2026-09-30 |`로 헤더(5열)보다 1열 많다. 완료일 칸이 빈 칸 하나 뒤에 밀려 렌더링 시 깨지거나 완료일이 누락된 것처럼 보인다. 바로 위 PRUN-2026-09-0001 행은 정상 5열이다. 권고: `| PRUN-2026-09-0002 | 프레임워크 중립 편집 코어와 확장 API 구현 | DONE | 2026-09-30 | 2026-09-30 |`로 빈 셀을 제거한다.
- [low] prosemirror-history만 정확 버전 고정으로 의존성 표기 일관성 결여 (packages/core/package.json:22-28, 0.7) — `packages/core/package.json`에서 prosemirror 계열 중 `prosemirror-history`만 `1.5.0` 고정이고 나머지는 caret 범위다. TASK-02_result.md에도 "prosemirror-history 1.5.0 고정"만 적혀 있고 고정 사유가 기록되어 있지 않다(사유 미확인). 근거가 사라지면 이후 업그레이드 판단이 어렵고, 동일 계열 패키지 간 버전 스큐(특히 공통 의존인 prosemirror-state/transform)를 유발할 수 있다. 권고: 고정 사유를 package.json 주석 대신 TASK 결과 문서나 ADR에 한 줄로 남기고, 사유가 일시적 이슈 회피라면 caret으로 되돌린다.

## 렌즈별 확인

렌즈별 확인 요약 — (1) 로직결함: 명령 실행 경로에서 `dispatch`의 boolean 반환값을 버려 filterTransaction으로 거부된 명령도 `true`를 반환하는 계약 위반(PLAN § 3 \"적용 불가 시 false\")을 확인했다. 또한 `options.schema` 지정 시 확장의 node/mark spec이 오류 없이 무시된다. (2) 경계: 초기 문서 JSON의 최상위 노드가 `doc`인지 검증하지 않아 비-top 노드가 EditorState로 유입될 수 있고, listener 오류 발생 시 상태는 이미 갱신됐는데 dispatch가 예외로 끝나 성공/실패 구분이 불가하다. 통지 중 destroy 시 남은 listener가 파괴된 편집기로 계속 호출된다. (3) 보안: 인증·권한·비밀정보 노출 대상 코드는 없다(헤드리스 라이브러리, 네트워크·저장소 접근 없음). 입력검증 측면에서 초기 문서 검증 누락과 link href 스킴 정책 부재만 확인했으며, 현재는 toDOM이 없어 실제 렌더링 XSS 경로는 존재하지 않는다. (4) 동시성: 단일 스레드 동기 모델로 경합은 없으나, 통지 중 재진입 dispatch 가드는 있는 반면 확장 command 내 다중 dispatch가 stale state 기반으로 동작하는 순서 의존이 남아 있고, 동일 listener 중복 구독이 Set으로 조용히 합쳐진다. (5) 공통화/재사용: schema 병합·오류 집계(`throwCollected`)·lifecycle 정리는 잘 공통화되어 있다. 다만 부수효과 목적의 `createEditorSchema` 재호출이 의도를 감추고, root `typecheck`/`test`가 전체 build에 결합되어 검증 절차가 무거워졌다. critical 발견은 없고 high 1건, medium 4건, low 6건이다.

- editor.ts의 dispatch 콜백이 반환값을 소비하도록 수정하고, filterTransaction으로 거부되는 상황에서 commands.* 가 false를 반환하는 회귀 테스트를 추가한다
- options.schema + 확장 node/mark 조합의 계약(오류 또는 병합)을 결정하고 테스트로 고정한다
- createInitialDocument의 JSON/Node 경로 모두에서 topNodeType 검증을 추가한다
- listener 오류 집계와 dispatch 반환값의 관계, 통지 중 destroy 처리 정책을 PLAN 인터페이스 절에 명문화하고 다중 listener 테스트로 덮는다
- works/WORK-LIST.md:6의 표 열 개수를 바로잡는다

## 격리 검증

- mcp_servers: []
- tools: ["Glob","Grep","Read","StructuredOutput"]
- envSanitized: true
- argv(발췌): -p ... --strict-mcp-config --mcp-config ... --tools Read,Glob,Grep --permission-prompts none --no-session-persistence
- S1/S2: 5항목 동일

## 반영

후속 TASK 실수정 예정.

