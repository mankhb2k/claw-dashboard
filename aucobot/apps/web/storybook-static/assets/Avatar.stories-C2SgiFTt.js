import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Avatar-WyzLESyd.js";var i,a,o,s,c,l,u,d,f;e((()=>{i=t(),n(),a={title:`UI/Avatar`,component:r,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`,`lg`,`xl`]},variant:{control:`select`,options:[`circle`,`square`]}}},o=({children:e})=>(0,i.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),s=({children:e})=>(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),c={args:{src:`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,alt:`User Avatar`,size:`md`,variant:`circle`}},l={args:{fallback:`JD`,size:`md`,variant:`circle`}},u={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Display sizes`}),(0,i.jsxs)(s,{children:[(0,i.jsx)(r,{size:`sm`,src:`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128`,fallback:`S`}),(0,i.jsx)(r,{size:`md`,src:`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256`,fallback:`M`}),(0,i.jsx)(r,{size:`lg`,src:`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256`,fallback:`L`}),(0,i.jsx)(r,{size:`xl`,src:`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256`,fallback:`X`})]})]})},d={render:()=>(0,i.jsxs)(`div`,{children:[(0,i.jsx)(o,{children:`Variants`}),(0,i.jsxs)(s,{children:[(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,alignItems:`center`,gap:`8px`},children:[(0,i.jsx)(r,{variant:`circle`,size:`lg`,src:`https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256`}),(0,i.jsx)(`span`,{style:{fontSize:`12px`},children:`Circle`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,alignItems:`center`,gap:`8px`},children:[(0,i.jsx)(r,{variant:`square`,size:`lg`,src:`https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256`}),(0,i.jsx)(`span`,{style:{fontSize:`12px`},children:`Square`})]})]})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    alt: 'User Avatar',
    size: 'md',
    variant: 'circle'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    fallback: 'JD',
    size: 'md',
    variant: 'circle'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Display sizes</DemoLabel>\r
      <DemoBox>\r
        <Avatar size="sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128" fallback="S" />\r
        <Avatar size="md" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256" fallback="M" />\r
        <Avatar size="lg" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256" fallback="L" />\r
        <Avatar size="xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256" fallback="X" />\r
      </DemoBox>\r
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Variants</DemoLabel>\r
      <DemoBox>\r
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>\r
          <Avatar variant="circle" size="lg" src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256" />\r
          <span style={{
          fontSize: '12px'
        }}>Circle</span>\r
        </div>\r
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>\r
          <Avatar variant="square" size="lg" src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256" />\r
          <span style={{
          fontSize: '12px'
        }}>Square</span>\r
        </div>\r
      </DemoBox>\r
    </div>
}`,...d.parameters?.docs?.source}}},f=[`Default`,`Fallback`,`Sizes`,`Variants`]}))();export{c as Default,l as Fallback,u as Sizes,d as Variants,f as __namedExportsOrder,a as default};