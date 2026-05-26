import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Container-YBu3lMrr.js";var i,a,o,s,c,l,u,d,f;e((()=>{i=t(),n(),a={title:`Layout/Container`,component:r,parameters:{layout:`fullscreen`},tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`,`lg`,`full`]},display:{control:`text`},align:{control:`select`,options:[`left`,`center`,`right`]}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`,padding:`0 24px`},children:e}),s=()=>(0,i.jsx)(`div`,{style:{padding:`24px`,background:`var(--color-primary-dim)`,border:`1px solid var(--color-primary)`,borderRadius:`var(--radius-md)`,color:`var(--color-primary)`,fontWeight:500,textAlign:`center`},children:`Khung nội dung (Sẽ bị giới hạn bởi Container)`}),c={args:{size:`lg`,children:(0,i.jsx)(s,{})}},l={render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`,padding:`24px 0`},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Size: Small (640px)`}),(0,i.jsx)(r,{size:`sm`,children:(0,i.jsx)(s,{})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Size: Medium (1024px)`}),(0,i.jsx)(r,{size:`md`,children:(0,i.jsx)(s,{})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Size: Large (1440px - Mặc định)`}),(0,i.jsx)(r,{size:`lg`,children:(0,i.jsx)(s,{})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Size: Full (100%)`}),(0,i.jsx)(r,{size:`full`,children:(0,i.jsx)(s,{})})]})]})},u={render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`,padding:`24px 0`},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Căn trái (Align: left)`}),(0,i.jsx)(r,{size:`sm`,align:`left`,children:(0,i.jsx)(s,{})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Căn giữa (Align: center - Mặc định)`}),(0,i.jsx)(r,{size:`sm`,align:`center`,children:(0,i.jsx)(s,{})})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Căn phải (Align: right)`}),(0,i.jsx)(r,{size:`sm`,align:`right`,children:(0,i.jsx)(s,{})})]})]})},d={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Sử dụng Container như một Flexbox`}),(0,i.jsxs)(r,{size:`md`,display:`flex`,align:`center`,style:{gap:`16px`,justifyContent:`space-between`},children:[(0,i.jsx)(`div`,{style:{padding:`16px`,background:`var(--color-white)`,border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,flex:1},children:`Cột 1`}),(0,i.jsx)(`div`,{style:{padding:`16px`,background:`var(--color-white)`,border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,flex:1},children:`Cột 2`}),(0,i.jsx)(`div`,{style:{padding:`16px`,background:`var(--color-white)`,border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,flex:1},children:`Cột 3`})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: <DummyContent />
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    padding: '24px 0'
  }}>\r
      <div>\r
        <DemoLabel>Size: Small (640px)</DemoLabel>\r
        <Container size="sm">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Size: Medium (1024px)</DemoLabel>\r
        <Container size="md">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Size: Large (1440px - Mặc định)</DemoLabel>\r
        <Container size="lg">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Size: Full (100%)</DemoLabel>\r
        <Container size="full">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    padding: '24px 0'
  }}>\r
      <div>\r
        <DemoLabel>Căn trái (Align: left)</DemoLabel>\r
        <Container size="sm" align="left">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Căn giữa (Align: center - Mặc định)</DemoLabel>\r
        <Container size="sm" align="center">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Căn phải (Align: right)</DemoLabel>\r
        <Container size="sm" align="right">\r
          <DummyContent />\r
        </Container>\r
      </div>\r
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Sử dụng Container như một Flexbox</DemoLabel>\r
      <Container size="md" display="flex" align="center" style={{
      gap: '16px',
      justifyContent: 'space-between'
    }}>\r
        <div style={{
        padding: '16px',
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        flex: 1
      }}>\r
          Cột 1\r
        </div>\r
        <div style={{
        padding: '16px',
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        flex: 1
      }}>\r
          Cột 2\r
        </div>\r
        <div style={{
        padding: '16px',
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        flex: 1
      }}>\r
          Cột 3\r
        </div>\r
      </Container>\r
    </div>
}`,...d.parameters?.docs?.source}}},f=[`Default`,`Sizes`,`Alignment`,`FlexLayout`]}))();export{u as Alignment,c as Default,d as FlexLayout,l as Sizes,f as __namedExportsOrder,a as default};