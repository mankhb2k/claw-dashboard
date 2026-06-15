import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{M as i,S as a,ft as o,ot as s,t as c}from"./lucide-react-sgqGO4mA.js";import{n as l,t as u}from"./CodeBlock-mOn-B1wo.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T;t((()=>{d=r(),f=e(n()),l(),c(),p=`<script src="https://cdn.example.com/widget.js" data-agent="agent-1"><\/script>`,m={curl:`curl https://api.example.com/v1/chat \\
  -H "Authorization: Bearer sk-..." \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`,node:`import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.API_KEY });
const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});`,python:`from openai import OpenAI

client = OpenAI(api_key="sk-...")
res = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)`},h=[{value:`curl`,label:`cURL`,icon:(0,d.jsx)(a,{size:12,"aria-hidden":!0})},{value:`node`,label:`Node.js`,icon:(0,d.jsx)(o,{size:12,"aria-hidden":!0})},{value:`python`,label:`Python`,icon:(0,d.jsx)(s,{size:12,"aria-hidden":!0})}],g={title:`UI/CodeBlock`,component:u,parameters:{layout:`padded`},tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`default`,`compact`]}}},_=({children:e})=>(0,d.jsx)(`div`,{style:{width:`min(640px, 100%)`,maxWidth:`100%`},children:e}),v={render:()=>(0,d.jsx)(_,{children:(0,d.jsx)(u,{title:`Chat widget script`,icon:(0,d.jsx)(i,{size:16,"aria-hidden":!0}),code:p})})},y={render:function(){let[e,t]=(0,f.useState)(`curl`);return(0,d.jsx)(_,{children:(0,d.jsx)(u,{code:m[e],tabs:h,activeTab:e,onTabChange:t})})}},b={render:function(){let[e,t]=(0,f.useState)(`curl`);return(0,d.jsx)(_,{children:(0,d.jsx)(u,{code:m[e],tabs:h,activeTab:e,onTabChange:t,tabTrailing:`REST API`})})}},x={render:()=>(0,d.jsx)(_,{children:(0,d.jsx)(u,{variant:`compact`,title:`Short snippet`,code:`export const AGENT_ID = "agent-1";`})})},S={render:()=>(0,d.jsx)(_,{children:(0,d.jsx)(u,{title:`Long output`,code:m.node,maxHeight:160})})},C={render:()=>(0,d.jsx)(_,{children:(0,d.jsx)(u,{code:`console.log("plain block");`,showHeader:!1,showCopy:!1})})},w={render:()=>(0,d.jsx)(_,{children:(0,d.jsx)(u,{title:`Read only`,code:p,showCopy:!1})})},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <StoryWrap>\r
      <CodeBlock title="Chat widget script" icon={<Rocket size={16} aria-hidden />} code={SAMPLE_SCRIPT} />\r
    </StoryWrap>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: function WithTabsStory() {
    const [tab, setTab] = useState<"curl" | "node" | "python">("curl");
    return <StoryWrap>\r
        <CodeBlock code={SNIPPETS[tab]} tabs={SNIPPET_TABS} activeTab={tab} onTabChange={setTab} />\r
      </StoryWrap>;
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: function WithTabsTrailingStory() {
    const [tab, setTab] = useState<"curl" | "node" | "python">("curl");
    return <StoryWrap>\r
        <CodeBlock code={SNIPPETS[tab]} tabs={SNIPPET_TABS} activeTab={tab} onTabChange={setTab} tabTrailing="REST API" />\r
      </StoryWrap>;
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <StoryWrap>\r
      <CodeBlock variant="compact" title="Short snippet" code={\`export const AGENT_ID = "agent-1";\`} />\r
    </StoryWrap>
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <StoryWrap>\r
      <CodeBlock title="Long output" code={SNIPPETS.node} maxHeight={160} />\r
    </StoryWrap>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <StoryWrap>\r
      <CodeBlock code={\`console.log("plain block");\`} showHeader={false} showCopy={false} />\r
    </StoryWrap>
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <StoryWrap>\r
      <CodeBlock title="Read only" code={SAMPLE_SCRIPT} showCopy={false} />\r
    </StoryWrap>
}`,...w.parameters?.docs?.source}}},T=[`Default`,`WithTabs`,`WithTabsTrailing`,`Compact`,`Scrollable`,`NoHeader`,`CopyDisabled`]}))();export{x as Compact,w as CopyDisabled,v as Default,C as NoHeader,S as Scrollable,y as WithTabs,b as WithTabsTrailing,T as __namedExportsOrder,g as default};