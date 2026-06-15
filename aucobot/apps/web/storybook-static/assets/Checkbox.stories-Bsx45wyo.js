import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{n as i,t as a}from"./Checkbox-DcM79f7Y.js";var o,s,c,l,u,d,f,p,m,h,g;t((()=>{o=r(),s=e(n()),i(),c={title:`UI/Checkbox`,component:a,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`,`lg`],description:`Checkbox and label size`},label:{control:`text`,description:`Label shown beside the checkbox`},disabled:{control:`boolean`,description:`Disable interaction`},defaultChecked:{control:`boolean`,description:`Default checked state (uncontrolled)`},checked:{control:`boolean`,description:`Checked state (controlled — used in stateful demos)`}},args:{id:`checkbox-demo`,label:`Accept terms of service`,size:`md`,disabled:!1,defaultChecked:!1}},l=({children:e})=>(0,o.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),u=({children:e})=>(0,o.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`24px`,minWidth:`240px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),d={},f={render:e=>(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:[(0,o.jsxs)(`div`,{children:[(0,o.jsx)(l,{children:`Small (sm)`}),(0,o.jsx)(u,{children:(0,o.jsx)(a,{...e,id:`checkbox-sm`,size:`sm`,label:`Small checkbox`})})]}),(0,o.jsxs)(`div`,{children:[(0,o.jsx)(l,{children:`Medium (md) — default`}),(0,o.jsx)(u,{children:(0,o.jsx)(a,{...e,id:`checkbox-md`,size:`md`,label:`Medium checkbox`})})]}),(0,o.jsxs)(`div`,{children:[(0,o.jsx)(l,{children:`Large (lg)`}),(0,o.jsx)(u,{children:(0,o.jsx)(a,{...e,id:`checkbox-lg`,size:`lg`,label:`Large checkbox`})})]})]}),args:{defaultChecked:!0}},p={render:()=>(0,o.jsxs)(`div`,{children:[(0,o.jsx)(l,{children:`Checkbox states`}),(0,o.jsxs)(u,{children:[(0,o.jsx)(a,{id:`unselected`,label:`Unchecked`}),(0,o.jsx)(a,{id:`selected`,label:`Checked`,defaultChecked:!0}),(0,o.jsx)(a,{id:`disabled`,label:`Disabled`,disabled:!0}),(0,o.jsx)(a,{id:`disabled-checked`,label:`Disabled (checked)`,disabled:!0,defaultChecked:!0})]})]})},m={args:{label:void 0,"aria-label":`Toggle option`}},h={render:function(){let[e,t]=s.useState(!1);return(0,o.jsx)(u,{children:(0,o.jsx)(a,{id:`controlled`,label:e?`Enabled`:`Disabled`,checked:e,onCheckedChange:e=>t(e===!0)})})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>\r
      <div>\r
        <DemoLabel>Small (sm)</DemoLabel>\r
        <DemoBox>\r
          <Checkbox {...args} id="checkbox-sm" size="sm" label="Small checkbox" />\r
        </DemoBox>\r
      </div>\r
      <div>\r
        <DemoLabel>Medium (md) — default</DemoLabel>\r
        <DemoBox>\r
          <Checkbox {...args} id="checkbox-md" size="md" label="Medium checkbox" />\r
        </DemoBox>\r
      </div>\r
      <div>\r
        <DemoLabel>Large (lg)</DemoLabel>\r
        <DemoBox>\r
          <Checkbox {...args} id="checkbox-lg" size="lg" label="Large checkbox" />\r
        </DemoBox>\r
      </div>\r
    </div>,
  args: {
    defaultChecked: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Checkbox states</DemoLabel>\r
      <DemoBox>\r
        <Checkbox id="unselected" label="Unchecked" />\r
        <Checkbox id="selected" label="Checked" defaultChecked />\r
        <Checkbox id="disabled" label="Disabled" disabled />\r
        <Checkbox id="disabled-checked" label="Disabled (checked)" disabled defaultChecked />\r
      </DemoBox>\r
    </div>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    label: undefined,
    'aria-label': 'Toggle option'
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: function ControlledCheckbox() {
    const [checked, setChecked] = React.useState(false);
    return <DemoBox>\r
        <Checkbox id="controlled" label={checked ? 'Enabled' : 'Disabled'} checked={checked} onCheckedChange={value => setChecked(value === true)} />\r
      </DemoBox>;
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Sizes`,`States`,`WithoutLabel`,`Controlled`]}))();export{h as Controlled,d as Default,f as Sizes,p as States,m as WithoutLabel,g as __namedExportsOrder,c as default};