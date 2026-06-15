import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{f as n,i as r,n as i,o as a,p as o,s,t as c}from"./tool-activity.story-controls-Dagj0gb2.js";import{n as l,t as u}from"./ChatMessageBubble-CAZjVjHO.js";import{n as d,t as f}from"./chat-story.decorators-CrgM5Aq5.js";import{n as p,t as m}from"./ToolActivityCard-CM9nWIUJ.js";import{n as h,t as g}from"./ChatLiveThread-CmsANcv6.js";import{n as _,r as v}from"./story-demo-ui-B-Lf5gz5.js";var y,b,x,S,C;e((()=>{y=t(),h(),l(),p(),f(),v(),s(),b={title:`Chat/ContentArea`,tags:[`autodocs`],decorators:[d],parameters:{layout:`fullscreen`},argTypes:{scenario:{control:`select`,options:[`tool_flow`,`tool_error`,`research`,`preparing`],description:`Thread scenario preset`},researchPreset:{control:`select`,options:[...c]},...n},args:{...o,scenario:`tool_flow`,researchPreset:`full_flow`},render:({scenario:e,researchPreset:t,toolPreset:n,status:i,withArgs:o,withOutput:s})=>{if(e===`preparing`)return(0,y.jsx)(g,{liveItems:[],showToolPreparing:!0});if(e===`research`){let e=r(t);return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(u,{role:`user`,text:`Search OpenClaw docs for tool events.`}),(0,y.jsx)(g,{liveItems:e.map(e=>({type:`tool`,id:e.id,entry:e}))})]})}if(e===`tool_error`){let e=a({toolPreset:`exec`,status:`error`,withArgs:!0,withOutput:!1});return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(u,{role:`user`,text:`Delete the entire workspace folder.`}),(0,y.jsx)(u,{role:`assistant`,text:`Let me try that in the sandbox.`}),(0,y.jsx)(m,{entry:e})]})}let c=a({toolPreset:n,status:`running`,withArgs:o,withOutput:!1}),l=a({toolPreset:n,status:`done`,withArgs:o,withOutput:s});return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(u,{role:`user`,text:`Run tests and read the chat config file.`}),(0,y.jsx)(u,{role:`assistant`,text:`Running the test command, then reading the file.`}),(0,y.jsx)(m,{entry:i===`running`?c:l}),i===`done`?(0,y.jsx)(u,{role:`assistant`,text:`All done — tests passed.`}):null]})}},x={},S={parameters:{controls:{disable:!0}},render:()=>(0,y.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:i.map(e=>(0,y.jsxs)(`div`,{children:[(0,y.jsxs)(_,{children:[`ContentArea — `,e]}),(0,y.jsx)(m,{entry:a({toolPreset:`exec`,status:e,withArgs:!0,withOutput:e===`done`})})]},e))})},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
          <StorySectionLabel>ContentArea — {status}</StorySectionLabel>\r
          <ToolActivityCard entry={buildStoryToolEntry({
        toolPreset: 'exec',
        status,
        withArgs: true,
        withOutput: status === 'done'
      })} />\r
        </div>)}\r
    </div>
}`,...S.parameters?.docs?.source}}},C=[`Playground`,`AllStatusLabels`]}))();export{S as AllStatusLabels,x as Playground,C as __namedExportsOrder,b as default};