import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Textarea-ZvJjO9io.js";var i,a,o,s,c,l,u,d,f,p,m,h,g,_,v;e((()=>{i=t(),n(),a={title:`UI/Textarea`,component:r,parameters:{layout:`centered`,docs:{description:{component:"Multi-line text field with optional label, error, and hint — mirrors the `Input` field API for forms."}}},tags:[`autodocs`],argTypes:{label:{control:`text`,description:`Label shown above the textarea`},placeholder:{control:`text`,description:`Placeholder text`},hint:{control:`text`,description:"Helper text below the field (hidden when `error` is set)"},error:{control:`text`,description:`Validation error message`},rows:{control:{type:`number`,min:2,max:20,step:1},description:`Visible row count`},disabled:{control:`boolean`,description:`Disable editing`},readOnly:{control:`boolean`,description:`Read-only mode`},id:{control:`text`,description:`Associates label via htmlFor`},fill:{control:`boolean`,description:`Stretch to fill remaining flex space in parent container`}},args:{id:`textarea-demo`,label:`Description`,placeholder:`Enter a description…`,rows:4,disabled:!1,readOnly:!1,fill:!1}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e,width:t=420})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`32px`,width:t,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{label:`Description`,placeholder:`Enter a description…`,rows:4}},l={args:{id:`textarea-hint`,label:`Environment notes (optional)`,placeholder:`e.g. Camera name, SSH host, preferred TTS voice…`,hint:`Setup-specific notes — does not replace configuration in openclaw.json.`,rows:4}},u={args:{id:`textarea-error`,label:`AGENTS.md (Markdown)`,placeholder:`# Role
…`,error:`Markdown content is required.`,defaultValue:``,rows:6}},d={render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Default`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`state-default`,label:`Rules (one line per rule)`,placeholder:`Always confirm before deleting data
Prefer concise replies`,rows:5})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`With hint`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`state-hint`,label:`Environment notes (optional)`,placeholder:`e.g. Camera name, SSH host…`,hint:`Shown only when there is no error.`,rows:4})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Error`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`state-error`,label:`Output format`,error:`Please provide at least one line.`,defaultValue:``,rows:3})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Disabled & read-only`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{id:`state-disabled`,label:`Disabled`,disabled:!0,defaultValue:`Cannot edit this content.`,rows:3}),(0,i.jsx)(r,{id:`state-readonly`,label:`Read only`,readOnly:!0,defaultValue:`Line one
Line two`,rows:3})]})]})]})},f={render:()=>(0,i.jsxs)(s,{width:480,children:[(0,i.jsx)(r,{id:`rows-2`,label:`Compact (2 rows)`,placeholder:`Short answer…`,rows:2}),(0,i.jsx)(r,{id:`rows-5`,label:`Standard (5 rows)`,placeholder:`One idea per line…`,rows:5}),(0,i.jsx)(r,{id:`rows-10`,label:`Tall (10 rows)`,placeholder:`Long-form content…`,rows:10})]})},p={parameters:{docs:{description:{story:"Patterns used in `CardInstructions` — rules list and markdown editor."}}},render:()=>(0,i.jsxs)(s,{width:520,children:[(0,i.jsx)(r,{id:`agent-rules`,label:`Rules (one line per rule)`,rows:5,placeholder:`Always confirm before deleting data
Prefer concise replies`}),(0,i.jsx)(r,{id:`agent-markdown`,label:`AGENTS.md (Markdown)`,rows:12,placeholder:`# Role

What does this agent do? Who does it serve?`,style:{minHeight:280,fontFamily:`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`}})]})},m={args:{id:`textarea-no-label`,label:void 0,placeholder:`Textarea without label…`,rows:4}},h=`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.`,g={parameters:{docs:{description:{story:"Fixed height via `rows` — when content exceeds the box, scroll **inside** the textarea (`overflow-y: auto`). Try typing or use the pre-filled lorem text."}}},render:()=>(0,i.jsx)(s,{width:480,children:(0,i.jsx)(r,{id:`overflow-scroll`,label:`Long content (rows=4)`,rows:4,defaultValue:h,hint:`Scroll inside the field — the frame height does not grow with content.`})})},_={parameters:{docs:{description:{story:"Use `fill` when the parent is a flex column with fixed height — the textarea fills the remaining space."}}},render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,height:360,width:480,padding:24,gap:12,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:[(0,i.jsx)(o,{children:`Panel header (fixed)`}),(0,i.jsx)(r,{id:`fill-remaining`,fill:!0,label:`Notes`,rows:3,placeholder:`Textarea expands to fill remaining height…`,defaultValue:h,hint:`Parent: flex column, height 360px. Textarea: fill=true.`})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Description',
    placeholder: 'Enter a description…',
    rows: 4
  }
}`,...c.parameters?.docs?.source},description:{story:`Interactive playground — tweak label, rows, error, hint via Controls`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    id: 'textarea-hint',
    label: 'Environment notes (optional)',
    placeholder: 'e.g. Camera name, SSH host, preferred TTS voice…',
    hint: 'Setup-specific notes — does not replace configuration in openclaw.json.',
    rows: 4
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    id: 'textarea-error',
    label: 'AGENTS.md (Markdown)',
    placeholder: '# Role\\n…',
    error: 'Markdown content is required.',
    defaultValue: '',
    rows: 6
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Default</DemoLabel>\r
        <DemoBox>\r
          <Textarea id="state-default" label="Rules (one line per rule)" placeholder={'Always confirm before deleting data\\nPrefer concise replies'} rows={5} />\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>With hint</DemoLabel>\r
        <DemoBox>\r
          <Textarea id="state-hint" label="Environment notes (optional)" placeholder="e.g. Camera name, SSH host…" hint="Shown only when there is no error." rows={4} />\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Error</DemoLabel>\r
        <DemoBox>\r
          <Textarea id="state-error" label="Output format" error="Please provide at least one line." defaultValue="" rows={3} />\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Disabled & read-only</DemoLabel>\r
        <DemoBox>\r
          <Textarea id="state-disabled" label="Disabled" disabled defaultValue="Cannot edit this content." rows={3} />\r
          <Textarea id="state-readonly" label="Read only" readOnly defaultValue={'Line one\\nLine two'} rows={3} />\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <DemoBox width={480}>\r
      <Textarea id="rows-2" label="Compact (2 rows)" placeholder="Short answer…" rows={2} />\r
      <Textarea id="rows-5" label="Standard (5 rows)" placeholder="One idea per line…" rows={5} />\r
      <Textarea id="rows-10" label="Tall (10 rows)" placeholder="Long-form content…" rows={10} />\r
    </DemoBox>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Patterns used in \`CardInstructions\` — rules list and markdown editor.'
      }
    }
  },
  render: () => <DemoBox width={520}>\r
      <Textarea id="agent-rules" label="Rules (one line per rule)" rows={5} placeholder={'Always confirm before deleting data\\nPrefer concise replies'} />\r
      <Textarea id="agent-markdown" label="AGENTS.md (Markdown)" rows={12} placeholder={'# Role\\n\\nWhat does this agent do? Who does it serve?'} style={{
      minHeight: 280,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    }} />\r
    </DemoBox>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    id: 'textarea-no-label',
    label: undefined,
    placeholder: 'Textarea without label…',
    rows: 4
  }
}`,...m.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Fixed height via \`rows\` — when content exceeds the box, scroll **inside** the textarea (\`overflow-y: auto\`). ' + 'Try typing or use the pre-filled lorem text.'
      }
    }
  },
  render: () => <DemoBox width={480}>\r
      <Textarea id="overflow-scroll" label="Long content (rows=4)" rows={4} defaultValue={LOREM} hint="Scroll inside the field — the frame height does not grow with content." />\r
    </DemoBox>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Use \`fill\` when the parent is a flex column with fixed height — the textarea fills the remaining space.'
      }
    }
  },
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    height: 360,
    width: 480,
    padding: 24,
    gap: 12,
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background)'
  }}>\r
      <DemoLabel>Panel header (fixed)</DemoLabel>\r
      <Textarea id="fill-remaining" fill label="Notes" rows={3} placeholder="Textarea expands to fill remaining height…" defaultValue={LOREM} hint="Parent: flex column, height 360px. Textarea: fill=true." />\r
    </div>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`WithHint`,`WithError`,`States`,`RowHeights`,`AgentInstructions`,`WithoutLabel`,`OverflowScroll`,`FillRemainingSpace`]}))();export{p as AgentInstructions,c as Default,_ as FillRemainingSpace,g as OverflowScroll,f as RowHeights,d as States,u as WithError,l as WithHint,m as WithoutLabel,v as __namedExportsOrder,a as default};