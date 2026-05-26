import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Checkbox-D6UPnVIs.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Checkbox`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`24px`,minWidth:`200px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`},children:e}),c={args:{label:`Chấp nhận điều khoản sử dụng`,id:`terms`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các trạng thái của Checkbox`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{id:`unselected`,label:`Chưa chọn`}),(0,i.jsx)(r,{id:`selected`,label:`Đã chọn`,defaultChecked:!0}),(0,i.jsx)(r,{id:`disabled`,label:`Bị vô hiệu hóa`,disabled:!0}),(0,i.jsx)(r,{id:`disabled-checked`,label:`Bị vô hiệu hóa (đã chọn)`,disabled:!0,defaultChecked:!0})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Chấp nhận điều khoản sử dụng',
    id: 'terms'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Các trạng thái của Checkbox</DemoLabel>\r
      <DemoBox>\r
        <Checkbox id="unselected" label="Chưa chọn" />\r
        <Checkbox id="selected" label="Đã chọn" defaultChecked />\r
        <Checkbox id="disabled" label="Bị vô hiệu hóa" disabled />\r
        <Checkbox id="disabled-checked" label="Bị vô hiệu hóa (đã chọn)" disabled defaultChecked />\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};