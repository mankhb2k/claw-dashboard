import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./Checkbox-C0e_DWV4.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Checkbox`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`24px`,minWidth:`200px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{label:`Accept terms of service`,id:`terms`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Checkbox states`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{id:`unselected`,label:`Unchecked`}),(0,i.jsx)(r,{id:`selected`,label:`Checked`,defaultChecked:!0}),(0,i.jsx)(r,{id:`disabled`,label:`Disabled`,disabled:!0}),(0,i.jsx)(r,{id:`disabled-checked`,label:`Disabled (checked)`,disabled:!0,defaultChecked:!0})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Accept terms of service',
    id: 'terms'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Checkbox states</DemoLabel>\r
      <DemoBox>\r
        <Checkbox id="unselected" label="Unchecked" />\r
        <Checkbox id="selected" label="Checked" defaultChecked />\r
        <Checkbox id="disabled" label="Disabled" disabled />\r
        <Checkbox id="disabled-checked" label="Disabled (checked)" disabled defaultChecked />\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};