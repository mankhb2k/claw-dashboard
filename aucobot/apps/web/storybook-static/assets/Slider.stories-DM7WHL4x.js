import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Slider-DCPi2y07.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Slider`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`,padding:`40px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`},children:e}),c={args:{label:`Âm lượng`,defaultValue:[50],max:100,step:1}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các ví dụ về Slider`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{label:`Mặc định (0-100)`,defaultValue:[30]}),(0,i.jsx)(r,{label:`Bước nhảy (Step: 10)`,defaultValue:[50],step:10,min:0,max:100}),(0,i.jsx)(r,{label:`Bị vô hiệu hóa`,defaultValue:[70],disabled:!0})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Âm lượng',
    defaultValue: [50],
    max: 100,
    step: 1
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Các ví dụ về Slider</DemoLabel>\r
      <DemoBox>\r
        <Slider label="Mặc định (0-100)" defaultValue={[30]} />\r
        <Slider label="Bước nhảy (Step: 10)" defaultValue={[50]} step={10} min={0} max={100} />\r
        <Slider label="Bị vô hiệu hóa" defaultValue={[70]} disabled />\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};