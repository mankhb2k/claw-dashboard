import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Button-dxUFHqWY.js";var i,a,o,s,c,l,u,d,f,p,m;e((()=>{i=t(),n(),a={title:`UI/Button`,component:r,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`primary`,`outline`,`secondary`,`ghost`,`danger`,`link`]},size:{control:`select`,options:[`xs`,`sm`,`md`,`lg`]},iconOnly:{control:`boolean`},loading:{control:`boolean`},disabled:{control:`boolean`}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,flexWrap:`wrap`},children:e}),c=()=>(0,i.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`16`,height:`16`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,i.jsx)(`path`,{d:`M5 12h14`}),(0,i.jsx)(`path`,{d:`M12 5l7 7-7 7`})]}),l={args:{variant:`primary`,children:`Primary Button`}},u={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Color variants`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`primary`,children:`Primary`}),(0,i.jsx)(r,{variant:`secondary`,children:`Secondary`}),(0,i.jsx)(r,{variant:`outline`,children:`Outline`}),(0,i.jsx)(r,{variant:`ghost`,children:`Ghost`}),(0,i.jsx)(r,{variant:`danger`,children:`Danger`}),(0,i.jsx)(r,{variant:`link`,children:`Link Button`})]})]})})},d={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Sizes`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{size:`xs`,children:`Extra Small`}),(0,i.jsx)(r,{size:`sm`,children:`Small`}),(0,i.jsx)(r,{size:`md`,children:`Medium`}),(0,i.jsx)(r,{size:`lg`,children:`Large`})]})]})})},f={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`States`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{loading:!0,children:`Loading`}),(0,i.jsx)(r,{disabled:!0,children:`Disabled`}),(0,i.jsx)(r,{variant:`outline`,loading:!0,children:`Loading Outline`})]})]})})},p={render:()=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Icon-only buttons (iconOnly)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{size:`xs`,iconOnly:!0,"aria-label":`Next`,children:(0,i.jsx)(c,{})}),(0,i.jsx)(r,{size:`sm`,iconOnly:!0,"aria-label":`Next`,children:(0,i.jsx)(c,{})}),(0,i.jsx)(r,{size:`md`,iconOnly:!0,"aria-label":`Next`,children:(0,i.jsx)(c,{})}),(0,i.jsx)(r,{size:`lg`,iconOnly:!0,"aria-label":`Next`,children:(0,i.jsx)(c,{})})]})]})})},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Color variants</DemoLabel>\r
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
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Sizes</DemoLabel>\r
        <DemoBox>\r
          <Button size="xs">Extra Small</Button>\r
          <Button size="sm">Small</Button>\r
          <Button size="md">Medium</Button>\r
          <Button size="lg">Large</Button>\r
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
        <DemoLabel>States</DemoLabel>\r
        <DemoBox>\r
          <Button loading>Loading</Button>\r
          <Button disabled>Disabled</Button>\r
          <Button variant="outline" loading>Loading Outline</Button>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Icon-only buttons (iconOnly)</DemoLabel>\r
        <DemoBox>\r
          <Button size="xs" iconOnly aria-label="Next">\r
            <ArrowIcon />\r
          </Button>\r
          <Button size="sm" iconOnly aria-label="Next">\r
            <ArrowIcon />\r
          </Button>\r
          <Button size="md" iconOnly aria-label="Next">\r
            <ArrowIcon />\r
          </Button>\r
          <Button size="lg" iconOnly aria-label="Next">\r
            <ArrowIcon />\r
          </Button>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...p.parameters?.docs?.source}}},m=[`Primary`,`Variants`,`Sizes`,`States`,`Icons`]}))();export{p as Icons,l as Primary,d as Sizes,f as States,u as Variants,m as __namedExportsOrder,a as default};