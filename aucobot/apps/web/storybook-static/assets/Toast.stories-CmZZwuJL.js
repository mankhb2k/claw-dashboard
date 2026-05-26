import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Button-BQKtsxgJ.js";import{i,n as a,r as o,t as s}from"./Toast-CLL9-JP0.js";function c({variant:e,title:t,description:n,duration:a}){let{toast:o}=i();return(0,u.jsx)(p,{children:(0,u.jsx)(r,{variant:e===`error`?`danger`:`primary`,onClick:()=>{o({variant:e,title:t,description:n.trim()||void 0,duration:a})},children:`Hiện toast`})})}function l(){return(0,u.jsxs)(p,{children:[(0,u.jsx)(r,{variant:`outline`,onClick:()=>o.success(`Đã sao chép`,`API key đã được copy vào clipboard.`),children:`toast.success()`}),(0,u.jsx)(r,{variant:`outline`,onClick:()=>o.error(`Không hợp lệ`,`Tên Agent không được để trống.`),children:`toast.error()`})]})}var u,d,f,p,m,h,g,_,v,y,b;e((()=>{u=t(),a(),n(),d={title:`UI/Toast`,parameters:{layout:`centered`},tags:[`autodocs`],decorators:[e=>(0,u.jsx)(s,{children:(0,u.jsx)(e,{})})],argTypes:{variant:{control:`radio`,options:[`success`,`error`],description:`Loại toast (thành công / lỗi)`},title:{control:`text`,description:`Tiêu đề hiển thị trên toast`},description:{control:`text`,description:`Mô tả phụ (để trống nếu không cần)`},duration:{control:{type:`number`,min:1e3,max:1e4,step:500},description:`Thời gian tự ẩn (ms)`}}},f=({children:e})=>(0,u.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),p=({children:e})=>(0,u.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`16px`,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-card)`,flexWrap:`wrap`},children:e}),m={args:{variant:`success`,title:`Lưu thành công`,description:`Cấu hình Agent đã được cập nhật.`,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},h={args:{variant:`success`,title:`Đã lưu`,description:`Thay đổi của bạn đã được lưu lại.`,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},g={args:{variant:`error`,title:`Lưu thất bại`,description:`Không thể kết nối tới worker. Thử lại sau.`,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},_={args:{variant:`success`,title:`Hoàn tất`,description:``,duration:3e3},render:e=>(0,u.jsx)(c,{...e})},v={render:()=>(0,u.jsxs)(`div`,{children:[(0,u.jsx)(f,{children:`toast — gọi trực tiếp (cần ToastProvider)`}),(0,u.jsx)(l,{})]})},y={render:()=>(0,u.jsxs)(`div`,{children:[(0,u.jsx)(f,{children:`Nhiều toast liên tiếp`}),(0,u.jsx)(p,{children:(0,u.jsx)(r,{variant:`secondary`,onClick:()=>{o.success(`Bước 1`,`Đã xác thực phiên đăng nhập.`),setTimeout(()=>o.success(`Bước 2`,`Đã đồng bộ cấu hình.`),400),setTimeout(()=>o.error(`Bước 3`,`Worker timeout sau 30 giây.`),800)},children:`Kích hoạt chuỗi toast`})})]})},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Lưu thành công',
    description: 'Cấu hình Agent đã được cập nhật.',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Đã lưu',
    description: 'Thay đổi của bạn đã được lưu lại.',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    title: 'Lưu thất bại',
    description: 'Không thể kết nối tới worker. Thử lại sau.',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Hoàn tất',
    description: '',
    duration: 3000
  },
  render: args => <ToastPlayground {...args} />
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>toast — gọi trực tiếp (cần ToastProvider)</DemoLabel>\r
      <ToastDemoImperative />\r
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Nhiều toast liên tiếp</DemoLabel>\r
      <DemoBox>\r
        <Button variant="secondary" onClick={() => {
        toast.success('Bước 1', 'Đã xác thực phiên đăng nhập.');
        setTimeout(() => toast.success('Bước 2', 'Đã đồng bộ cấu hình.'), 400);
        setTimeout(() => toast.error('Bước 3', 'Worker timeout sau 30 giây.'), 800);
      }}>\r
          Kích hoạt chuỗi toast\r
        </Button>\r
      </DemoBox>\r
    </div>
}`,...y.parameters?.docs?.source}}},b=[`Default`,`Success`,`Error`,`TitleOnly`,`ImperativeApi`,`States`]}))();export{m as Default,g as Error,v as ImperativeApi,y as States,h as Success,_ as TitleOnly,b as __namedExportsOrder,d as default};