import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Switch-CgO-Nmzm.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Switch`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`24px`,minWidth:`240px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{label:`Enable email notifications`,id:`notifications`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Switch states`}),(0,i.jsxs)(s,{children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{children:`Dark mode`}),(0,i.jsx)(r,{id:`dark-mode`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{children:`Auto-update`}),(0,i.jsx)(r,{id:`auto-update`,defaultChecked:!0})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,opacity:.5},children:[(0,i.jsx)(`span`,{children:`Advanced settings (disabled)`}),(0,i.jsx)(r,{id:`advanced`,disabled:!0})]})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Enable email notifications',
    id: 'notifications'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Switch states</DemoLabel>\r
      <DemoBox>\r
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>\r
          <span>Dark mode</span>\r
          <Switch id="dark-mode" />\r
        </div>\r
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>\r
          <span>Auto-update</span>\r
          <Switch id="auto-update" defaultChecked />\r
        </div>\r
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: 0.5
      }}>\r
          <span>Advanced settings (disabled)</span>\r
          <Switch id="advanced" disabled />\r
        </div>\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};