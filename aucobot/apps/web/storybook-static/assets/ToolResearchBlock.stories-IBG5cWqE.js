import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{c as n,i as r,l as i,s as a,t as o}from"./tool-activity.story-controls-Dagj0gb2.js";import{n as s,t as c}from"./chat-story.decorators-CrgM5Aq5.js";import{n as l,t as u}from"./ToolResearchBlock-BIY0pLs2.js";import{n as d,r as f,t as p}from"./story-demo-ui-B-Lf5gz5.js";var m,h,g,_,v;e((()=>{m=t(),l(),c(),f(),a(),h={title:`Chat/ToolActivity/ToolResearchBlock`,component:u,tags:[`autodocs`],decorators:[s],parameters:{layout:`fullscreen`},argTypes:n,args:i,render:({researchPreset:e})=>(0,m.jsx)(u,{entries:r(e)})},g={},_={parameters:{controls:{disable:!0}},render:()=>(0,m.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:o.map(e=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(d,{children:e.replace(/_/g,` `)}),(0,m.jsx)(p,{children:(0,m.jsx)(u,{entries:r(e)})})]},e))})},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
      {RESEARCH_PRESET_OPTIONS.map(researchPreset => <div key={researchPreset}>\r
          <StorySectionLabel>{researchPreset.replace(/_/g, ' ')}</StorySectionLabel>\r
          <StoryDemoBox>\r
            <ToolResearchBlock entries={buildResearchEntries(researchPreset)} />\r
          </StoryDemoBox>\r
        </div>)}\r
    </div>
}`,..._.parameters?.docs?.source}}},v=[`Playground`,`AllResearchPresets`]}))();export{_ as AllResearchPresets,g as Playground,v as __namedExportsOrder,h as default};