import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Input-DdeIBfR1.js";var i,a,o,s,c,l,u,d,f;e((()=>{i=t(),n(),a={title:`UI/Input`,component:r,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`]},labelPosition:{control:`select`,options:[`top`,`left`,`right`,`none`]},disabled:{control:`boolean`}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`32px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{label:`Email address`,placeholder:`Enter your email...`,type:`email`,size:`md`,labelPosition:`top`}},l={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Sizes`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{label:`Medium (default)`,size:`md`,placeholder:`Enter text...`}),(0,i.jsx)(r,{label:`Small`,size:`sm`,placeholder:`Enter text...`})]})]})})},u={render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,i.jsxs)(`section`,{children:[(0,i.jsx)(o,{children:`Label on top (top)`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`input-label-top`,label:`Email`,labelPosition:`top`,placeholder:`name@example.com`})})]}),(0,i.jsxs)(`section`,{children:[(0,i.jsx)(o,{children:`Label on left (left)`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`input-label-left`,label:`Region`,labelPosition:`left`,defaultValue:`Singapore`})})]}),(0,i.jsxs)(`section`,{children:[(0,i.jsx)(o,{children:`Label on right (right)`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`input-label-right`,label:`Plan`,labelPosition:`right`,defaultValue:`Pro`})})]}),(0,i.jsxs)(`section`,{children:[(0,i.jsx)(o,{children:`No label (none)`}),(0,i.jsx)(s,{children:(0,i.jsx)(r,{id:`input-label-none`,label:`Hidden label`,labelPosition:`none`,placeholder:`Search...`})})]})]})},d={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Input states`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{label:`Default`,placeholder:`Enter text...`}),(0,i.jsx)(r,{label:`Password`,type:`password`,defaultValue:`123456`}),(0,i.jsx)(r,{label:`Error`,error:`Please enter a valid email address`,defaultValue:`invalid-email`}),(0,i.jsx)(r,{label:`Disabled`,disabled:!0,defaultValue:`Read-only data`})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email address',
    placeholder: 'Enter your email...',
    type: 'email',
    size: 'md',
    labelPosition: 'top'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Sizes</DemoLabel>\r
        <DemoBox>\r
          <Input label="Medium (default)" size="md" placeholder="Enter text..." />\r
          <Input label="Small" size="sm" placeholder="Enter text..." />\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <section>\r
        <DemoLabel>Label on top (top)</DemoLabel>\r
        <DemoBox>\r
          <Input id="input-label-top" label="Email" labelPosition="top" placeholder="name@example.com" />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Label on left (left)</DemoLabel>\r
        <DemoBox>\r
          <Input id="input-label-left" label="Region" labelPosition="left" defaultValue="Singapore" />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Label on right (right)</DemoLabel>\r
        <DemoBox>\r
          <Input id="input-label-right" label="Plan" labelPosition="right" defaultValue="Pro" />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>No label (none)</DemoLabel>\r
        <DemoBox>\r
          <Input id="input-label-none" label="Hidden label" labelPosition="none" placeholder="Search..." />\r
        </DemoBox>\r
      </section>\r
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Input states</DemoLabel>\r
      <DemoBox>\r
        <Input label="Default" placeholder="Enter text..." />\r
        <Input label="Password" type="password" defaultValue="123456" />\r
        <Input label="Error" error="Please enter a valid email address" defaultValue="invalid-email" />\r
        <Input label="Disabled" disabled defaultValue="Read-only data" />\r
      </DemoBox>\r
    </div>
}`,...d.parameters?.docs?.source}}},f=[`Default`,`Sizes`,`LabelPositions`,`States`]}))();export{c as Default,u as LabelPositions,l as Sizes,d as States,f as __namedExportsOrder,a as default};