import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Switch-DahKJLHM.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Switch`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`24px`,minWidth:`240px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`},children:e}),c={args:{label:`Bật thông báo email`,id:`notifications`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các trạng thái của Switch`}),(0,i.jsxs)(s,{children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{children:`Chế độ tối`}),(0,i.jsx)(r,{id:`dark-mode`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{children:`Tự động cập nhật`}),(0,i.jsx)(r,{id:`auto-update`,defaultChecked:!0})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,opacity:.5},children:[(0,i.jsx)(`span`,{children:`Cài đặt nâng cao (Disabled)`}),(0,i.jsx)(r,{id:`advanced`,disabled:!0})]})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Bật thông báo email',
    id: 'notifications'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Các trạng thái của Switch</DemoLabel>\r
      <DemoBox>\r
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>\r
          <span>Chế độ tối</span>\r
          <Switch id="dark-mode" />\r
        </div>\r
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>\r
          <span>Tự động cập nhật</span>\r
          <Switch id="auto-update" defaultChecked />\r
        </div>\r
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: 0.5
      }}>\r
          <span>Cài đặt nâng cao (Disabled)</span>\r
          <Switch id="advanced" disabled />\r
        </div>\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};