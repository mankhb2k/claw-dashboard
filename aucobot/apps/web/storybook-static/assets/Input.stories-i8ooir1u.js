import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Input-Ch-F-v7Y.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Input`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`32px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`},children:e}),c={args:{label:`Email address`,placeholder:`Enter your email...`,type:`email`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các trạng thái của Input`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{label:`Bình thường`,placeholder:`Nhập văn bản...`}),(0,i.jsx)(r,{label:`Mật khẩu`,type:`password`,defaultValue:`123456`}),(0,i.jsx)(r,{label:`Bị lỗi`,error:`Vui lòng nhập đúng định dạng email`,defaultValue:`invalid-email`}),(0,i.jsx)(r,{label:`Bị vô hiệu hóa`,disabled:!0,defaultValue:`Dữ liệu không thể sửa`})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email address',
    placeholder: 'Enter your email...',
    type: 'email'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Các trạng thái của Input</DemoLabel>\r
      <DemoBox>\r
        <Input label="Bình thường" placeholder="Nhập văn bản..." />\r
        <Input label="Mật khẩu" type="password" defaultValue="123456" />\r
        <Input label="Bị lỗi" error="Vui lòng nhập đúng định dạng email" defaultValue="invalid-email" />\r
        <Input label="Bị vô hiệu hóa" disabled defaultValue="Dữ liệu không thể sửa" />\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};