import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{f as n,n as r,o as i,p as a,r as o,s}from"./tool-activity.story-controls-Dagj0gb2.js";import{n as c,t as l}from"./chat-story.decorators-CrgM5Aq5.js";import{n as u,t as d}from"./ToolActivityCard-CM9nWIUJ.js";import{n as f,r as p,t as m}from"./story-demo-ui-B-Lf5gz5.js";var h,g,_,v,y,b;e((()=>{h=t(),u(),l(),p(),s(),g={title:`Chat/ToolActivity/ToolActivityCard`,component:d,tags:[`autodocs`],decorators:[c],parameters:{layout:`fullscreen`},argTypes:n,args:a,render:e=>(0,h.jsx)(d,{entry:i(e)})},_={},v={parameters:{controls:{disable:!0}},render:()=>(0,h.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,h.jsxs)(`div`,{children:[(0,h.jsx)(f,{children:`Exec — all status labels`}),(0,h.jsx)(m,{children:r.map(e=>(0,h.jsx)(d,{entry:i({toolPreset:`exec`,status:e,withArgs:!0,withOutput:!0})},e))})]})})},y={parameters:{controls:{disable:!0}},render:()=>(0,h.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:r.map(e=>(0,h.jsxs)(`div`,{children:[(0,h.jsxs)(f,{children:[`All tool presets — `,e]}),(0,h.jsx)(m,{children:o.map(t=>(0,h.jsx)(d,{entry:i({toolPreset:t,status:e,withArgs:!1,withOutput:e===`done`})},`${e}-${t}`))})]},e))})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
      <div>\r
        <StorySectionLabel>Exec — all status labels</StorySectionLabel>\r
        <StoryDemoBox>\r
          {STATUS_OPTIONS.map(status => <ToolActivityCard key={status} entry={buildStoryToolEntry({
          toolPreset: 'exec',
          status,
          withArgs: true,
          withOutput: true
        })} />)}\r
        </StoryDemoBox>\r
      </div>\r
    </div>
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
          <StorySectionLabel>All tool presets — {status}</StorySectionLabel>\r
          <StoryDemoBox>\r
            {TOOL_PRESET_OPTIONS.map(toolPreset => <ToolActivityCard key={\`\${status}-\${toolPreset}\`} entry={buildStoryToolEntry({
          toolPreset,
          status,
          withArgs: false,
          withOutput: status === 'done'
        })} />)}\r
          </StoryDemoBox>\r
        </div>)}\r
    </div>
}`,...y.parameters?.docs?.source}}},b=[`Playground`,`AllStatuses`,`AllToolLabels`]}))();export{v as AllStatuses,y as AllToolLabels,_ as Playground,b as __namedExportsOrder,g as default};