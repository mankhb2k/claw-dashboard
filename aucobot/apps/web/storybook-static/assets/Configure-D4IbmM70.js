import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{I as n,N as r,a as i,o as a}from"./blocks-D7LtHie4.js";var o=e((()=>{r()}));function s(e){let t={code:`code`,em:`em`,h1:`h1`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(i,{title:`Welcome/Introduction`}),`
`,(0,l.jsxs)(`div`,{className:`sb-container`,children:[(0,l.jsxs)(`div`,{className:`sb-section-title`,children:[(0,l.jsx)(t.h1,{id:`-openclaw-saas-design-system`,children:`🚀 OpenClaw SaaS Design System`}),(0,l.jsxs)(t.p,{children:[`Chào mừng bạn đến với hệ thống thiết kế của `,(0,l.jsx)(t.strong,{children:`OpenClaw SaaS`}),`. Đây là nơi lưu trữ, kiểm thử và tài liệu hóa toàn bộ các thành phần giao diện (UI Components) của dự án.`]})]}),(0,l.jsxs)(`div`,{className:`sb-section`,children:[(0,l.jsxs)(`div`,{className:`sb-section-item`,children:[(0,l.jsx)(t.h3,{id:`-technology-stack`,children:`🛠 Technology Stack`}),(0,l.jsx)(t.p,{children:`Hệ thống được xây dựng trên nền tảng hiện đại, ưu tiên tính linh hoạt và hiệu năng:`}),(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Framework`}),`: Next.js 16 (App Router)`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Styling`}),`: Vanilla CSS Modules (Không dùng Framework)`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Icons`}),`: Lucide React / React Icons`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`State`}),`: Zustand`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Validation`}),`: Zod`]}),`
`]})]}),(0,l.jsxs)(`div`,{className:`sb-section-item`,children:[(0,l.jsx)(t.h3,{id:`-nguyên-tắc-cốt-lõi-rulemd`,children:`📜 Nguyên tắc cốt lõi (Rule.md)`}),(0,l.jsx)(t.p,{children:`Mọi thành phần UI trong dự án phải tuân thủ các quy tắc nghiêm ngặt:`}),(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`No Tailwind/Bootstrap`}),`: Tự viết CSS để kiểm soát 100% giao diện.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`CSS Variables`}),`: Luôn sử dụng biến hệ thống cho màu sắc và khoảng cách.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Atomic Design`}),`: Ưu tiên sử dụng và mở rộng các component trong `,(0,l.jsx)(t.code,{children:`components/ui/`}),`.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Consistency`}),`: Hover và Focus effect phải đồng nhất trên toàn hệ thống.`]}),`
`]})]})]})]}),`
`,(0,l.jsx)(t.hr,{}),`
`,(0,l.jsx)(t.h2,{id:`-hệ-màu-color-system`,children:`🎨 Hệ màu (Color System)`}),`
`,(0,l.jsxs)(t.p,{children:[`Dự án sử dụng tông màu cam `,(0,l.jsx)(t.code,{children:`#ff5f00`}),` làm chủ đạo, kết hợp với các lớp phủ (overlays) tinh tế.`]}),`
`,(0,l.jsxs)(`div`,{className:`color-grid`,children:[(0,l.jsxs)(`div`,{className:`color-item`,style:{background:`#ff5f00`,color:`white`},children:[(0,l.jsx)(`strong`,{children:`Primary`}),(0,l.jsx)(`code`,{children:`--color-primary`}),(0,l.jsx)(`span`,{children:`#ff5f00`})]}),(0,l.jsxs)(`div`,{className:`color-item`,style:{background:`#17181c`,color:`white`},children:[(0,l.jsx)(`strong`,{children:`Text`}),(0,l.jsx)(`code`,{children:`--color-text`}),(0,l.jsx)(`span`,{children:`#17181c`})]}),(0,l.jsxs)(`div`,{className:`color-item`,style:{background:`#e4e6ec`,color:`#17181c`},children:[(0,l.jsx)(`strong`,{children:`Border`}),(0,l.jsx)(`code`,{children:`--color-border`}),(0,l.jsx)(`span`,{children:`#e4e6ec`})]}),(0,l.jsxs)(`div`,{className:`color-item`,style:{background:`#f4f5f8`,color:`#17181c`},children:[(0,l.jsx)(`strong`,{children:`Background`}),(0,l.jsx)(`code`,{children:`--color-bg`}),(0,l.jsx)(`span`,{children:`#f4f5f8`})]})]}),`
`,(0,l.jsx)(t.hr,{}),`
`,(0,l.jsx)(t.h2,{id:`-khoảng-cách--hình-khối-spacing--shapes`,children:`📐 Khoảng cách & Hình khối (Spacing & Shapes)`}),`
`,(0,l.jsxs)(t.p,{children:[`| Biến số | Giá trị | Mô tả |
|---|---|---|
| `,(0,l.jsx)(t.code,{children:`--radius-md`}),` | 10px | Bo góc trung bình |
| `,(0,l.jsx)(t.code,{children:`--radius-lg`}),` | 12px | Chuẩn bo góc của Card |
| `,(0,l.jsx)(t.code,{children:`--space-4`}),` | 1rem (16px) | Khoảng cách padding/margin tiêu chuẩn |
| `,(0,l.jsx)(t.code,{children:`--transition-base`}),` | 180ms | Tốc độ hiệu ứng mặc định |`]}),`
`,(0,l.jsx)(t.hr,{}),`
`,(0,l.jsx)(t.h2,{id:`-ai-assisted-workflow`,children:`🤖 AI-Assisted Workflow`}),`
`,(0,l.jsxs)(t.p,{children:[`Nếu bạn đang làm việc với `,(0,l.jsx)(t.strong,{children:`Antigravity (AI Agent)`}),`, hãy tận dụng các lệnh sau:`]}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsx)(t.li,{children:(0,l.jsx)(t.em,{children:`"Tạo component [Tên] và viết story cho nó."`})}),`
`,(0,l.jsx)(t.li,{children:(0,l.jsx)(t.em,{children:`"Kiểm tra file rule.md và cập nhật CSS cho component này."`})}),`
`,(0,l.jsx)(t.li,{children:(0,l.jsx)(t.em,{children:`"Tạo một biến thể mới của [Component] trong Storybook."`})}),`
`]}),`
`,(0,l.jsx)(t.hr,{}),`
`,(0,l.jsx)(`style`,{children:`
.sb-container {
  margin-bottom: 48px;
}
.sb-section-title {
  margin-bottom: 32px;
}
.sb-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}
.sb-section-item h3 {
  margin-top: 0;
  color: var(--color-primary);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
.color-item {
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  border: 1px solid rgba(0,0,0,0.05);
}
.color-item strong {
  font-size: 14px;
  margin-bottom: 8px;
}
.color-item code {
  background: rgba(255,255,255,0.2);
  padding: 2px 4px;
  border-radius: 4px;
  margin-bottom: 4px;
  width: fit-content;
}

@media screen and (max-width: 600px) {
  .sb-section {
    grid-template-columns: 1fr;
  }
}
`})]})}function c(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(s,{...e})}):s(e)}var l;e((()=>{l=t(),o(),a()}))();export{c as default};