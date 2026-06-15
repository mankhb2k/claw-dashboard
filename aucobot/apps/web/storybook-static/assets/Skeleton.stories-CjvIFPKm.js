import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{t as n}from"./Card-B8WeLED8.js";import{t as r}from"./Typography-BLpjlWB_.js";import{a as i,i as a,t as o}from"./ui-BVQXb2az.js";import{t as s}from"./Flex-i1KOO1Yf.js";import{t as c}from"./layout-D0eUeG9n.js";var l,u,d,f,p,m,h,g,_,v;e((()=>{l=t(),i(),o(),c(),u={title:`UI/Skeleton`,component:a,tags:[`autodocs`],parameters:{layout:`padded`},argTypes:{variant:{control:`select`,options:[`block`,`text`,`textSm`,`circle`],description:`Preset shape`},width:{control:`text`,description:`Width (px number or CSS value)`},height:{control:`text`,description:`Height (px number or CSS value)`},pulse:{control:`boolean`,description:`Shimmer pulse animation`}}},d=({children:e})=>(0,l.jsx)(r,{variant:`xs`,color:`muted`,style:{marginBottom:8,display:`block`},children:e}),f={args:{variant:`text`,width:`240px`,pulse:!0}},p={render:()=>(0,l.jsxs)(s,{direction:`column`,gap:24,style:{maxWidth:320},children:[(0,l.jsxs)(`div`,{children:[(0,l.jsx)(d,{children:`text — title line`}),(0,l.jsx)(a,{variant:`text`,width:`72%`})]}),(0,l.jsxs)(`div`,{children:[(0,l.jsx)(d,{children:`textSm — secondary line`}),(0,l.jsx)(a,{variant:`textSm`,width:`100%`})]}),(0,l.jsxs)(`div`,{children:[(0,l.jsx)(d,{children:`block — button / custom block`}),(0,l.jsx)(a,{variant:`block`,width:72,height:32})]}),(0,l.jsxs)(`div`,{children:[(0,l.jsx)(d,{children:`circle — avatar`}),(0,l.jsx)(a,{variant:`circle`,width:40,height:40})]})]})},m={render:()=>(0,l.jsxs)(s,{direction:`column`,gap:16,children:[(0,l.jsxs)(`div`,{children:[(0,l.jsx)(d,{children:`pulse ON`}),(0,l.jsx)(a,{variant:`text`,width:`200px`,pulse:!0})]}),(0,l.jsxs)(`div`,{children:[(0,l.jsx)(d,{children:`pulse OFF`}),(0,l.jsx)(a,{variant:`text`,width:`200px`,pulse:!1})]})]})},h={render:()=>(0,l.jsx)(n,{disableHover:!0,style:{width:320,padding:`var(--space-4)`},children:(0,l.jsxs)(s,{direction:`column`,gap:`var(--space-3)`,fullWidth:!0,children:[(0,l.jsx)(a,{variant:`text`,width:`72%`,height:16}),(0,l.jsxs)(s,{justify:`between`,align:`start`,gap:`var(--space-3)`,fullWidth:!0,children:[(0,l.jsx)(a,{variant:`textSm`,width:`100%`,style:{flex:1,minWidth:0}}),(0,l.jsx)(a,{variant:`block`,width:72,height:32})]}),(0,l.jsxs)(s,{justify:`between`,align:`center`,fullWidth:!0,children:[(0,l.jsx)(a,{variant:`textSm`,width:`40%`}),(0,l.jsxs)(s,{align:`center`,gap:`var(--space-2)`,children:[(0,l.jsx)(a,{variant:`textSm`,width:36}),(0,l.jsx)(a,{variant:`textSm`,width:36})]})]})]})})},g={render:()=>(0,l.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(2, minmax(0, 280px))`,gap:`var(--space-4)`},children:Array.from({length:4},(e,t)=>(0,l.jsx)(n,{disableHover:!0,style:{padding:`var(--space-4)`,minHeight:`8.5rem`},children:(0,l.jsxs)(s,{direction:`column`,gap:`var(--space-3)`,fullWidth:!0,children:[(0,l.jsx)(a,{variant:`text`,width:`65%`}),(0,l.jsxs)(s,{justify:`between`,gap:`var(--space-3)`,fullWidth:!0,children:[(0,l.jsx)(a,{variant:`textSm`,width:`100%`,style:{flex:1}}),(0,l.jsx)(a,{variant:`block`,width:64,height:28})]}),(0,l.jsxs)(s,{justify:`between`,fullWidth:!0,children:[(0,l.jsx)(a,{variant:`textSm`,width:`35%`}),(0,l.jsx)(a,{variant:`textSm`,width:56})]})]})},t))})},_={render:()=>(0,l.jsxs)(s,{direction:`column`,gap:8,style:{maxWidth:280},children:[(0,l.jsx)(a,{variant:`text`,width:`80%`}),(0,l.jsx)(a,{variant:`textSm`,width:`100%`}),(0,l.jsx)(a,{variant:`textSm`,width:`60%`}),(0,l.jsx)(r,{variant:`small`,color:`muted`,style:{marginTop:8},children:`After loading, the bars above are replaced with real content.`})]})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "text",
    width: "240px",
    pulse: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Flex direction="column" gap={24} style={{
    maxWidth: 320
  }}>\r
      <div>\r
        <DemoLabel>text — title line</DemoLabel>\r
        <Skeleton variant="text" width="72%" />\r
      </div>\r
      <div>\r
        <DemoLabel>textSm — secondary line</DemoLabel>\r
        <Skeleton variant="textSm" width="100%" />\r
      </div>\r
      <div>\r
        <DemoLabel>block — button / custom block</DemoLabel>\r
        <Skeleton variant="block" width={72} height={32} />\r
      </div>\r
      <div>\r
        <DemoLabel>circle — avatar</DemoLabel>\r
        <Skeleton variant="circle" width={40} height={40} />\r
      </div>\r
    </Flex>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <Flex direction="column" gap={16}>\r
      <div>\r
        <DemoLabel>pulse ON</DemoLabel>\r
        <Skeleton variant="text" width="200px" pulse />\r
      </div>\r
      <div>\r
        <DemoLabel>pulse OFF</DemoLabel>\r
        <Skeleton variant="text" width="200px" pulse={false} />\r
      </div>\r
    </Flex>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Card disableHover style={{
    width: 320,
    padding: "var(--space-4)"
  }}>\r
      <Flex direction="column" gap="var(--space-3)" fullWidth>\r
        <Skeleton variant="text" width="72%" height={16} />\r
        <Flex justify="between" align="start" gap="var(--space-3)" fullWidth>\r
          <Skeleton variant="textSm" width="100%" style={{
          flex: 1,
          minWidth: 0
        }} />\r
          <Skeleton variant="block" width={72} height={32} />\r
        </Flex>\r
        <Flex justify="between" align="center" fullWidth>\r
          <Skeleton variant="textSm" width="40%" />\r
          <Flex align="center" gap="var(--space-2)">\r
            <Skeleton variant="textSm" width={36} />\r
            <Skeleton variant="textSm" width={36} />\r
          </Flex>\r
        </Flex>\r
      </Flex>\r
    </Card>
}`,...h.parameters?.docs?.source},description:{story:`Multiple Skeletons — CardSkillStore layout pattern`,...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 280px))",
    gap: "var(--space-4)"
  }}>\r
      {Array.from({
      length: 4
    }, (_, i) => <Card key={i} disableHover style={{
      padding: "var(--space-4)",
      minHeight: "8.5rem"
    }}>\r
          <Flex direction="column" gap="var(--space-3)" fullWidth>\r
            <Skeleton variant="text" width="65%" />\r
            <Flex justify="between" gap="var(--space-3)" fullWidth>\r
              <Skeleton variant="textSm" width="100%" style={{
            flex: 1
          }} />\r
              <Skeleton variant="block" width={64} height={28} />\r
            </Flex>\r
            <Flex justify="between" fullWidth>\r
              <Skeleton variant="textSm" width="35%" />\r
              <Skeleton variant="textSm" width={56} />\r
            </Flex>\r
          </Flex>\r
        </Card>)}\r
    </div>
}`,...g.parameters?.docs?.source},description:{story:`Two skeleton cards in a 2-column grid`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <Flex direction="column" gap={8} style={{
    maxWidth: 280
  }}>\r
      <Skeleton variant="text" width="80%" />\r
      <Skeleton variant="textSm" width="100%" />\r
      <Skeleton variant="textSm" width="60%" />\r
      <Typography variant="small" color="muted" style={{
      marginTop: 8
    }}>\r
        After loading, the bars above are replaced with real content.\r
      </Typography>\r
    </Flex>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`Variants`,`Pulse`,`CardSkillStoreLayout`,`GridLoading`,`WithTypography`]}))();export{h as CardSkillStoreLayout,f as Default,g as GridLoading,m as Pulse,p as Variants,_ as WithTypography,v as __namedExportsOrder,u as default};