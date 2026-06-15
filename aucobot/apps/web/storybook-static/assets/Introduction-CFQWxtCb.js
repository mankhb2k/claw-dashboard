import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{I as n,a as r,o as i}from"./blocks-F9GMznZj.js";import{t as a}from"./mdx-react-shim-BfR_q1fO.js";function o(e){let t={code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,strong:`strong`,...n(),...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(r,{title:`Chat/Introduction`}),`
`,(0,c.jsx)(t.h1,{id:`chat-ui`,children:`Chat UI`}),`
`,(0,c.jsx)(t.p,{children:`Stories for the realtime chat flow — tool events, markdown bubbles, and live thread.`}),`
`,(0,c.jsx)(t.h2,{id:`story-groups`,children:`Story groups`}),`
`,(0,c.jsxs)(t.p,{children:[`| Folder | Component | Description |
|---|---|---|
| `,(0,c.jsx)(t.strong,{children:`ContentArea`}),` | `,(0,c.jsx)(t.code,{children:`Chat/ContentArea`}),` | Scrollable thread preview (no composer) |
| `,(0,c.jsx)(t.strong,{children:`ToolActivity`}),` | `,(0,c.jsx)(t.code,{children:`ToolActivityCard`}),` | Per-tool call card (exec, read, MCP, …) |
| `,(0,c.jsx)(t.strong,{children:`ToolActivity`}),` | `,(0,c.jsx)(t.code,{children:`ToolActivityBar`}),` | Inline status bar / preparing state |
| `,(0,c.jsx)(t.strong,{children:`ToolActivity`}),` | `,(0,c.jsx)(t.code,{children:`ToolResearchBlock`}),` | Web search / fetch group + sources |
| `,(0,c.jsx)(t.strong,{children:`ToolActivity`}),` | `,(0,c.jsx)(t.code,{children:`ChatLiveThread`}),` | Orchestrator — text + tools in one thread |
| `,(0,c.jsx)(t.strong,{children:`Message`}),` | `,(0,c.jsx)(t.code,{children:`ChatMessageBubble`}),` | User / assistant bubble (markdown) |`]}),`
`,(0,c.jsx)(t.h2,{id:`controls`,children:`Controls`}),`
`,(0,c.jsxs)(t.p,{children:[`Shared args live in `,(0,c.jsx)(t.code,{children:`components/chat/tool-activity.story-controls.ts`}),`:`]}),`
`,(0,c.jsxs)(t.p,{children:[`| Control | Used in | Effect |
|---|---|---|
| `,(0,c.jsx)(t.code,{children:`toolPreset`}),` | Card, Bar, LiveThread, ContentArea | Tool type → i18n label |
| `,(0,c.jsx)(t.code,{children:`status`}),` | Card, Bar, LiveThread | running / done / error label |
| `,(0,c.jsx)(t.code,{children:`withArgs`}),` / `,(0,c.jsx)(t.code,{children:`withOutput`}),` | Card | Expanded body content |
| `,(0,c.jsx)(t.code,{children:`showPreparing`}),` | Bar, LiveThread | Preparing row |
| `,(0,c.jsx)(t.code,{children:`researchPreset`}),` | ResearchBlock, LiveThread | Web search flow |
| `,(0,c.jsx)(t.code,{children:`scenario`}),` | ContentArea | Full thread preset |`]}),`
`,(0,c.jsxs)(t.p,{children:[`Use `,(0,c.jsx)(t.strong,{children:`Playground`}),` to tweak controls; `,(0,c.jsx)(t.strong,{children:`AllToolLabels`}),` / `,(0,c.jsx)(t.strong,{children:`AllStatuses`}),` show every label variant.`]}),`
`,(0,c.jsx)(t.h2,{id:`run-storybook`,children:`Run Storybook`}),`
`,(0,c.jsx)(t.pre,{children:(0,c.jsx)(t.code,{className:`language-bash`,children:`cd aucobot
pnpm --filter @aucobot/web run storybook
`})}),`
`,(0,c.jsxs)(t.p,{children:[`Open the `,(0,c.jsx)(t.strong,{children:`Chat`}),` sidebar → pick a component. Use the `,(0,c.jsx)(t.strong,{children:`Theme`}),` toolbar to switch light/dark.`]})]})}function s(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(o,{...e})}):o(e)}var c;e((()=>{c=t(),a(),i()}))();export{s as default};