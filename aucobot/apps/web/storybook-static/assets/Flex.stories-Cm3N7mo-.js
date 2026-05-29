import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./Box-BK_5Sy_L.js";import{n as i,t as a}from"./Flex-DeArrcJD.js";var o,s,c,l,u,d,f,p,m,h,g;e((()=>{o=t(),i(),n(),s={title:`Layout/Flex`,component:a,tags:[`autodocs`],argTypes:{direction:{control:`select`,options:[`row`,`column`,`row-reverse`,`column-reverse`]},align:{control:`select`,options:[`start`,`center`,`end`,`stretch`,`baseline`]},justify:{control:`select`,options:[`start`,`center`,`end`,`between`,`around`,`evenly`]},gap:{control:`number`},gapX:{control:`number`},gapY:{control:`number`},p:{control:`number`},px:{control:`number`},py:{control:`number`}}},c=({color:e=`primary`,children:t=`Box`,...n})=>(0,o.jsx)(r,{color:e,width:`100px`,height:`60px`,radius:`sm`,style:{display:`flex`,alignItems:`center`,justifyContent:`center`,fontWeight:`bold`,fontSize:`12px`},...n,children:t}),l={args:{gap:4,children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary`}),(0,o.jsx)(c,{color:`success`}),(0,o.jsx)(c,{color:`danger`})]})}},u={args:{wrap:`wrap`,gapX:8,gapY:2,style:{width:`340px`,border:`1px dashed var(--color-border)`,padding:`12px`},children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary`,children:`GapX: 8`}),(0,o.jsx)(c,{color:`success`,children:`GapY: 2`}),(0,o.jsx)(c,{color:`warning`,children:`Item 3`}),(0,o.jsx)(c,{color:`danger`,children:`Item 4`}),(0,o.jsx)(c,{color:`surface`,border:!0,children:`Item 5`}),(0,o.jsx)(c,{color:`subtle`,border:!0,children:`Item 6`})]})}},d={args:{direction:`column`,gap:2,children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary`,children:`Item 1`}),(0,o.jsx)(c,{color:`success`,children:`Item 2`}),(0,o.jsx)(c,{color:`warning`,children:`Item 3`})]})}},f={args:{center:!0,fullWidth:!0,style:{height:`200px`,border:`1px dashed var(--color-border)`},children:(0,o.jsx)(c,{color:`primary`,children:`Centered`})}},p={args:{justify:`between`,fullWidth:!0,p:4,border:!0,radius:`md`,children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary`,children:`Start`}),(0,o.jsx)(c,{color:`warning`,children:`Middle`}),(0,o.jsx)(c,{color:`danger`,children:`End`})]})}},m={render:()=>(0,o.jsxs)(a,{direction:`column`,gap:6,p:4,border:!0,radius:`lg`,style:{width:`100%`},children:[(0,o.jsx)(`p`,{style:{fontSize:`12px`,fontWeight:600,color:`var(--color-muted-foreground)`},children:`NESTED COMPOSITION TEST`}),(0,o.jsxs)(a,{justify:`between`,align:`center`,fullWidth:!0,children:[(0,o.jsx)(r,{color:`white`,border:!0,p:2,radius:`md`,children:`Left Content`}),(0,o.jsxs)(a,{gap:2,children:[(0,o.jsx)(r,{color:`primary`,px:4,py:2,radius:`sm`,children:`Action 1`}),(0,o.jsx)(r,{color:`subtle`,border:!0,px:4,py:2,radius:`sm`,children:`Action 2`})]})]}),(0,o.jsx)(a,{gap:4,wrap:`wrap`,children:[1,2,3,4,5,6].map(e=>(0,o.jsxs)(r,{color:`surface`,border:!0,p:6,radius:`lg`,width:`120px`,style:{textAlign:`center`},children:[`Card `,e]},e))})]})},h={args:{gap:25,p:40,border:!0,radius:`lg`,color:`surface`,children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c,{color:`primary`,children:`Gap: 25px`}),(0,o.jsx)(c,{color:`success`,children:`P: 40px`}),(0,o.jsx)(c,{color:`danger`,children:`Flex!`})]})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    gap: 4,
    children: <>\r
        <TestBox color="primary" />\r
        <TestBox color="success" />\r
        <TestBox color="danger" />\r
      </>
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    wrap: 'wrap',
    gapX: 8,
    gapY: 2,
    style: {
      width: '340px',
      border: '1px dashed var(--color-border)',
      padding: '12px'
    },
    children: <>\r
        <TestBox color="primary">GapX: 8</TestBox>\r
        <TestBox color="success">GapY: 2</TestBox>\r
        <TestBox color="warning">Item 3</TestBox>\r
        <TestBox color="danger">Item 4</TestBox>\r
        <TestBox color="surface" border>Item 5</TestBox>\r
        <TestBox color="subtle" border>Item 6</TestBox>\r
      </>
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    direction: 'column',
    gap: 2,
    children: <>\r
        <TestBox color="primary">Item 1</TestBox>\r
        <TestBox color="success">Item 2</TestBox>\r
        <TestBox color="warning">Item 3</TestBox>\r
      </>
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    center: true,
    fullWidth: true,
    style: {
      height: '200px',
      border: '1px dashed var(--color-border)'
    },
    children: <TestBox color="primary">Centered</TestBox>
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    justify: 'between',
    fullWidth: true,
    p: 4,
    border: true,
    radius: 'md',
    children: <>\r
        <TestBox color="primary">Start</TestBox>\r
        <TestBox color="warning">Middle</TestBox>\r
        <TestBox color="danger">End</TestBox>\r
      </>
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <Flex direction="column" gap={6} p={4} border radius="lg" style={{
    width: '100%'
  }}>\r
      <p style={{
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--color-muted-foreground)'
    }}>NESTED COMPOSITION TEST</p>\r
      \r
      <Flex justify="between" align="center" fullWidth>\r
        <Box color="white" border p={2} radius="md">Left Content</Box>\r
        <Flex gap={2}>\r
          <Box color="primary" px={4} py={2} radius="sm">Action 1</Box>\r
          <Box color="subtle" border px={4} py={2} radius="sm">Action 2</Box>\r
        </Flex>\r
      </Flex>\r
\r
      <Flex gap={4} wrap="wrap">\r
        {[1, 2, 3, 4, 5, 6].map(i => <Box key={i} color="surface" border p={6} radius="lg" width="120px" style={{
        textAlign: 'center'
      }}>\r
            Card {i}\r
          </Box>)}\r
      </Flex>\r
    </Flex>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    gap: 25,
    p: 40,
    border: true,
    radius: 'lg',
    color: 'surface',
    children: <>\r
        <TestBox color="primary">Gap: 25px</TestBox>\r
        <TestBox color="success">P: 40px</TestBox>\r
        <TestBox color="danger">Flex!</TestBox>\r
      </>
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`MixedGaps`,`Column`,`Centered`,`JustifyBetween`,`NestedLayout`,`CustomPixelSpacing`]}))();export{f as Centered,d as Column,h as CustomPixelSpacing,l as Default,p as JustifyBetween,u as MixedGaps,m as NestedLayout,g as __namedExportsOrder,s as default};