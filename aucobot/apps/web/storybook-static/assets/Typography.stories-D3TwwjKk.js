import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Typography-COzlN_kt.js";var i,a,o,s,c,l,u,d,f,p,m;e((()=>{i=t(),n(),a={title:`UI/Typography`,component:r,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`h1`,`h2`,`h3`,`h4`,`p`,`small`,`xs`]},color:{control:`select`,options:[`default`,`muted`,`subtle`,`primary`]},weight:{control:`select`,options:[`light`,`regular`,`medium`,`bold`]},italic:{control:`boolean`,description:`Bật chữ nghiêng (font-style: italic)`}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`24px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`},children:e}),c={args:{variant:`p`,children:`The quick brown fox jumps over the lazy dog.`}},l={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Các cấp tiêu đề (Headings)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`h1`,children:`Heading 1 - 32px Bold`}),(0,i.jsx)(r,{variant:`h2`,children:`Heading 2 - 24px Semibold`}),(0,i.jsx)(r,{variant:`h3`,children:`Heading 3 - 18px Semibold`}),(0,i.jsx)(r,{variant:`h4`,children:`Heading 4 - 15px Semibold`})]})]})},u={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Văn bản nội dung (Body)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`p`,children:`Body Text (Default) - 15px. Đây là văn bản mặc định được sử dụng cho phần lớn nội dung trong ứng dụng.`}),(0,i.jsx)(r,{variant:`small`,children:`Small Text - 13px. Thường dùng cho các ghi chú hoặc thông tin phụ.`}),(0,i.jsx)(r,{variant:`xs`,children:`Extra Small Text - 11px. Dùng cho caption, nhãn nhỏ hoặc meta data.`})]})]})},d={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Màu sắc (Colors)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{color:`default`,children:`Default Text Color`}),(0,i.jsx)(r,{color:`muted`,children:`Muted Text Color (var--color-text-muted)`}),(0,i.jsx)(r,{color:`subtle`,children:`Subtle Text Color (var--color-text-subtle)`}),(0,i.jsx)(r,{color:`primary`,children:`Primary Accent Color (var--color-primary)`})]})]})},f={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Chữ nghiêng (italic)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{variant:`p`,children:`Văn bản thường`}),(0,i.jsx)(r,{variant:`p`,italic:!0,children:`Văn bản nghiêng — italic`}),(0,i.jsx)(r,{variant:`small`,color:`muted`,italic:!0,children:`Ghi chú phụ nghiêng`})]})]})},p={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Trọng số chữ (Weights)`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{weight:`light`,children:`Light Weight (300)`}),(0,i.jsx)(r,{weight:`regular`,children:`Regular Weight (400)`}),(0,i.jsx)(r,{weight:`medium`,children:`Medium Weight (500)`}),(0,i.jsx)(r,{weight:`bold`,children:`Bold Weight (700)`})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'p',
    children: 'The quick brown fox jumps over the lazy dog.'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Các cấp tiêu đề (Headings)</DemoLabel>\r
      <DemoBox>\r
        <Typography variant="h1">Heading 1 - 32px Bold</Typography>\r
        <Typography variant="h2">Heading 2 - 24px Semibold</Typography>\r
        <Typography variant="h3">Heading 3 - 18px Semibold</Typography>\r
        <Typography variant="h4">Heading 4 - 15px Semibold</Typography>\r
      </DemoBox>\r
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Văn bản nội dung (Body)</DemoLabel>\r
      <DemoBox>\r
        <Typography variant="p">\r
          Body Text (Default) - 15px. Đây là văn bản mặc định được sử dụng cho phần lớn nội dung trong ứng dụng.\r
        </Typography>\r
        <Typography variant="small">\r
          Small Text - 13px. Thường dùng cho các ghi chú hoặc thông tin phụ.\r
        </Typography>\r
        <Typography variant="xs">\r
          Extra Small Text - 11px. Dùng cho caption, nhãn nhỏ hoặc meta data.\r
        </Typography>\r
      </DemoBox>\r
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Màu sắc (Colors)</DemoLabel>\r
      <DemoBox>\r
        <Typography color="default">Default Text Color</Typography>\r
        <Typography color="muted">Muted Text Color (var--color-text-muted)</Typography>\r
        <Typography color="subtle">Subtle Text Color (var--color-text-subtle)</Typography>\r
        <Typography color="primary">Primary Accent Color (var--color-primary)</Typography>\r
      </DemoBox>\r
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Chữ nghiêng (italic)</DemoLabel>\r
      <DemoBox>\r
        <Typography variant="p">Văn bản thường</Typography>\r
        <Typography variant="p" italic>\r
          Văn bản nghiêng — italic\r
        </Typography>\r
        <Typography variant="small" color="muted" italic>\r
          Ghi chú phụ nghiêng\r
        </Typography>\r
      </DemoBox>\r
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Trọng số chữ (Weights)</DemoLabel>\r
      <DemoBox>\r
        <Typography weight="light">Light Weight (300)</Typography>\r
        <Typography weight="regular">Regular Weight (400)</Typography>\r
        <Typography weight="medium">Medium Weight (500)</Typography>\r
        <Typography weight="bold">Bold Weight (700)</Typography>\r
      </DemoBox>\r
    </div>
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Headings`,`Body`,`Colors`,`Italic`,`Weights`]}))();export{u as Body,d as Colors,c as Default,l as Headings,f as Italic,p as Weights,m as __namedExportsOrder,a as default};