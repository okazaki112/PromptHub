# Implementation: selected-list-scroll fix

Root cause:
`useVirtualizedPromptListModel.ts` had:
```ts
useEffect(() => {
  scrollRef.current?.scrollTo({ top: 0 });
}, [promptOrderKey]);
```
Accordion selection changes `collapsedPromptIds`; `promptOrderKey` changes; click parent with children caused top jump.

Shipped:
- route/type/list pass single `selectedPromptId`.
- hook target index selectedPrompt lookup.
- `promptOrderKey`/target effect invokes `rowVirtualizer.scrollToIndex(selectedIndex, { align: "start" })`
- no visible selection target means preserve current scroll position.

Verification:
- new hook tests 3 passed.
- `tests/unit/components`: 176 test files, 1281 tests passed.
- desktop typecheck passed.
- ESLint on 5 touched files passed.
- production build passed.
- runtime visual check pending user packaged/dev run.
