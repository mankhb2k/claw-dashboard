import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{I as n,P as r,c as i,f as a,it as o,m as s,t as c,u as l}from"./lucide-react-BKuYmqPY.js";import{n as u,r as d,t as f}from"./ToggleGroup-BXvubw3B.js";var p,m,h,g,_,v,y,b,x,S;e((()=>{p=t(),d(),c(),m={title:`UI/ToggleGroup`,component:f,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{type:{control:`radio`,options:[`single`,`multiple`],description:`Single or multiple selection mode`},disabled:{control:`boolean`,description:`Disable the entire group`},orientation:{control:`radio`,options:[`horizontal`,`vertical`],description:`Group layout direction`},size:{control:`select`,options:[`sm`,`md`,`lg`],description:`Button group size`}}},h=({children:e})=>(0,p.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),g=({children:e})=>(0,p.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,flexWrap:`wrap`},children:e}),_={args:{type:`single`,defaultValue:`bold`},render:e=>(0,p.jsxs)(f,{...e,children:[(0,p.jsx)(u,{value:`bold`,"aria-label":`Bold`,children:(0,p.jsx)(o,{size:16})}),(0,p.jsx)(u,{value:`italic`,"aria-label":`Italic`,children:(0,p.jsx)(r,{size:16})}),(0,p.jsx)(u,{value:`underline`,"aria-label":`Underline`,children:(0,p.jsx)(i,{size:16})})]})},v={render:()=>(0,p.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:[(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Text formatting (single select)`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,defaultValue:`bold`,children:[(0,p.jsx)(u,{value:`bold`,"aria-label":`Bold`,children:(0,p.jsx)(o,{size:16})}),(0,p.jsx)(u,{value:`italic`,"aria-label":`Italic`,children:(0,p.jsx)(r,{size:16})}),(0,p.jsx)(u,{value:`underline`,"aria-label":`Underline`,children:(0,p.jsx)(i,{size:16})})]})})]}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Alignment (single select)`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,defaultValue:`left`,children:[(0,p.jsx)(u,{value:`left`,"aria-label":`Align Left`,children:(0,p.jsx)(l,{size:16})}),(0,p.jsx)(u,{value:`center`,"aria-label":`Align Center`,children:(0,p.jsx)(a,{size:16})}),(0,p.jsx)(u,{value:`right`,"aria-label":`Align Right`,children:(0,p.jsx)(s,{size:16})})]})})]}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Multiple select`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`multiple`,defaultValue:[`bold`,`italic`],children:[(0,p.jsx)(u,{value:`bold`,"aria-label":`Bold`,children:(0,p.jsx)(o,{size:16})}),(0,p.jsx)(u,{value:`italic`,"aria-label":`Italic`,children:(0,p.jsx)(r,{size:16})}),(0,p.jsx)(u,{value:`underline`,"aria-label":`Underline`,children:(0,p.jsx)(i,{size:16})})]})})]})]})},y={render:()=>(0,p.jsxs)(`div`,{style:{display:`flex`,gap:`48px`},children:[(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Horizontal (default)`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,orientation:`horizontal`,defaultValue:`left`,children:[(0,p.jsx)(u,{value:`left`,children:(0,p.jsx)(l,{size:16})}),(0,p.jsx)(u,{value:`center`,children:(0,p.jsx)(a,{size:16})}),(0,p.jsx)(u,{value:`right`,children:(0,p.jsx)(s,{size:16})})]})})]}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Vertical`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,orientation:`vertical`,defaultValue:`left`,children:[(0,p.jsx)(u,{value:`left`,children:(0,p.jsx)(l,{size:16})}),(0,p.jsx)(u,{value:`center`,children:(0,p.jsx)(a,{size:16})}),(0,p.jsx)(u,{value:`right`,children:(0,p.jsx)(s,{size:16})})]})})]})]})},b={render:()=>(0,p.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Small (28px) — headers, compact toolbars`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,size:`sm`,defaultValue:`editor`,children:[(0,p.jsxs)(u,{value:`editor`,style:{gap:`4px`},children:[(0,p.jsx)(o,{size:13}),(0,p.jsx)(`span`,{children:`Editor`})]}),(0,p.jsxs)(u,{value:`markdown`,style:{gap:`4px`},children:[(0,p.jsx)(n,{size:13}),(0,p.jsx)(`span`,{children:`Markdown`})]})]})})]}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Medium (32px) — default`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,size:`md`,defaultValue:`bold`,children:[(0,p.jsx)(u,{value:`bold`,children:(0,p.jsx)(o,{size:16})}),(0,p.jsx)(u,{value:`italic`,children:(0,p.jsx)(r,{size:16})}),(0,p.jsx)(u,{value:`underline`,children:(0,p.jsx)(i,{size:16})})]})})]}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Large (40px) — spacious primary areas`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,size:`lg`,defaultValue:`left`,children:[(0,p.jsxs)(u,{value:`left`,style:{gap:`8px`},children:[(0,p.jsx)(l,{size:18}),(0,p.jsx)(`span`,{children:`Align Left`})]}),(0,p.jsxs)(u,{value:`center`,style:{gap:`8px`},children:[(0,p.jsx)(a,{size:18}),(0,p.jsx)(`span`,{children:`Align Center`})]}),(0,p.jsxs)(u,{value:`right`,style:{gap:`8px`},children:[(0,p.jsx)(s,{size:18}),(0,p.jsx)(`span`,{children:`Align Right`})]})]})})]})]})},x={render:()=>(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Disabled`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{type:`single`,disabled:!0,defaultValue:`bold`,children:[(0,p.jsx)(u,{value:`bold`,children:(0,p.jsx)(o,{size:16})}),(0,p.jsx)(u,{value:`italic`,children:(0,p.jsx)(r,{size:16})}),(0,p.jsx)(u,{value:`underline`,children:(0,p.jsx)(i,{size:16})})]})})]})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'single',
    defaultValue: 'bold'
  },
  render: args => <ToggleGroup {...args}>\r
      <ToggleGroupItem value="bold" aria-label="Bold">\r
        <Bold size={16} />\r
      </ToggleGroupItem>\r
      <ToggleGroupItem value="italic" aria-label="Italic">\r
        <Italic size={16} />\r
      </ToggleGroupItem>\r
      <ToggleGroupItem value="underline" aria-label="Underline">\r
        <Underline size={16} />\r
      </ToggleGroupItem>\r
    </ToggleGroup>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Text formatting (single select)</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" defaultValue="bold">\r
            <ToggleGroupItem value="bold" aria-label="Bold">\r
              <Bold size={16} />\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="italic" aria-label="Italic">\r
              <Italic size={16} />\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="underline" aria-label="Underline">\r
              <Underline size={16} />\r
            </ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Alignment (single select)</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" defaultValue="left">\r
            <ToggleGroupItem value="left" aria-label="Align Left">\r
              <AlignLeft size={16} />\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="center" aria-label="Align Center">\r
              <AlignCenter size={16} />\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="right" aria-label="Align Right">\r
              <AlignRight size={16} />\r
            </ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Multiple select</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="multiple" defaultValue={['bold', 'italic']}>\r
            <ToggleGroupItem value="bold" aria-label="Bold">\r
              <Bold size={16} />\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="italic" aria-label="Italic">\r
              <Italic size={16} />\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="underline" aria-label="Underline">\r
              <Underline size={16} />\r
            </ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '48px'
  }}>\r
      <div>\r
        <DemoLabel>Horizontal (default)</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" orientation="horizontal" defaultValue="left">\r
            <ToggleGroupItem value="left"><AlignLeft size={16} /></ToggleGroupItem>\r
            <ToggleGroupItem value="center"><AlignCenter size={16} /></ToggleGroupItem>\r
            <ToggleGroupItem value="right"><AlignRight size={16} /></ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Vertical</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" orientation="vertical" defaultValue="left">\r
            <ToggleGroupItem value="left"><AlignLeft size={16} /></ToggleGroupItem>\r
            <ToggleGroupItem value="center"><AlignCenter size={16} /></ToggleGroupItem>\r
            <ToggleGroupItem value="right"><AlignRight size={16} /></ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Small (28px) — headers, compact toolbars</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" size="sm" defaultValue="editor">\r
            <ToggleGroupItem value="editor" style={{
            gap: '4px'
          }}>\r
              <Bold size={13} />\r
              <span>Editor</span>\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="markdown" style={{
            gap: '4px'
          }}>\r
              <FileText size={13} />\r
              <span>Markdown</span>\r
            </ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Medium (32px) — default</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" size="md" defaultValue="bold">\r
            <ToggleGroupItem value="bold"><Bold size={16} /></ToggleGroupItem>\r
            <ToggleGroupItem value="italic"><Italic size={16} /></ToggleGroupItem>\r
            <ToggleGroupItem value="underline"><Underline size={16} /></ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Large (40px) — spacious primary areas</DemoLabel>\r
        <DemoBox>\r
          <ToggleGroup type="single" size="lg" defaultValue="left">\r
            <ToggleGroupItem value="left" style={{
            gap: '8px'
          }}>\r
              <AlignLeft size={18} />\r
              <span>Align Left</span>\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="center" style={{
            gap: '8px'
          }}>\r
              <AlignCenter size={18} />\r
              <span>Align Center</span>\r
            </ToggleGroupItem>\r
            <ToggleGroupItem value="right" style={{
            gap: '8px'
          }}>\r
              <AlignRight size={18} />\r
              <span>Align Right</span>\r
            </ToggleGroupItem>\r
          </ToggleGroup>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Disabled</DemoLabel>\r
      <DemoBox>\r
        <ToggleGroup type="single" disabled defaultValue="bold">\r
          <ToggleGroupItem value="bold"><Bold size={16} /></ToggleGroupItem>\r
          <ToggleGroupItem value="italic"><Italic size={16} /></ToggleGroupItem>\r
          <ToggleGroupItem value="underline"><Underline size={16} /></ToggleGroupItem>\r
        </ToggleGroup>\r
      </DemoBox>\r
    </div>
}`,...x.parameters?.docs?.source}}},S=[`Default`,`Variants`,`Orientations`,`Sizes`,`States`]}))();export{_ as Default,y as Orientations,b as Sizes,x as States,v as Variants,S as __namedExportsOrder,m as default};