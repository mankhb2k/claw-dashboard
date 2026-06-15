import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Box-C64LokKE.js";import{n as i,t as a}from"./Grid-C5JHBCNA.js";var o,s,c,l,u,d,f,p,m,h,g,_,v;e((()=>{o=t(),i(),n(),s={title:`Layout/Grid`,component:a,parameters:{layout:`padded`},tags:[`autodocs`],argTypes:{columns:{control:`select`,options:[1,2,3,4,5,6,12]},gap:{control:`select`,options:[0,1,2,3,4,6,8]},align:{control:`select`,options:[`start`,`center`,`end`,`stretch`]},justify:{control:`select`,options:[`start`,`center`,`end`,`stretch`]}}},c=({color:e=`primary`,children:t=`Box`,...n})=>(0,o.jsx)(r,{color:e,radius:`md`,p:4,style:{display:`flex`,alignItems:`center`,justifyContent:`center`,fontWeight:`bold`,minHeight:`80px`},...n,children:t}),l={args:{columns:3,gap:4,children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary`,children:`1`}),(0,o.jsx)(c,{color:`success`,children:`2`}),(0,o.jsx)(c,{color:`danger`,children:`3`}),(0,o.jsx)(c,{color:`warning`,children:`4`}),(0,o.jsx)(c,{color:`surface`,border:!0,children:`5`}),(0,o.jsx)(c,{color:`subtle`,border:!0,children:`6`})]})}},u={args:{columns:2,gap:6,children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary-dim`,style:{color:`var(--color-primary)`},children:`Sidebar/Panel`}),(0,o.jsx)(c,{color:`white`,border:!0,children:`Main Content Area`})]})}},d={args:{columns:12,gap:2,children:Array.from({length:12}).map((e,t)=>(0,o.jsx)(c,{color:`surface`,border:!0,style:{minHeight:`40px`,fontSize:`10px`},children:t+1},t))}},f={render:()=>(0,o.jsxs)(a,{columns:3,gap:4,p:4,border:!0,radius:`lg`,color:`subtle`,children:[(0,o.jsx)(c,{color:`primary`,style:{gridColumn:`span 2`},children:`Span 2 Columns`}),(0,o.jsx)(c,{color:`success`,children:`Span 1`}),(0,o.jsx)(c,{color:`warning`,children:`Span 1`}),(0,o.jsx)(c,{color:`danger`,style:{gridColumn:`span 2`},children:`Span 2 Columns`}),(0,o.jsx)(c,{color:`white`,border:!0,style:{gridColumn:`span 3`},children:`Span All 3 Columns`})]})},p=({children:e})=>(0,o.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),m=({children:e})=>(0,o.jsx)(`div`,{style:{padding:`16px`,background:`var(--color-background)`,border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,textAlign:`center`,fontWeight:500},children:e}),h={render:()=>(0,o.jsxs)(`div`,{children:[(0,o.jsxs)(p,{children:[`Equal columns with a number (columns=`,4,`, gap="1rem")`]}),(0,o.jsxs)(a,{columns:4,gap:`1rem`,children:[(0,o.jsx)(m,{children:`Item 1`}),(0,o.jsx)(m,{children:`Item 2`}),(0,o.jsx)(m,{children:`Item 3`}),(0,o.jsx)(m,{children:`Item 4`})]})]})},g={render:()=>(0,o.jsxs)(`div`,{children:[(0,o.jsx)(p,{children:`Responsive string (columns="repeat(auto-fill, minmax(200px, 1fr))")`}),(0,o.jsx)(`p`,{style:{fontSize:`13px`,color:`var(--color-muted-foreground)`,marginBottom:`16px`},children:`Resize the browser window to see items wrap automatically.`}),(0,o.jsxs)(a,{columns:`repeat(auto-fill, minmax(200px, 1fr))`,gap:`1rem`,children:[(0,o.jsx)(m,{children:`Item 1`}),(0,o.jsx)(m,{children:`Item 2`}),(0,o.jsx)(m,{children:`Item 3`}),(0,o.jsx)(m,{children:`Item 4`}),(0,o.jsx)(m,{children:`Item 5`}),(0,o.jsx)(m,{children:`Item 6`})]})]})},_={render:()=>(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,o.jsxs)(`div`,{children:[(0,o.jsxs)(p,{children:[`Numeric gap (gap=`,`{32}`,` → 32px)`]}),(0,o.jsxs)(a,{columns:3,gap:32,children:[(0,o.jsx)(m,{children:`Item 1`}),(0,o.jsx)(m,{children:`Item 2`}),(0,o.jsx)(m,{children:`Item 3`})]})]}),(0,o.jsxs)(`div`,{children:[(0,o.jsx)(p,{children:`String gap (gap="2rem")`}),(0,o.jsxs)(a,{columns:3,gap:`2rem`,children:[(0,o.jsx)(m,{children:`Item 1`}),(0,o.jsx)(m,{children:`Item 2`}),(0,o.jsx)(m,{children:`Item 3`})]})]})]})},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 3,
    gap: 4,
    children: <>\r
        <TestBox color="primary">1</TestBox>\r
        <TestBox color="success">2</TestBox>\r
        <TestBox color="danger">3</TestBox>\r
        <TestBox color="warning">4</TestBox>\r
        <TestBox color="surface" border>5</TestBox>\r
        <TestBox color="subtle" border>6</TestBox>\r
      </>
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 2,
    gap: 6,
    children: <>\r
        <TestBox color="primary-dim" style={{
        color: 'var(--color-primary)'
      }}>Sidebar/Panel</TestBox>\r
        <TestBox color="white" border>Main Content Area</TestBox>\r
      </>
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 12,
    gap: 2,
    children: Array.from({
      length: 12
    }).map((_, i) => <TestBox key={i} color="surface" border style={{
      minHeight: '40px',
      fontSize: '10px'
    }}>\r
        {i + 1}\r
      </TestBox>)
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <Grid columns={3} gap={4} p={4} border radius="lg" color="subtle">\r
      <TestBox color="primary" style={{
      gridColumn: 'span 2'
    }}>Span 2 Columns</TestBox>\r
      <TestBox color="success">Span 1</TestBox>\r
      <TestBox color="warning">Span 1</TestBox>\r
      <TestBox color="danger" style={{
      gridColumn: 'span 2'
    }}>Span 2 Columns</TestBox>\r
      <TestBox color="white" border style={{
      gridColumn: 'span 3'
    }}>Span All 3 Columns</TestBox>\r
    </Grid>
}`,...f.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Equal columns with a number (columns={4}, gap=&quot;1rem&quot;)</DemoLabel>\r
      <Grid columns={4} gap="1rem">\r
        <DummyItem>Item 1</DummyItem>\r
        <DummyItem>Item 2</DummyItem>\r
        <DummyItem>Item 3</DummyItem>\r
        <DummyItem>Item 4</DummyItem>\r
      </Grid>\r
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>\r
        Responsive string (columns=&quot;repeat(auto-fill, minmax(200px, 1fr))&quot;)\r
      </DemoLabel>\r
      <p style={{
      fontSize: '13px',
      color: 'var(--color-muted-foreground)',
      marginBottom: '16px'
    }}>\r
        Resize the browser window to see items wrap automatically.\r
      </p>\r
      <Grid columns="repeat(auto-fill, minmax(200px, 1fr))" gap="1rem">\r
        <DummyItem>Item 1</DummyItem>\r
        <DummyItem>Item 2</DummyItem>\r
        <DummyItem>Item 3</DummyItem>\r
        <DummyItem>Item 4</DummyItem>\r
        <DummyItem>Item 5</DummyItem>\r
        <DummyItem>Item 6</DummyItem>\r
      </Grid>\r
    </div>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Numeric gap (gap={'{32}'} → 32px)</DemoLabel>\r
        <Grid columns={3} gap={32}>\r
          <DummyItem>Item 1</DummyItem>\r
          <DummyItem>Item 2</DummyItem>\r
          <DummyItem>Item 3</DummyItem>\r
        </Grid>\r
      </div>\r
      <div>\r
        <DemoLabel>String gap (gap=&quot;2rem&quot;)</DemoLabel>\r
        <Grid columns={3} gap="2rem">\r
          <DummyItem>Item 1</DummyItem>\r
          <DummyItem>Item 2</DummyItem>\r
          <DummyItem>Item 3</DummyItem>\r
        </Grid>\r
      </div>\r
    </div>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`TwoColumns`,`TwelveColumns`,`ComplexLayout`,`FixedColumns`,`ResponsiveAutoFill`,`CustomGap`]}))();export{f as ComplexLayout,_ as CustomGap,l as Default,h as FixedColumns,g as ResponsiveAutoFill,d as TwelveColumns,u as TwoColumns,v as __namedExportsOrder,s as default};