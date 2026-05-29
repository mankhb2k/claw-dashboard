import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./Input-DCRp7IqI.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`UI/Input`,component:r,parameters:{layout:`centered`},tags:[`autodocs`]},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`32px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{label:`Email address`,placeholder:`Enter your email...`,type:`email`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Input states`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{label:`Default`,placeholder:`Enter text...`}),(0,i.jsx)(r,{label:`Password`,type:`password`,defaultValue:`123456`}),(0,i.jsx)(r,{label:`Error`,error:`Please enter a valid email address`,defaultValue:`invalid-email`}),(0,i.jsx)(r,{label:`Disabled`,disabled:!0,defaultValue:`Read-only data`})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email address',
    placeholder: 'Enter your email...',
    type: 'email'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Input states</DemoLabel>\r
      <DemoBox>\r
        <Input label="Default" placeholder="Enter text..." />\r
        <Input label="Password" type="password" defaultValue="123456" />\r
        <Input label="Error" error="Please enter a valid email address" defaultValue="invalid-email" />\r
        <Input label="Disabled" disabled defaultValue="Read-only data" />\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`States`]}))();export{c as Default,l as States,u as __namedExportsOrder,a as default};