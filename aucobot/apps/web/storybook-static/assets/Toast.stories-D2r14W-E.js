import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./Button-CVrsnW4w.js";import{i,n as a,r as o,t as s}from"./Toast-D8yOD69q.js";function c({variant:e,title:t,description:n,duration:a}){let{toast:o}=i();return(0,u.jsx)(p,{children:(0,u.jsx)(r,{variant:e===`error`?`danger`:`primary`,onClick:()=>{o({variant:e,title:t,description:n.trim()||void 0,duration:a})},children:`Show toast`})})}function l(){return(0,u.jsxs)(p,{children:[(0,u.jsx)(r,{variant:`outline`,onClick:()=>o.success(`Copied`,`API key copied to clipboard.`),children:`toast.success()`}),(0,u.jsx)(r,{variant:`outline`,onClick:()=>o.error(`Invalid`,`Agent name cannot be empty.`),children:`toast.error()`})]})}var u,d,f,p,m,h,g,_,v,y,b;e((()=>{u=t(),a(),n(),d={title:`UI/Toast`,parameters:{layout:`centered`},tags:[`autodocs`],decorators:[e=>(0,u.jsx)(s,{children:(0,u.jsx)(e,{})})],argTypes:{variant:{control:`radio`,options:[`success`,`error`],description:`Toast type (success / error)`},title:{control:`text`,description:`Toast title`},description:{control:`text`,description:`Optional description (leave empty to omit)`},duration:{control:{type:`number`,min:1e3,max:1e4,step:500},description:`Auto-dismiss duration (ms)`}}},f=({children:e})=>(0,u.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),p=({children:e})=>(0,u.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-card-background)`,flexWrap:`wrap`},children:e}),m={args:{variant:`success`,title:`Saved successfully`,description:`Agent configuration has been updated.`,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},h={args:{variant:`success`,title:`Saved`,description:`Your changes have been saved.`,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},g={args:{variant:`error`,title:`Save failed`,description:`Could not connect to the worker. Try again later.`,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},_={args:{variant:`success`,title:`Complete`,description:``,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},v={render:()=>(0,u.jsxs)(`div`,{children:[(0,u.jsx)(f,{children:`toast — imperative API (requires ToastProvider)`}),(0,u.jsx)(l,{})]})},y={render:()=>(0,u.jsxs)(`div`,{children:[(0,u.jsx)(f,{children:`Multiple toasts in sequence`}),(0,u.jsx)(p,{children:(0,u.jsx)(r,{variant:`secondary`,onClick:()=>{o.success(`Step 1`,`Login session verified.`),setTimeout(()=>o.success(`Step 2`,`Configuration synced.`),400),setTimeout(()=>o.error(`Step 3`,`Worker timed out after 30 seconds.`),800)},children:`Trigger toast chain`})})]})},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Saved successfully',
    description: 'Agent configuration has been updated.',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Saved',
    description: 'Your changes have been saved.',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    title: 'Save failed',
    description: 'Could not connect to the worker. Try again later.',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Complete',
    description: '',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>toast — imperative API (requires ToastProvider)</DemoLabel>\r
      <ToastDemoImperative />\r
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Multiple toasts in sequence</DemoLabel>\r
      <DemoBox>\r
        <Button variant="secondary" onClick={() => {
        toast.success('Step 1', 'Login session verified.');
        setTimeout(() => toast.success('Step 2', 'Configuration synced.'), 400);
        setTimeout(() => toast.error('Step 3', 'Worker timed out after 30 seconds.'), 800);
      }}>\r
          Trigger toast chain\r
        </Button>\r
      </DemoBox>\r
    </div>
}`,...y.parameters?.docs?.source}}},b=[`Default`,`Success`,`Error`,`TitleOnly`,`ImperativeApi`,`States`]}))();export{m as Default,g as Error,v as ImperativeApi,y as States,h as Success,_ as TitleOnly,b as __namedExportsOrder,d as default};