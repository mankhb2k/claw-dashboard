import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{f as n,i as r,n as i,o as a,p as o,r as s,s as c,t as l}from"./tool-activity.story-controls-Dagj0gb2.js";import{n as u,t as d}from"./chat-story.decorators-CrgM5Aq5.js";import{n as f,t as p}from"./ChatLiveThread-CmsANcv6.js";var m,h,g,_,v,y;e((()=>{m=t(),f(),d(),c(),h={title:`Chat/ToolActivity/ChatLiveThread`,component:p,tags:[`autodocs`],decorators:[u],parameters:{layout:`fullscreen`},argTypes:{...n,showToolPreparing:{control:`boolean`,description:`Show preparing indicator`},researchPreset:{control:`select`,options:[`single_tool`,...l],description:`Thread mode — single tool card or web research flow`}},args:{...o,showToolPreparing:!1,researchPreset:`single_tool`},render:({toolPreset:e,status:t,withArgs:n,withOutput:i,showToolPreparing:o,researchPreset:s})=>{if(o)return(0,m.jsx)(p,{liveItems:[],showToolPreparing:!0});if(s!==`single_tool`)return(0,m.jsx)(p,{liveItems:r(s).map(e=>({type:`tool`,id:e.id,entry:e}))});let c=a({toolPreset:e,status:t,withArgs:n,withOutput:i});return(0,m.jsx)(p,{liveItems:[{type:`tool`,id:c.id,entry:c}]})}},g={},_={args:{showToolPreparing:!0,researchPreset:`single_tool`}},v={parameters:{controls:{disable:!0}},render:()=>(0,m.jsx)(p,{liveItems:s.flatMap(e=>i.map(t=>{let n=a({toolPreset:e,status:t,withArgs:!1,withOutput:!1});return{type:`tool`,id:`${n.id}-${t}`,entry:{...n,id:`${n.id}-${t}`}}}))})},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    showToolPreparing: true,
    researchPreset: 'single_tool'
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: () => <ChatLiveThread liveItems={TOOL_PRESET_OPTIONS.flatMap(toolPreset => STATUS_OPTIONS.map(status => {
    const entry = buildStoryToolEntry({
      toolPreset,
      status,
      withArgs: false,
      withOutput: false
    });
    return {
      type: 'tool' as const,
      id: \`\${entry.id}-\${status}\`,
      entry: {
        ...entry,
        id: \`\${entry.id}-\${status}\`
      }
    };
  }))} />
}`,...v.parameters?.docs?.source}}},y=[`Playground`,`Preparing`,`AllToolLabels`]}))();export{v as AllToolLabels,g as Playground,_ as Preparing,y as __namedExportsOrder,h as default};