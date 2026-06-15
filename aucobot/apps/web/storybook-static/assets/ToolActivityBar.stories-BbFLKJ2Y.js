import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{a as n,d as r,n as i,r as a,s as o,u as s}from"./tool-activity.story-controls-Dagj0gb2.js";import{n as c,t as l}from"./chat-story.decorators-CrgM5Aq5.js";import{n as u,t as d}from"./ToolActivityBar-BiIT4KjP.js";import{n as f,r as p,t as m}from"./story-demo-ui-B-Lf5gz5.js";var h,g,_,v,y,b;e((()=>{h=t(),u(),l(),p(),o(),g={title:`Chat/ToolActivity/ToolActivityBar`,component:d,tags:[`autodocs`],decorators:[c],parameters:{layout:`fullscreen`},argTypes:s,args:r,render:({toolPreset:e,status:t,showPreparing:r})=>(0,h.jsx)(d,{activities:r?[]:[n(e,t)],showPreparing:r})},_={},v={args:{showPreparing:!0,toolPreset:`exec`,status:`running`}},y={parameters:{controls:{disable:!0}},render:()=>(0,h.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:i.map(e=>(0,h.jsxs)(`div`,{children:[(0,h.jsxs)(f,{children:[`Inline bar — `,e]}),(0,h.jsx)(m,{children:(0,h.jsx)(d,{activities:a.map(t=>n(t,e))})})]},e))})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    showPreparing: true,
    toolPreset: 'exec',
    status: 'running'
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      {STATUS_OPTIONS.map(status => <div key={status}>\r
          <StorySectionLabel>Inline bar — {status}</StorySectionLabel>\r
          <StoryDemoBox>\r
            <ToolActivityBar activities={TOOL_PRESET_OPTIONS.map(toolPreset => buildStoryToolActivity(toolPreset, status))} />\r
          </StoryDemoBox>\r
        </div>)}\r
    </div>
}`,...y.parameters?.docs?.source}}},b=[`Playground`,`Preparing`,`AllToolLabels`]}))();export{y as AllToolLabels,_ as Playground,v as Preparing,b as __namedExportsOrder,g as default};