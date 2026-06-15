import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Slider-CE8ESOhG.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Slider`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`,padding:`40px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{label:`Volume`,defaultValue:[50],max:100,step:1}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Slider examples`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{label:`Default (0-100)`,defaultValue:[30]}),(0,i.jsx)(r,{label:`Step: 10`,defaultValue:[50],step:10,min:0,max:100}),(0,i.jsx)(r,{label:`Disabled`,defaultValue:[70],disabled:!0})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Volume',
    defaultValue: [50],
    max: 100,
    step: 1
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Slider examples</DemoLabel>\r
      <DemoBox>\r
        <Slider label="Default (0-100)" defaultValue={[30]} />\r
        <Slider label="Step: 10" defaultValue={[50]} step={10} min={0} max={100} />\r
        <Slider label="Disabled" defaultValue={[70]} disabled />\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};