import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Card-B8WeLED8.js";import{n as i,t as a}from"./Select-D6V2dFTf.js";var o,s,c,l,u,d,f,p,m,h;e((()=>{o=t(),i(),n(),s={title:`UI/Select`,component:a,parameters:{layout:`centered`},tags:[`autodocs`]},c=({children:e})=>(0,o.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),l=({children:e,width:t=`450px`})=>(0,o.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`40px`,width:t,borderRadius:`var(--radius-lg)`,background:`var(--color-background)`,border:`1px solid var(--color-border)`},children:e}),u={args:{id:`select-default`,label:`Choose AI model`,labelPosition:`top`,placeholder:`Select a model...`,options:[{value:`gpt-4o`,label:`GPT-4o (OpenAI)`},{value:`claude-3-5`,label:`Claude 3.5 Sonnet (Anthropic)`},{value:`gemini-1-5`,label:`Gemini 1.5 Pro (Google)`},{value:`deepseek-v3`,label:`DeepSeek V3 (DeepSeek)`}]}},d={render:()=>(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Label on top (top)`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-label-top`,label:`AI model`,labelPosition:`top`,defaultValue:`gpt-4o`,options:[{value:`gpt-4o`,label:`GPT-4o`},{value:`claude-3-5`,label:`Claude 3.5`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Label on left (left)`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-label-left`,label:`Region`,labelPosition:`left`,defaultValue:`sg`,options:[{value:`sg`,label:`Singapore`},{value:`us`,label:`United States`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Label on right (right)`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-label-right`,label:`Plan`,labelPosition:`right`,defaultValue:`pro`,options:[{value:`free`,label:`Free`},{value:`pro`,label:`Pro`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`No label (none)`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-label-none`,label:`Hidden label`,labelPosition:`none`,placeholder:`Select an option...`,options:[{value:`a`,label:`Option A`},{value:`b`,label:`Option B`}]})})]})]})},f={render:()=>(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Default & placeholder`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-normal`,label:`Deployment region`,placeholder:`Select server...`,options:[{value:`sg`,label:`Singapore (Asia Southeast)`},{value:`us`,label:`United States (North America)`},{value:`eu`,label:`Frankfurt (Europe Central)`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Validation error`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-error`,label:`Membership plan`,error:`Please select a plan to continue`,options:[{value:`free`,label:`Free`},{value:`pro`,label:`Pro`},{value:`ent`,label:`Enterprise`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Disabled`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-disabled`,label:`Payment gateway (maintenance)`,defaultValue:`stripe`,disabled:!0,options:[{value:`stripe`,label:`Stripe`},{value:`paypal`,label:`PayPal`},{value:`vietqr`,label:`VietQR`}]})})]})]})},p={render:()=>(0,o.jsxs)(`div`,{style:{padding:`40px`},children:[(0,o.jsx)(c,{children:`Inside a card (real-world)`}),(0,o.jsx)(r,{style:{width:`400px`,padding:`24px`},children:(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`20px`},children:[(0,o.jsxs)(`div`,{style:{borderBottom:`1px solid var(--color-border)`,paddingBottom:`16px`,marginBottom:`8px`},children:[(0,o.jsx)(`h3`,{style:{fontWeight:600,fontSize:`16px`},children:`Project settings`}),(0,o.jsx)(`p`,{style:{fontSize:`13px`,color:`var(--color-muted-foreground)`},children:`Configure basic parameters for your project.`})]}),(0,o.jsx)(a,{id:`project-type`,label:`Project type`,defaultValue:`nextjs`,options:[{value:`nextjs`,label:`Next.js Web Application`},{value:`nestjs`,label:`NestJS Backend API`},{value:`python`,label:`Python Automation`}]}),(0,o.jsx)(a,{id:`project-visibility`,label:`Visibility`,defaultValue:`private`,options:[{value:`private`,label:`Private`},{value:`public`,label:`Public`}]}),(0,o.jsx)(`div`,{style:{marginTop:`8px`,display:`flex`,justifyContent:`flex-end`},children:(0,o.jsx)(`button`,{style:{padding:`8px 16px`,background:`var(--color-primary)`,color:`white`,border:`none`,borderRadius:`var(--radius-md)`,fontWeight:500,fontSize:`14px`},children:`Save changes`})})]})})]})},m={render:()=>(0,o.jsxs)(l,{width:`220px`,children:[(0,o.jsx)(c,{children:`size="sm" (composer / toolbar)`}),(0,o.jsx)(a,{id:`composer-provider`,labelPosition:`none`,size:`sm`,defaultValue:`gemini`,options:[{value:`gemini`,label:`Google Gemini`},{value:`openai`,label:`OpenAI`}]}),(0,o.jsx)(a,{id:`composer-model`,labelPosition:`none`,size:`sm`,defaultValue:`flash`,options:[{value:`flash`,label:`Gemini 2.5 Flash`},{value:`pro`,label:`Gemini 2.5 Pro`}]})]})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    id: "select-default",
    label: "Choose AI model",
    labelPosition: "top",
    placeholder: "Select a model...",
    options: [{
      value: "gpt-4o",
      label: "GPT-4o (OpenAI)"
    }, {
      value: "claude-3-5",
      label: "Claude 3.5 Sonnet (Anthropic)"
    }, {
      value: "gemini-1-5",
      label: "Gemini 1.5 Pro (Google)"
    }, {
      value: "deepseek-v3",
      label: "DeepSeek V3 (DeepSeek)"
    }]
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "32px"
  }}>\r
      <section>\r
        <DemoLabel>Label on top (top)</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-label-top" label="AI model" labelPosition="top" defaultValue="gpt-4o" options={[{
          value: "gpt-4o",
          label: "GPT-4o"
        }, {
          value: "claude-3-5",
          label: "Claude 3.5"
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Label on left (left)</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-label-left" label="Region" labelPosition="left" defaultValue="sg" options={[{
          value: "sg",
          label: "Singapore"
        }, {
          value: "us",
          label: "United States"
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Label on right (right)</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-label-right" label="Plan" labelPosition="right" defaultValue="pro" options={[{
          value: "free",
          label: "Free"
        }, {
          value: "pro",
          label: "Pro"
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>No label (none)</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-label-none" label="Hidden label" labelPosition="none" placeholder="Select an option..." options={[{
          value: "a",
          label: "Option A"
        }, {
          value: "b",
          label: "Option B"
        }]} />\r
        </DemoBox>\r
      </section>\r
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "32px"
  }}>\r
      <section>\r
        <DemoLabel>Default & placeholder</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-normal" label="Deployment region" placeholder="Select server..." options={[{
          value: "sg",
          label: "Singapore (Asia Southeast)"
        }, {
          value: "us",
          label: "United States (North America)"
        }, {
          value: "eu",
          label: "Frankfurt (Europe Central)"
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Validation error</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-error" label="Membership plan" error="Please select a plan to continue" options={[{
          value: "free",
          label: "Free"
        }, {
          value: "pro",
          label: "Pro"
        }, {
          value: "ent",
          label: "Enterprise"
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Disabled</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-disabled" label="Payment gateway (maintenance)" defaultValue="stripe" disabled options={[{
          value: "stripe",
          label: "Stripe"
        }, {
          value: "paypal",
          label: "PayPal"
        }, {
          value: "vietqr",
          label: "VietQR"
        }]} />\r
        </DemoBox>\r
      </section>\r
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    padding: "40px"
  }}>\r
      <DemoLabel>Inside a card (real-world)</DemoLabel>\r
      <Card style={{
      width: "400px",
      padding: "24px"
    }}>\r
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>\r
          <div style={{
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "16px",
          marginBottom: "8px"
        }}>\r
            <h3 style={{
            fontWeight: 600,
            fontSize: "16px"
          }}>\r
              Project settings\r
            </h3>\r
            <p style={{
            fontSize: "13px",
            color: "var(--color-muted-foreground)"
          }}>\r
              Configure basic parameters for your project.\r
            </p>\r
          </div>\r
\r
          <Select id="project-type" label="Project type" defaultValue="nextjs" options={[{
          value: "nextjs",
          label: "Next.js Web Application"
        }, {
          value: "nestjs",
          label: "NestJS Backend API"
        }, {
          value: "python",
          label: "Python Automation"
        }]} />\r
\r
          <Select id="project-visibility" label="Visibility" defaultValue="private" options={[{
          value: "private",
          label: "Private"
        }, {
          value: "public",
          label: "Public"
        }]} />\r
\r
          <div style={{
          marginTop: "8px",
          display: "flex",
          justifyContent: "flex-end"
        }}>\r
            <button style={{
            padding: "8px 16px",
            background: "var(--color-primary)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontWeight: 500,
            fontSize: "14px"
          }}>\r
              Save changes\r
            </button>\r
          </div>\r
        </div>\r
      </Card>\r
    </div>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <DemoBox width="220px">\r
      <DemoLabel>size=&quot;sm&quot; (composer / toolbar)</DemoLabel>\r
      <Select id="composer-provider" labelPosition="none" size="sm" defaultValue="gemini" options={[{
      value: "gemini",
      label: "Google Gemini"
    }, {
      value: "openai",
      label: "OpenAI"
    }]} />\r
      <Select id="composer-model" labelPosition="none" size="sm" defaultValue="flash" options={[{
      value: "flash",
      label: "Gemini 2.5 Flash"
    }, {
      value: "pro",
      label: "Gemini 2.5 Pro"
    }]} />\r
    </DemoBox>
}`,...m.parameters?.docs?.source}}},h=[`Default`,`LabelPositions`,`States`,`InCard`,`SmallSize`]}))();export{u as Default,p as InCard,d as LabelPositions,m as SmallSize,f as States,h as __namedExportsOrder,s as default};