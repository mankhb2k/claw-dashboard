import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{Et as i,K as a,O as o,X as s,i as c,it as l,m as u,t as d}from"./lucide-react-sgqGO4mA.js";import{n as f,t as p}from"./Button-dxUFHqWY.js";import{n as m,t as h}from"./ButtonGroup-CAASSMOt.js";function g({items:e,defaultValue:t,size:n=`sm`,inactiveVariant:r=`outline`,disabled:i=!1,wrap:a=!1,className:o}){let[s,c]=(0,v.useState)(t);return(0,_.jsx)(h,{className:o,style:a?{flexWrap:`wrap`,maxWidth:320}:void 0,children:e.map(e=>(0,_.jsxs)(p,{type:`button`,size:n,variant:r,disabled:i,"aria-pressed":s===e.value,style:e.icon?S:void 0,onClick:()=>c(e.value),children:[e.icon,e.label]},e.value))})}var _,v,y,b,x,S,C,w,T,E,D,O,k,A;t((()=>{_=r(),v=e(n()),d(),m(),f(),y={title:`UI/ButtonGroup`,component:h,parameters:{layout:`centered`,docs:{description:{component:"Visual container that merges adjacent `Button` borders and radii. Selection state, variants, and sizes are controlled on each `Button` child — not on `ButtonGroup` itself."}}},tags:[`autodocs`],argTypes:{buttonSize:{control:`select`,options:[`xs`,`sm`,`md`,`lg`],description:`Size passed to each Button in the interactive playground`,table:{category:`Button children`}},inactiveVariant:{control:`select`,options:[`outline`,`ghost`,`secondary`,`primary`],description:`Variant for unselected segmented-control items`,table:{category:`Button children`}},activeVariant:{control:`select`,options:[`secondary`,`primary`,`outline`,`ghost`],description:`Deprecated — active state uses aria-pressed with the same outline variant`,table:{category:`Button children`}},disabled:{control:`boolean`,description:`Disable every button in the playground group`,table:{category:`Button children`}},wrap:{control:`boolean`,description:`Apply flex-wrap so long label groups can break lines`,table:{category:`Layout`}},className:{control:`text`,description:`Optional className on ButtonGroup root`,table:{category:`Layout`}}},args:{buttonSize:`sm`,inactiveVariant:`outline`,disabled:!1,wrap:!1}},b=({children:e})=>(0,_.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),x=({children:e})=>(0,_.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,flexWrap:`wrap`},children:e}),S={gap:`var(--space-2)`},C={render:({buttonSize:e,inactiveVariant:t,disabled:n,wrap:r,className:i})=>(0,_.jsx)(g,{items:[{value:`month`,label:`Month`},{value:`quarter`,label:`Quarter`},{value:`year`,label:`Year`}],defaultValue:`month`,size:e,inactiveVariant:t,disabled:n,wrap:r,className:i})},w={parameters:{docs:{description:{story:"Single-select tabs using `aria-pressed` and variant swap. Used in agent instructions (Editor / Markdown) and section pickers."}}},render:()=>(0,_.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Mode switch (CardInstructions header)`}),(0,_.jsx)(x,{children:(0,_.jsx)(g,{items:[{value:`simple`,label:`Editor`,icon:(0,_.jsx)(s,{size:14,"aria-hidden":!0})},{value:`advanced`,label:`Markdown`,icon:(0,_.jsx)(l,{size:14,"aria-hidden":!0})}],defaultValue:`simple`})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Instruction sections (CardInstructions body)`}),(0,_.jsx)(x,{children:(0,_.jsx)(g,{items:[{value:`rules`,label:`Rules`,icon:(0,_.jsx)(a,{size:14,"aria-hidden":!0})},{value:`constraints`,label:`Constraints`,icon:(0,_.jsx)(o,{size:14,"aria-hidden":!0})},{value:`output`,label:`Output format`,icon:(0,_.jsx)(u,{size:14,"aria-hidden":!0})},{value:`tools`,label:`Tool notes`,icon:(0,_.jsx)(c,{size:14,"aria-hidden":!0})}],defaultValue:`rules`,wrap:!0})})]})]})},T={render:()=>(0,_.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Outline group — filters / period pickers`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Day`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Week`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,"aria-pressed":!0,children:`Month`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Year`})]})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Primary split action — main CTA + menu affordance`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`primary`,size:`sm`,children:`Save changes`}),(0,_.jsx)(p,{variant:`primary`,size:`sm`,"aria-label":`More save options`,style:{paddingLeft:8,paddingRight:8},children:(0,_.jsx)(i,{size:16,"aria-hidden":!0})})]})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Ghost toolbar — low-emphasis grouped actions`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`ghost`,size:`sm`,children:`Copy`}),(0,_.jsx)(p,{variant:`ghost`,size:`sm`,children:`Duplicate`}),(0,_.jsx)(p,{variant:`ghost`,size:`sm`,children:`Delete`})]})})]})]})},E={render:()=>(0,_.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Small — compact headers & forms`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`outline`,size:`sm`,"aria-pressed":!0,children:`Active`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Option B`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Option C`})]})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Default — standard density`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`outline`,size:`md`,"aria-pressed":!0,children:`Active`}),(0,_.jsx)(p,{variant:`outline`,size:`md`,children:`Option B`}),(0,_.jsx)(p,{variant:`outline`,size:`md`,children:`Option C`})]})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Large — spacious primary areas`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`outline`,size:`lg`,"aria-pressed":!0,children:`Active`}),(0,_.jsx)(p,{variant:`outline`,size:`lg`,children:`Option B`})]})})]})]})},D={render:()=>(0,_.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Entire group disabled`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`outline`,size:`sm`,disabled:!0,children:`Month`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,disabled:!0,children:`Quarter`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,disabled:!0,children:`Year`})]})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Single disabled item in group`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`outline`,size:`sm`,"aria-pressed":!0,children:`Enabled`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,disabled:!0,children:`Locked`}),(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Enabled`})]})})]}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(b,{children:`Loading action in split button`}),(0,_.jsx)(x,{children:(0,_.jsxs)(h,{children:[(0,_.jsx)(p,{variant:`primary`,size:`sm`,loading:!0,children:`Saving…`}),(0,_.jsx)(p,{variant:`primary`,size:`sm`,disabled:!0,"aria-label":`More options`,children:(0,_.jsx)(i,{size:16,"aria-hidden":!0})})]})})]})]})},O={parameters:{docs:{description:{story:"Apply `flex-wrap` on `ButtonGroup` when labels are long or the panel is narrow. Border overlap still works per row; test in agent editor with preview closed."}}},render:()=>(0,_.jsxs)(`div`,{style:{width:360},children:[(0,_.jsx)(b,{children:`Narrow container (360px)`}),(0,_.jsx)(x,{children:(0,_.jsx)(g,{items:[{value:`rules`,label:`Rules`,icon:(0,_.jsx)(a,{size:14,"aria-hidden":!0})},{value:`constraints`,label:`Constraints`,icon:(0,_.jsx)(o,{size:14,"aria-hidden":!0})},{value:`output`,label:`Output format`,icon:(0,_.jsx)(u,{size:14,"aria-hidden":!0})},{value:`tools`,label:`Tool notes`,icon:(0,_.jsx)(c,{size:14,"aria-hidden":!0})}],defaultValue:`rules`,wrap:!0})})]})},k={parameters:{docs:{description:{story:`One child keeps full border radius — useful when the group may grow later.`}}},render:()=>(0,_.jsx)(x,{children:(0,_.jsx)(h,{children:(0,_.jsx)(p,{variant:`outline`,size:`sm`,children:`Only button`})})})},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: ({
    buttonSize,
    inactiveVariant,
    disabled,
    wrap,
    className
  }) => <SegmentedButtons items={[{
    value: 'month',
    label: 'Month'
  }, {
    value: 'quarter',
    label: 'Quarter'
  }, {
    value: 'year',
    label: 'Year'
  }]} defaultValue="month" size={buttonSize} inactiveVariant={inactiveVariant} disabled={disabled} wrap={wrap} className={className} />
}`,...C.parameters?.docs?.source},description:{story:`Interactive playground — args control child Button props`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Single-select tabs using \`aria-pressed\` and variant swap. ' + 'Used in agent instructions (Editor / Markdown) and section pickers.'
      }
    }
  },
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Mode switch (CardInstructions header)</DemoLabel>\r
        <DemoBox>\r
          <SegmentedButtons items={[{
          value: 'simple',
          label: 'Editor',
          icon: <LayoutList size={14} aria-hidden />
        }, {
          value: 'advanced',
          label: 'Markdown',
          icon: <FileText size={14} aria-hidden />
        }]} defaultValue="simple" />\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Instruction sections (CardInstructions body)</DemoLabel>\r
        <DemoBox>\r
          <SegmentedButtons items={[{
          value: 'rules',
          label: 'Rules',
          icon: <ListChecks size={14} aria-hidden />
        }, {
          value: 'constraints',
          label: 'Constraints',
          icon: <ShieldAlert size={14} aria-hidden />
        }, {
          value: 'output',
          label: 'Output format',
          icon: <TextQuote size={14} aria-hidden />
        }, {
          value: 'tools',
          label: 'Tool notes',
          icon: <Wrench size={14} aria-hidden />
        }]} defaultValue="rules" wrap />\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Outline group — filters / period pickers</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="outline" size="sm">\r
              Day\r
            </Button>\r
            <Button variant="outline" size="sm">\r
              Week\r
            </Button>\r
            <Button variant="outline" size="sm" aria-pressed>\r
              Month\r
            </Button>\r
            <Button variant="outline" size="sm">\r
              Year\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Primary split action — main CTA + menu affordance</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="primary" size="sm">\r
              Save changes\r
            </Button>\r
            <Button variant="primary" size="sm" aria-label="More save options" style={{
            paddingLeft: 8,
            paddingRight: 8
          }}>\r
              <ChevronDown size={16} aria-hidden />\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Ghost toolbar — low-emphasis grouped actions</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="ghost" size="sm">\r
              Copy\r
            </Button>\r
            <Button variant="ghost" size="sm">\r
              Duplicate\r
            </Button>\r
            <Button variant="ghost" size="sm">\r
              Delete\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Small — compact headers & forms</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="outline" size="sm" aria-pressed>\r
              Active\r
            </Button>\r
            <Button variant="outline" size="sm">\r
              Option B\r
            </Button>\r
            <Button variant="outline" size="sm">\r
              Option C\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Default — standard density</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="outline" size="md" aria-pressed>\r
              Active\r
            </Button>\r
            <Button variant="outline" size="md">\r
              Option B\r
            </Button>\r
            <Button variant="outline" size="md">\r
              Option C\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Large — spacious primary areas</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="outline" size="lg" aria-pressed>\r
              Active\r
            </Button>\r
            <Button variant="outline" size="lg">\r
              Option B\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <div>\r
        <DemoLabel>Entire group disabled</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="outline" size="sm" disabled>\r
              Month\r
            </Button>\r
            <Button variant="outline" size="sm" disabled>\r
              Quarter\r
            </Button>\r
            <Button variant="outline" size="sm" disabled>\r
              Year\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Single disabled item in group</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="outline" size="sm" aria-pressed>\r
              Enabled\r
            </Button>\r
            <Button variant="outline" size="sm" disabled>\r
              Locked\r
            </Button>\r
            <Button variant="outline" size="sm">\r
              Enabled\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
\r
      <div>\r
        <DemoLabel>Loading action in split button</DemoLabel>\r
        <DemoBox>\r
          <ButtonGroup>\r
            <Button variant="primary" size="sm" loading>\r
              Saving…\r
            </Button>\r
            <Button variant="primary" size="sm" disabled aria-label="More options">\r
              <ChevronDown size={16} aria-hidden />\r
            </Button>\r
          </ButtonGroup>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Apply \`flex-wrap\` on \`ButtonGroup\` when labels are long or the panel is narrow. ' + 'Border overlap still works per row; test in agent editor with preview closed.'
      }
    }
  },
  render: () => <div style={{
    width: 360
  }}>\r
      <DemoLabel>Narrow container (360px)</DemoLabel>\r
      <DemoBox>\r
        <SegmentedButtons items={[{
        value: 'rules',
        label: 'Rules',
        icon: <ListChecks size={14} aria-hidden />
      }, {
        value: 'constraints',
        label: 'Constraints',
        icon: <ShieldAlert size={14} aria-hidden />
      }, {
        value: 'output',
        label: 'Output format',
        icon: <TextQuote size={14} aria-hidden />
      }, {
        value: 'tools',
        label: 'Tool notes',
        icon: <Wrench size={14} aria-hidden />
      }]} defaultValue="rules" wrap />\r
      </DemoBox>\r
    </div>
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'One child keeps full border radius — useful when the group may grow later.'
      }
    }
  },
  render: () => <DemoBox>\r
      <ButtonGroup>\r
        <Button variant="outline" size="sm">\r
          Only button\r
        </Button>\r
      </ButtonGroup>\r
    </DemoBox>
}`,...k.parameters?.docs?.source}}},A=[`Default`,`SegmentedControl`,`Variants`,`Sizes`,`States`,`Wrapping`,`SingleChild`]}))();export{C as Default,w as SegmentedControl,k as SingleChild,E as Sizes,D as States,T as Variants,O as Wrapping,A as __namedExportsOrder,y as default};