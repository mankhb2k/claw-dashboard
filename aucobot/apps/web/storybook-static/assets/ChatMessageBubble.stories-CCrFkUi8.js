import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./ChatMessageBubble-CAZjVjHO.js";import{n as i,t as a}from"./chat-story.decorators-CrgM5Aq5.js";var o,s,c,l,u,d,f,p;e((()=>{o=t(),n(),a(),s={title:`Chat/Message/ChatMessageBubble`,component:r,tags:[`autodocs`],decorators:[i],parameters:{layout:`fullscreen`},argTypes:{role:{control:`select`,options:[`user`,`assistant`]},text:{control:`text`},streaming:{control:`boolean`}},args:{role:`user`,text:`Explain tool events in the OpenClaw gateway.`,streaming:!1},render:e=>(0,o.jsx)(r,{...e})},c={},l={args:{role:`user`,text:`Explain tool events in the OpenClaw gateway.`}},u={args:{role:`assistant`,text:`The gateway sends \`agent\` and \`session.tool\` events over WebSocket.

- **running** — tool is executing
- **done** — completed
- **error** — failed

See [docs](https://docs.openclaw.dev/chat) for more.`}},d={args:{role:`assistant`,text:`Analyzing search results`,streaming:!0}},f={parameters:{controls:{disable:!0}},render:()=>(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(r,{role:`user`,text:`Run ls in the workspace and summarize the output.`}),(0,o.jsx)(r,{role:`assistant`,text:"I will run `ls` and read the output."}),(0,o.jsx)(r,{role:`assistant`,text:"Output:\n\n```\npackage.json\nsrc/\n```"})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    role: 'user',
    text: 'Explain tool events in the OpenClaw gateway.'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    role: 'assistant',
    text: \`The gateway sends \\\`agent\\\` and \\\`session.tool\\\` events over WebSocket.

- **running** — tool is executing
- **done** — completed
- **error** — failed

See [docs](https://docs.openclaw.dev/chat) for more.\`
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    role: 'assistant',
    text: 'Analyzing search results',
    streaming: true
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: () => <>\r
      <ChatMessageBubble role="user" text="Run ls in the workspace and summarize the output." />\r
      <ChatMessageBubble role="assistant" text="I will run \`ls\` and read the output." />\r
      <ChatMessageBubble role="assistant" text={\`Output:\\n\\n\\\`\\\`\\\`\\npackage.json\\nsrc/\\n\\\`\\\`\\\`\`} />\r
    </>
}`,...f.parameters?.docs?.source}}},p=[`Playground`,`UserMessage`,`AssistantMarkdown`,`AssistantStreaming`,`Conversation`]}))();export{u as AssistantMarkdown,d as AssistantStreaming,f as Conversation,c as Playground,l as UserMessage,p as __namedExportsOrder,s as default};