import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Button-BQKtsxgJ.js";var i,a,o,s,c,l,u,d,f,p;e((()=>{i=t(),n(),a={title:`UI/Button`,component:r,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`primary`,`outline`,`secondary`,`ghost`,`danger`,`link`]},size:{control:`select`,options:[`default`,`xs`,`sm`,`lg`,`icon`,`icon_xs`,`icon_sm`,`icon_lg`]},loading:{control:`boolean`},disabled:{control:`boolean`}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`,flexWrap:`wrap`},children:e}),c={args:{variant:`primary`,children:`Primary Button`}},l={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các biến thể màu sắc (Variants)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`primary`,children:`Primary`}),(0,i.jsx)(r,{variant:`secondary`,children:`Secondary`}),(0,i.jsx)(r,{variant:`outline`,children:`Outline`}),(0,i.jsx)(r,{variant:`ghost`,children:`Ghost`}),(0,i.jsx)(r,{variant:`danger`,children:`Danger`}),(0,i.jsx)(r,{variant:`link`,children:`Link Button`})]})]})})},u={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các kích thước (Sizes)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{size:`xs`,children:`Extra Small`}),(0,i.jsx)(r,{size:`sm`,children:`Small`}),(0,i.jsx)(r,{size:`default`,children:`Default`}),(0,i.jsx)(r,{size:`lg`,children:`Large`})]})]})})},d={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Trạng thái (States)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{loading:!0,children:`Loading`}),(0,i.jsx)(r,{disabled:!0,children:`Disabled`}),(0,i.jsx)(r,{variant:`outline`,loading:!0,children:`Loading Outline`})]})]})})},f={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Nút chứa Icon (Icon Buttons)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{size:`icon_xs`,children:(0,i.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`16`,height:`16`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,i.jsx)(`path`,{d:`M5 12h14`}),(0,i.jsx)(`path`,{d:`M12 5l7 7-7 7`})]})}),(0,i.jsx)(r,{size:`icon_sm`,children:(0,i.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`16`,height:`16`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,i.jsx)(`path`,{d:`M5 12h14`}),(0,i.jsx)(`path`,{d:`M12 5l7 7-7 7`})]})}),(0,i.jsx)(r,{size:`icon`,children:(0,i.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`16`,height:`16`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,i.jsx)(`path`,{d:`M5 12h14`}),(0,i.jsx)(`path`,{d:`M12 5l7 7-7 7`})]})}),(0,i.jsx)(r,{size:`icon_lg`,children:(0,i.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`16`,height:`16`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,i.jsx)(`path`,{d:`M5 12h14`}),(0,i.jsx)(`path`,{d:`M12 5l7 7-7 7`})]})})]})]})})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Các biến thể màu sắc (Variants)</DemoLabel>\r
        <DemoBox>\r
          <Button variant="primary">Primary</Button>\r
          <Button variant="secondary">Secondary</Button>\r
          <Button variant="outline">Outline</Button>\r
          <Button variant="ghost">Ghost</Button>\r
          <Button variant="danger">Danger</Button>\r
          <Button variant="link">Link Button</Button>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Các kích thước (Sizes)</DemoLabel>\r
        <DemoBox>\r
          <Button size="xs">Extra Small</Button>\r
          <Button size="sm">Small</Button>\r
          <Button size="default">Default</Button>\r
          <Button size="lg">Large</Button>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Trạng thái (States)</DemoLabel>\r
        <DemoBox>\r
          <Button loading>Loading</Button>\r
          <Button disabled>Disabled</Button>\r
          <Button variant="outline" loading>Loading Outline</Button>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Nút chứa Icon (Icon Buttons)</DemoLabel>\r
        <DemoBox>\r
          <Button size="icon_xs">\r
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>\r
          </Button>\r
          <Button size="icon_sm">\r
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>\r
          </Button>\r
          <Button size="icon">\r
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>\r
          </Button>\r
          <Button size="icon_lg">\r
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>\r
          </Button>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...f.parameters?.docs?.source}}},p=[`Primary`,`Variants`,`Sizes`,`States`,`Icons`]}))();export{f as Icons,c as Primary,u as Sizes,d as States,l as Variants,p as __namedExportsOrder,a as default};