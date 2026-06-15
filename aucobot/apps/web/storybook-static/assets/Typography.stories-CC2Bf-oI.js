import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Typography-BLpjlWB_.js";var i,a,o,s,c,l,u,d,f,p,m;e((()=>{i=t(),n(),a={title:`UI/Typography`,component:r,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`h1`,`h2`,`h3`,`h4`,`p`,`small`,`xs`]},color:{control:`select`,options:[`default`,`muted`,`subtle`,`primary`]},weight:{control:`select`,options:[`extralight`,`light`,`regular`,`medium`,`semibold`,`bold`]},italic:{control:`boolean`,description:`Enable italic (font-style: italic)`}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`24px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{variant:`p`,children:`The quick brown fox jumps over the lazy dog.`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Headings`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`h1`,children:`Heading 1 - 32px Bold`}),(0,i.jsx)(r,{variant:`h2`,children:`Heading 2 - 24px Semibold`}),(0,i.jsx)(r,{variant:`h3`,children:`Heading 3 - 18px Semibold`}),(0,i.jsx)(r,{variant:`h4`,children:`Heading 4 - 15px Semibold`})]})]})},u={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Body text`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`p`,children:`Body Text (Default) - 15px. Default text used for most application content.`}),(0,i.jsx)(r,{variant:`small`,children:`Small Text - 13px. Often used for notes or secondary information.`}),(0,i.jsx)(r,{variant:`xs`,children:`Extra Small Text - 11px. Used for captions, small labels, or metadata.`})]})]})},d={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Colors`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{color:`default`,children:`Default Text Color`}),(0,i.jsx)(r,{color:`muted`,children:`Muted Text Color (var(--color-muted-foreground))`}),(0,i.jsx)(r,{color:`subtle`,children:`Subtle Text Color (var(--color-muted-foreground))`}),(0,i.jsx)(r,{color:`primary`,children:`Primary Accent Color (var(--color-primary))`})]})]})},f={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Italic`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`p`,children:`Regular text`}),(0,i.jsx)(r,{variant:`p`,italic:!0,children:`Italic text`}),(0,i.jsx)(r,{variant:`small`,color:`muted`,italic:!0,children:`Muted italic note`})]})]})},p={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Font weights`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{weight:`extralight`,children:`Extralight (200)`}),(0,i.jsx)(r,{weight:`light`,children:`Light (300)`}),(0,i.jsx)(r,{weight:`regular`,children:`Regular (400)`}),(0,i.jsx)(r,{weight:`medium`,children:`Medium (500)`}),(0,i.jsx)(r,{weight:`semibold`,children:`Semibold (600)`}),(0,i.jsx)(r,{weight:`bold`,children:`Bold (700)`})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'p',
    children: 'The quick brown fox jumps over the lazy dog.'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Headings</DemoLabel>\r
      <DemoBox>\r
        <Typography variant="h1">Heading 1 - 32px Bold</Typography>\r
        <Typography variant="h2">Heading 2 - 24px Semibold</Typography>\r
        <Typography variant="h3">Heading 3 - 18px Semibold</Typography>\r
        <Typography variant="h4">Heading 4 - 15px Semibold</Typography>\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Body text</DemoLabel>\r
      <DemoBox>\r
        <Typography variant="p">\r
          Body Text (Default) - 15px. Default text used for most application content.\r
        </Typography>\r
        <Typography variant="small">\r
          Small Text - 13px. Often used for notes or secondary information.\r
        </Typography>\r
        <Typography variant="xs">\r
          Extra Small Text - 11px. Used for captions, small labels, or metadata.\r
        </Typography>\r
      </DemoBox>\r
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Colors</DemoLabel>\r
      <DemoBox>\r
        <Typography color="default">Default Text Color</Typography>\r
        <Typography color="muted">Muted Text Color (var(--color-muted-foreground))</Typography>\r
        <Typography color="subtle">Subtle Text Color (var(--color-muted-foreground))</Typography>\r
        <Typography color="primary">Primary Accent Color (var(--color-primary))</Typography>\r
      </DemoBox>\r
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Italic</DemoLabel>\r
      <DemoBox>\r
        <Typography variant="p">Regular text</Typography>\r
        <Typography variant="p" italic>\r
          Italic text\r
        </Typography>\r
        <Typography variant="small" color="muted" italic>\r
          Muted italic note\r
        </Typography>\r
      </DemoBox>\r
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Font weights</DemoLabel>\r
      <DemoBox>\r
        <Typography weight="extralight">Extralight (200)</Typography>\r
        <Typography weight="light">Light (300)</Typography>\r
        <Typography weight="regular">Regular (400)</Typography>\r
        <Typography weight="medium">Medium (500)</Typography>\r
        <Typography weight="semibold">Semibold (600)</Typography>\r
        <Typography weight="bold">Bold (700)</Typography>\r
      </DemoBox>\r
    </div>
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Headings`,`Body`,`Colors`,`Italic`,`Weights`]}))();export{u as Body,d as Colors,c as Default,l as Headings,f as Italic,p as Weights,m as __namedExportsOrder,a as default};