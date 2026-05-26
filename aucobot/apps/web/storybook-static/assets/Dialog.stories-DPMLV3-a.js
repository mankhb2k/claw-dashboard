import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{n,t as r}from"./Button-BQKtsxgJ.js";import{a as i,c as a,i as o,l as s,n as c,o as l,r as u,s as d,t as f}from"./Dialog-C-DepF8c.js";var p,m,h,g,_,v,y;e((()=>{p=t(),s(),n(),m={title:`UI/Dialog`,component:u,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{showClose:{control:`boolean`,description:`Hiển thị nút X đóng modal ở góc trên bên phải`},title:{control:`text`,description:`Tiêu đề của Modal (Dùng cho Demo)`},description:{control:`text`,description:`Mô tả của Modal (Dùng cho Demo)`},content:{control:`text`,description:`Nội dung bên trong Modal (Dùng cho Demo)`}}},h=({children:e})=>(0,p.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),g=({children:e,style:t})=>(0,p.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`32px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`,...t},children:e}),_={args:{showClose:!0,title:`Tiêu đề Modal`,description:`Bạn có thể thay đổi văn bản này ở bảng Controls bên dưới.`,content:`Nội dung chính của modal nằm ở đây. Bạn cũng có thể sửa nó!`},render:e=>(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Bấm vào nút bên dưới để mở Dialog và test Props ở bảng Controls:`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{children:[(0,p.jsx)(a,{asChild:!0,children:(0,p.jsx)(r,{variant:`primary`,children:`Mở Dialog`})}),(0,p.jsxs)(u,{showClose:e.showClose,children:[(0,p.jsxs)(l,{children:[(0,p.jsx)(d,{children:e.title}),(0,p.jsx)(o,{children:e.description})]}),(0,p.jsx)(`div`,{style:{padding:`var(--space-4) 0`},children:(0,p.jsx)(`p`,{style:{fontSize:`var(--font-size-sm)`,color:`var(--color-foreground)`},children:e.content})}),(0,p.jsxs)(i,{children:[(0,p.jsx)(c,{asChild:!0,children:(0,p.jsx)(r,{variant:`ghost`,children:`Hủy bỏ`})}),(0,p.jsx)(r,{variant:`primary`,children:`Lưu lại`})]})]})]})})]})},v={args:{showClose:!1,title:`Xác nhận hành động`,description:``,content:`Bạn có chắc chắn muốn thực hiện hành động này không?`},render:e=>(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Modal tùy chỉnh (Ẩn nút Close mặc định bằng props):`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{children:[(0,p.jsx)(a,{asChild:!0,children:(0,p.jsx)(r,{variant:`outline`,children:`Mở Modal Tùy Chỉnh`})}),(0,p.jsxs)(u,{showClose:e.showClose,children:[(0,p.jsx)(l,{children:(0,p.jsx)(d,{children:e.title})}),(0,p.jsxs)(`div`,{style:{padding:`var(--space-4) 0`,textAlign:`center`},children:[(0,p.jsx)(`div`,{style:{width:`48px`,height:`48px`,borderRadius:`50%`,background:`var(--color-primary-dim)`,color:`var(--color-primary)`,display:`flex`,alignItems:`center`,justifyContent:`center`,margin:`0 auto 16px`},children:`ℹ️`}),(0,p.jsx)(`p`,{style:{fontSize:`var(--font-size-sm)`,color:`var(--color-foreground)`},children:e.content})]}),(0,p.jsxs)(i,{style:{justifyContent:`center`},children:[(0,p.jsx)(c,{asChild:!0,children:(0,p.jsx)(r,{variant:`ghost`,children:`Quay lại`})}),(0,p.jsx)(r,{variant:`primary`,children:`Tôi đồng ý`})]})]})]})})]})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    showClose: true,
    title: 'Tiêu đề Modal',
    description: 'Bạn có thể thay đổi văn bản này ở bảng Controls bên dưới.',
    content: 'Nội dung chính của modal nằm ở đây. Bạn cũng có thể sửa nó!'
  },
  render: args => <div>\r
      <DemoLabel>Bấm vào nút bên dưới để mở Dialog và test Props ở bảng Controls:</DemoLabel>\r
      <DemoBox>\r
        <Dialog>\r
          <DialogTrigger asChild>\r
            <Button variant="primary">Mở Dialog</Button>\r
          </DialogTrigger>\r
          <DialogContent showClose={args.showClose}>\r
            <DialogHeader>\r
              <DialogTitle>{args.title}</DialogTitle>\r
              <DialogDescription>\r
                {args.description}\r
              </DialogDescription>\r
            </DialogHeader>\r
            <div style={{
            padding: 'var(--space-4) 0'
          }}>\r
              <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-foreground)'
            }}>\r
                {args.content}\r
              </p>\r
            </div>\r
            <DialogFooter>\r
              <DialogClose asChild>\r
                <Button variant="ghost">Hủy bỏ</Button>\r
              </DialogClose>\r
              <Button variant="primary">Lưu lại</Button>\r
            </DialogFooter>\r
          </DialogContent>\r
        </Dialog>\r
      </DemoBox>\r
    </div>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    showClose: false,
    title: 'Xác nhận hành động',
    description: '',
    content: 'Bạn có chắc chắn muốn thực hiện hành động này không?'
  },
  render: args => <div>\r
      <DemoLabel>Modal tùy chỉnh (Ẩn nút Close mặc định bằng props):</DemoLabel>\r
      <DemoBox>\r
        <Dialog>\r
          <DialogTrigger asChild>\r
            <Button variant="outline">Mở Modal Tùy Chỉnh</Button>\r
          </DialogTrigger>\r
          <DialogContent showClose={args.showClose}>\r
            <DialogHeader>\r
              <DialogTitle>{args.title}</DialogTitle>\r
            </DialogHeader>\r
            <div style={{
            padding: 'var(--space-4) 0',
            textAlign: 'center'
          }}>\r
              <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--color-primary-dim)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>\r
                ℹ️\r
              </div>\r
              <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-foreground)'
            }}>\r
                {args.content}\r
              </p>\r
            </div>\r
            <DialogFooter style={{
            justifyContent: 'center'
          }}>\r
              <DialogClose asChild>\r
                <Button variant="ghost">Quay lại</Button>\r
              </DialogClose>\r
              <Button variant="primary">Tôi đồng ý</Button>\r
            </DialogFooter>\r
          </DialogContent>\r
        </Dialog>\r
      </DemoBox>\r
    </div>
}`,...v.parameters?.docs?.source}}},y=[`Interactive`,`CustomContent`]}))();export{v as CustomContent,_ as Interactive,y as __namedExportsOrder,m as default};