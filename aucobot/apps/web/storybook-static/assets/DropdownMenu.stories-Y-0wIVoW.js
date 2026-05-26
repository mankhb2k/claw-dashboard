import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{t as n,w as r}from"./lucide-react-BhEFrHXV.js";import{a as i,i as a,n as o,o as s,r as c,s as l,t as u}from"./DropdownMenu-wPFuQ06j.js";var d,f,p,m,h,g,_;e((()=>{d=t(),n(),l(),f={title:`UI/DropdownMenu`,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{align:{control:`select`,options:[`start`,`center`,`end`],description:`Căn lề của menu popup so với nút trigger`},triggerVariant:{control:`select`,options:[`default`,`kebab`,`unstyled`],description:`Kiểu hiển thị của nút trigger`},triggerText:{control:`text`,description:`Chữ hiển thị trên nút (chỉ áp dụng khi variant là default)`},sideOffset:{control:`number`,description:`Khoảng cách giữa menu popup và nút trigger (px)`}}},p=({children:e})=>(0,d.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),m=({children:e})=>(0,d.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`60px`,minWidth:`300px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`,alignItems:`center`},children:e}),h={args:{align:`end`,triggerVariant:`default`,triggerText:`Tùy chọn`,sideOffset:4},render:e=>(0,d.jsxs)(`div`,{children:[(0,d.jsx)(p,{children:`Bấm vào nút để mở Menu (Hover thay đổi cả nền và màu chữ)`}),(0,d.jsx)(m,{children:(0,d.jsxs)(u,{children:[(0,d.jsx)(s,{variant:e.triggerVariant,children:e.triggerVariant===`kebab`?(0,d.jsx)(r,{size:20}):e.triggerText}),(0,d.jsxs)(o,{align:e.align,sideOffset:e.sideOffset,children:[(0,d.jsx)(a,{children:`Tài khoản của tôi`}),(0,d.jsx)(i,{}),(0,d.jsx)(c,{children:`Hồ sơ cá nhân`}),(0,d.jsx)(c,{children:`Cài đặt`}),(0,d.jsx)(c,{children:`Team`}),(0,d.jsx)(i,{}),(0,d.jsx)(c,{variant:`danger`,children:`Đăng xuất`})]})]})})]})},g={render:()=>(0,d.jsxs)(`div`,{children:[(0,d.jsx)(p,{children:`Kebab Menu (Khi Mở: Nền trong suốt, chỉ đổi màu Icon)`}),(0,d.jsx)(m,{children:(0,d.jsxs)(u,{children:[(0,d.jsx)(s,{variant:`kebab`,children:(0,d.jsx)(r,{size:20})}),(0,d.jsxs)(o,{align:`end`,children:[(0,d.jsx)(c,{children:`Chỉnh sửa`}),(0,d.jsx)(c,{children:`Sao chép ID`}),(0,d.jsx)(i,{}),(0,d.jsx)(c,{variant:`danger`,children:`Xóa vĩnh viễn`})]})]})})]})},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    align: 'end',
    triggerVariant: 'default',
    triggerText: 'Tùy chọn',
    sideOffset: 4
  },
  render: args => <div>\r
      <DemoLabel>Bấm vào nút để mở Menu (Hover thay đổi cả nền và màu chữ)</DemoLabel>\r
      <DemoBox>\r
        <DropdownMenu>\r
          <DropdownMenuTrigger variant={args.triggerVariant}>\r
            {args.triggerVariant === 'kebab' ? <Ellipsis size={20} /> : args.triggerText}\r
          </DropdownMenuTrigger>\r
          <DropdownMenuContent align={args.align} sideOffset={args.sideOffset}>\r
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem>Hồ sơ cá nhân</DropdownMenuItem>\r
            <DropdownMenuItem>Cài đặt</DropdownMenuItem>\r
            <DropdownMenuItem>Team</DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem variant="danger">Đăng xuất</DropdownMenuItem>\r
          </DropdownMenuContent>\r
        </DropdownMenu>\r
      </DemoBox>\r
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Kebab Menu (Khi Mở: Nền trong suốt, chỉ đổi màu Icon)</DemoLabel>\r
      <DemoBox>\r
        <DropdownMenu>\r
          <DropdownMenuTrigger variant="kebab">\r
            <Ellipsis size={20} />\r
          </DropdownMenuTrigger>\r
          <DropdownMenuContent align="end">\r
            <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>\r
            <DropdownMenuItem>Sao chép ID</DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem variant="danger">Xóa vĩnh viễn</DropdownMenuItem>\r
          </DropdownMenuContent>\r
        </DropdownMenu>\r
      </DemoBox>\r
    </div>
}`,...g.parameters?.docs?.source}}},_=[`Default`,`KebabMenu`]}))();export{h as Default,g as KebabMenu,_ as __namedExportsOrder,f as default};