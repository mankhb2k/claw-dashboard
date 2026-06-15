import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{Ht as i,It as a,M as o,Mt as s,i as c,t as l,u}from"./lucide-react-sgqGO4mA.js";import{n as d,t as f}from"./Tabs-BY8BMz1M.js";function p({variant:e=`section`,showIndicator:t=!0,withIcons:n=!1,initialValue:r}){let i=(0,h.useMemo)(()=>e===`section`?v:n?y:b,[e,n]),[a,o]=(0,h.useState)(r??i[0]?.value??``);return(0,m.jsx)(f,{items:i,value:a,onValueChange:o,variant:e,showIndicator:t,"aria-label":e===`section`?`Agent section`:`Agent form sections`})}var m,h,g,_,v,y,b,x,S,C,w,T,E,D;t((()=>{m=r(),h=e(n()),l(),d(),g={title:`UI/Tabs`,component:f,parameters:{layout:`padded`},tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`section`,`panel`],description:`section = Bot Agent nav; panel = Agent edit form`},showIndicator:{control:`boolean`,description:`Sliding underline under active tab`},value:{control:`text`},"aria-label":{control:`text`}}},_=({children:e})=>(0,m.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),v=[{value:`agents`,label:`Agents`,href:`#`},{value:`collaboration`,label:`Collaboration`,href:`#`,badge:3},{value:`schedules`,label:`Schedules`,href:`#`,badge:1,badgeTone:`danger`},{value:`heartbeat`,label:`Heartbeat`,href:`#`}],y=[{value:`identity`,label:`Identity`,icon:(0,m.jsx)(u,{size:16})},{value:`instructions`,label:`Instructions`,icon:(0,m.jsx)(a,{size:16})},{value:`capabilities`,label:`Capabilities`,icon:(0,m.jsx)(c,{size:16})},{value:`integrations`,label:`Integrations`,icon:(0,m.jsx)(o,{size:16})},{value:`schedules`,label:`Schedules`,icon:(0,m.jsx)(s,{size:16})},{value:`heartbeat`,label:`Heartbeat`,icon:(0,m.jsx)(i,{size:16})}],b=y.map(({value:e,label:t})=>({value:e,label:t})),x={render:e=>(0,m.jsx)(p,{variant:e.variant??`section`,showIndicator:e.showIndicator??!0,withIcons:e.variant===`panel`}),args:{variant:`section`,showIndicator:!0,"aria-label":`Tabs`}},S={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Bot Agent section nav (variant="section", showIndicator)`}),(0,m.jsx)(p,{variant:`section`,showIndicator:!0,initialValue:`agents`})]})},C={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Agent ID panel tabs (variant="panel", showIndicator=false)`}),(0,m.jsx)(p,{variant:`panel`,showIndicator:!1,withIcons:!0,initialValue:`identity`})]})},w={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Panel tabs — text only, no indicator`}),(0,m.jsx)(p,{variant:`panel`,showIndicator:!1,withIcons:!1,initialValue:`identity`})]})},T={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Section tabs — indicator disabled`}),(0,m.jsx)(p,{variant:`section`,showIndicator:!1,initialValue:`collaboration`})]})},E={render:()=>(0,m.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`,maxWidth:720},children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`With indicator + icons (panel)`}),(0,m.jsx)(p,{variant:`panel`,showIndicator:!0,withIcons:!0,initialValue:`capabilities`})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Without indicator + icons (Agent ID)`}),(0,m.jsx)(p,{variant:`panel`,showIndicator:!1,withIcons:!0,initialValue:`identity`})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Section nav + badges`}),(0,m.jsx)(p,{variant:`section`,showIndicator:!0,initialValue:`schedules`})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(_,{children:`Section — text only, no indicator`}),(0,m.jsx)(p,{variant:`section`,showIndicator:!1,initialValue:`heartbeat`})]})]})},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: args => <TabsPlayground variant={args.variant ?? "section"} showIndicator={args.showIndicator ?? true} withIcons={args.variant === "panel"} />,
  args: {
    variant: "section",
    showIndicator: true,
    "aria-label": "Tabs"
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>\r
        Bot Agent section nav (variant=&quot;section&quot;, showIndicator)\r
      </DemoLabel>\r
      <TabsPlayground variant="section" showIndicator initialValue="agents" />\r
    </div>
}`,...S.parameters?.docs?.source},description:{story:`Bot Agent — text tabs + bottom indicator (no icons)`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>\r
        Agent ID panel tabs (variant=&quot;panel&quot;, showIndicator=false)\r
      </DemoLabel>\r
      <TabsPlayground variant="panel" showIndicator={false} withIcons initialValue="identity" />\r
    </div>
}`,...C.parameters?.docs?.source},description:{story:`AgentID edit form — icons, no bottom indicator`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Panel tabs — text only, no indicator</DemoLabel>\r
      <TabsPlayground variant="panel" showIndicator={false} withIcons={false} initialValue="identity" />\r
    </div>
}`,...w.parameters?.docs?.source},description:{story:`Panel tabs without icons`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Section tabs — indicator disabled</DemoLabel>\r
      <TabsPlayground variant="section" showIndicator={false} initialValue="collaboration" />\r
    </div>
}`,...T.parameters?.docs?.source},description:{story:`Section with indicator off`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    maxWidth: 720
  }}>\r
      <div>\r
        <DemoLabel>With indicator + icons (panel)</DemoLabel>\r
        <TabsPlayground variant="panel" showIndicator withIcons initialValue="capabilities" />\r
      </div>\r
      <div>\r
        <DemoLabel>Without indicator + icons (Agent ID)</DemoLabel>\r
        <TabsPlayground variant="panel" showIndicator={false} withIcons initialValue="identity" />\r
      </div>\r
      <div>\r
        <DemoLabel>Section nav + badges</DemoLabel>\r
        <TabsPlayground variant="section" showIndicator initialValue="schedules" />\r
      </div>\r
      <div>\r
        <DemoLabel>Section — text only, no indicator</DemoLabel>\r
        <TabsPlayground variant="section" showIndicator={false} initialValue="heartbeat" />\r
      </div>\r
    </div>
}`,...E.parameters?.docs?.source}}},D=[`Playground`,`BotAgentSection`,`AgentIdPanel`,`PanelTextOnly`,`SectionNoIndicator`,`AllVariants`]}))();export{C as AgentIdPanel,E as AllVariants,S as BotAgentSection,w as PanelTextOnly,x as Playground,T as SectionNoIndicator,D as __namedExportsOrder,g as default};