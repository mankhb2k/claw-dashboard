import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./IconProvider-CILvH5wF.js";function i({withBackground:e=!0}){return(0,a.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fill, minmax(124px, 1fr))`,gap:`12px`,width:`100%`},children:o.map(t=>(0,a.jsxs)(`div`,{style:{border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,padding:`10px`,display:`flex`,alignItems:`center`,gap:`8px`},children:[(0,a.jsx)(r,{src:t.src,label:t.name,withBackground:e}),(0,a.jsx)(`span`,{style:{fontSize:`var(--font-size-sm)`,color:`var(--color-muted-foreground)`},children:t.name})]},t.name))})}var a,o,s,c,l,u,d,f,p,m;e((()=>{a=t(),n(),o=[{name:`Discord`,src:`/channel-icon/Discord-icon.svg`},{name:`Slack`,src:`/channel-icon/Slack-icon.svg`},{name:`Telegram`,src:`/channel-icon/Telegram-icon.svg`},{name:`Lark`,src:`/channel-icon/Lark-icon.svg`}],s=[{name:`GitHub`,src:`https://cdn.simpleicons.org/github/171515`},{name:`Notion`,src:`https://cdn.simpleicons.org/notion/000000`},{name:`Google Drive`,src:`https://cdn.simpleicons.org/googledrive/4285F4`},{name:`Figma`,src:`https://cdn.simpleicons.org/figma/F24E1E`}],c={title:`UI/IconProvider`,component:r,tags:[`autodocs`],args:{src:`/channel-icon/Discord-icon.svg`,label:`Discord`,size:`md`,shape:`square`,withBackground:!0},argTypes:{src:{control:`text`},label:{control:`text`},fallbackText:{control:`text`},size:{control:`inline-radio`,options:[`sm`,`md`,`lg`,`xl`]},shape:{control:`inline-radio`,options:[`square`,`circle`]},withBackground:{control:`boolean`}}},l={},u={render:()=>(0,a.jsx)(i,{})},d={render:()=>(0,a.jsx)(i,{withBackground:!1})},f={args:{src:``,label:`Notion`,fallbackText:`NO`}},p={render:()=>(0,a.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fill, minmax(150px, 1fr))`,gap:`12px`,width:`100%`},children:s.map(e=>(0,a.jsxs)(`div`,{style:{border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,padding:`10px`,display:`flex`,alignItems:`center`,gap:`8px`},children:[(0,a.jsx)(r,{src:e.src,label:e.name,withBackground:!0}),(0,a.jsx)(`span`,{style:{fontSize:`var(--font-size-sm)`,color:`var(--color-muted-foreground)`},children:e.name})]},e.name))})},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <DemoGrid />
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <DemoGrid withBackground={false} />
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    src: "",
    label: "Notion",
    fallbackText: "NO"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "12px",
    width: "100%"
  }}>\r
      {externalIcons.map(icon => <div key={icon.name} style={{
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      background: "var(--color-background)",
      padding: "10px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>\r
          <IconProvider src={icon.src} label={icon.name} withBackground />\r
          <span style={{
        fontSize: "var(--font-size-sm)",
        color: "var(--color-muted-foreground)"
      }}>\r
            {icon.name}\r
          </span>\r
        </div>)}\r
    </div>
}`,...p.parameters?.docs?.source}}},m=[`Playground`,`AllProviders`,`NoBackground`,`FallbackText`,`ExternalImageLinks`]}))();export{u as AllProviders,p as ExternalImageLinks,f as FallbackText,d as NoBackground,l as Playground,m as __namedExportsOrder,c as default};