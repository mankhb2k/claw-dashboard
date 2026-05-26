import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Card-BMMvaGrn.js";import{n as i,t as a}from"./Select-D7ATHPct.js";var o,s,c,l,u,d,f,p;e((()=>{o=t(),i(),n(),s={title:`UI/Select`,component:a,parameters:{layout:`centered`},tags:[`autodocs`]},c=({children:e})=>(0,o.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),l=({children:e,width:t=`450px`})=>(0,o.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`40px`,width:t,borderRadius:`var(--radius-lg)`,background:`var(--color-bg)`,border:`1px solid var(--color-border)`},children:e}),u={args:{id:`select-default`,label:`Chọn mô hình AI`,placeholder:`Chọn một mô hình...`,options:[{value:`gpt-4o`,label:`GPT-4o (OpenAI)`},{value:`claude-3-5`,label:`Claude 3.5 Sonnet (Anthropic)`},{value:`gemini-1-5`,label:`Gemini 1.5 Pro (Google)`},{value:`deepseek-v3`,label:`DeepSeek V3 (DeepSeek)`}]}},d={render:()=>(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`32px`},children:[(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Trạng thái bình thường & Placeholder`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-normal`,label:`Khu vực triển khai`,placeholder:`Chọn server...`,options:[{value:`sg`,label:`Singapore (Asia Southeast)`},{value:`us`,label:`United States (North America)`},{value:`eu`,label:`Frankfurt (Europe Central)`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Trạng thái có lỗi (Validation Error)`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-error`,label:`Gói thành viên`,error:`Vui lòng chọn gói dịch vụ để tiếp tục`,options:[{value:`free`,label:`Miễn phí`},{value:`pro`,label:`Chuyên nghiệp`},{value:`ent`,label:`Doanh nghiệp`}]})})]}),(0,o.jsxs)(`section`,{children:[(0,o.jsx)(c,{children:`Trạng thái vô hiệu hóa (Disabled)`}),(0,o.jsx)(l,{children:(0,o.jsx)(a,{id:`select-disabled`,label:`Cổng thanh toán (Đang bảo trì)`,defaultValue:`stripe`,disabled:!0,options:[{value:`stripe`,label:`Stripe`},{value:`paypal`,label:`PayPal`},{value:`vietqr`,label:`VietQR`}]})})]})]})},f={render:()=>(0,o.jsxs)(`div`,{style:{padding:`40px`},children:[(0,o.jsx)(c,{children:`Sử dụng trong Card (Thực tế)`}),(0,o.jsx)(r,{style:{width:`400px`,padding:`24px`},children:(0,o.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`20px`},children:[(0,o.jsxs)(`div`,{style:{borderBottom:`1px solid var(--color-border)`,paddingBottom:`16px`,marginBottom:`8px`},children:[(0,o.jsx)(`h3`,{style:{fontWeight:600,fontSize:`16px`},children:`Cấu hình dự án`}),(0,o.jsx)(`p`,{style:{fontSize:`13px`,color:`var(--color-text-muted)`},children:`Thiết lập các thông số cơ bản cho project của bạn.`})]}),(0,o.jsx)(a,{id:`project-type`,label:`Loại dự án`,defaultValue:`nextjs`,options:[{value:`nextjs`,label:`Next.js Web Application`},{value:`nestjs`,label:`NestJS Backend API`},{value:`python`,label:`Python Automation`}]}),(0,o.jsx)(a,{id:`project-visibility`,label:`Chế độ hiển thị`,defaultValue:`private`,options:[{value:`private`,label:`Riêng tư (Private)`},{value:`public`,label:`Công khai (Public)`}]}),(0,o.jsx)(`div`,{style:{marginTop:`8px`,display:`flex`,justifyContent:`flex-end`},children:(0,o.jsx)(`button`,{style:{padding:`8px 16px`,background:`var(--color-primary)`,color:`white`,border:`none`,borderRadius:`var(--radius-md)`,fontWeight:500,fontSize:`14px`},children:`Lưu thay đổi`})})]})})]})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    id: 'select-default',
    label: 'Chọn mô hình AI',
    placeholder: 'Chọn một mô hình...',
    options: [{
      value: 'gpt-4o',
      label: 'GPT-4o (OpenAI)'
    }, {
      value: 'claude-3-5',
      label: 'Claude 3.5 Sonnet (Anthropic)'
    }, {
      value: 'gemini-1-5',
      label: 'Gemini 1.5 Pro (Google)'
    }, {
      value: 'deepseek-v3',
      label: 'DeepSeek V3 (DeepSeek)'
    }]
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>\r
      <section>\r
        <DemoLabel>Trạng thái bình thường & Placeholder</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-normal" label="Khu vực triển khai" placeholder="Chọn server..." options={[{
          value: 'sg',
          label: 'Singapore (Asia Southeast)'
        }, {
          value: 'us',
          label: 'United States (North America)'
        }, {
          value: 'eu',
          label: 'Frankfurt (Europe Central)'
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Trạng thái có lỗi (Validation Error)</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-error" label="Gói thành viên" error="Vui lòng chọn gói dịch vụ để tiếp tục" options={[{
          value: 'free',
          label: 'Miễn phí'
        }, {
          value: 'pro',
          label: 'Chuyên nghiệp'
        }, {
          value: 'ent',
          label: 'Doanh nghiệp'
        }]} />\r
        </DemoBox>\r
      </section>\r
\r
      <section>\r
        <DemoLabel>Trạng thái vô hiệu hóa (Disabled)</DemoLabel>\r
        <DemoBox>\r
          <Select id="select-disabled" label="Cổng thanh toán (Đang bảo trì)" defaultValue="stripe" disabled options={[{
          value: 'stripe',
          label: 'Stripe'
        }, {
          value: 'paypal',
          label: 'PayPal'
        }, {
          value: 'vietqr',
          label: 'VietQR'
        }]} />\r
        </DemoBox>\r
      </section>\r
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    padding: '40px'
  }}>\r
      <DemoLabel>Sử dụng trong Card (Thực tế)</DemoLabel>\r
      <Card style={{
      width: '400px',
      padding: '24px'
    }}>\r
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>\r
          <div style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '16px',
          marginBottom: '8px'
        }}>\r
            <h3 style={{
            fontWeight: 600,
            fontSize: '16px'
          }}>Cấu hình dự án</h3>\r
            <p style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)'
          }}>\r
              Thiết lập các thông số cơ bản cho project của bạn.\r
            </p>\r
          </div>\r
          \r
          <Select id="project-type" label="Loại dự án" defaultValue="nextjs" options={[{
          value: 'nextjs',
          label: 'Next.js Web Application'
        }, {
          value: 'nestjs',
          label: 'NestJS Backend API'
        }, {
          value: 'python',
          label: 'Python Automation'
        }]} />\r
          \r
          <Select id="project-visibility" label="Chế độ hiển thị" defaultValue="private" options={[{
          value: 'private',
          label: 'Riêng tư (Private)'
        }, {
          value: 'public',
          label: 'Công khai (Public)'
        }]} />\r
\r
          <div style={{
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>\r
            <button style={{
            padding: '8px 16px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            fontSize: '14px'
          }}>\r
              Lưu thay đổi\r
            </button>\r
          </div>\r
        </div>\r
      </Card>\r
    </div>
}`,...f.parameters?.docs?.source}}},p=[`Default`,`States`,`InCard`]}))();export{u as Default,f as InCard,d as States,p as __namedExportsOrder,s as default};