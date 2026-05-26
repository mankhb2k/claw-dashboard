import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-DNP4h_7x.js";import{a as n,c as r,i,l as a,n as o,o as s,r as c,s as l,t as u,u as d}from"./AlertDialog-O6hr-M-N.js";import{n as f,t as p}from"./Button-BQKtsxgJ.js";var m,h,g,_,v,y,b;e((()=>{m=t(),d(),f(),h={title:`UI/AlertDialog`,component:u,parameters:{layout:`centered`},tags:[`autodocs`]},g=({children:e})=>(0,m.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-text-subtle)`,fontWeight:600,marginBottom:`12px`},children:e}),_=({children:e,style:t})=>(0,m.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`32px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-white)`,...t},children:e}),v={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(g,{children:`Bấm vào nút bên dưới để xem hộp thoại:`}),(0,m.jsx)(_,{children:(0,m.jsxs)(u,{children:[(0,m.jsx)(a,{asChild:!0,children:(0,m.jsx)(p,{variant:`primary`,children:`Mở Alert Dialog`})}),(0,m.jsxs)(i,{children:[(0,m.jsxs)(l,{children:[(0,m.jsx)(r,{children:`Bạn có chắc chắn không?`}),(0,m.jsx)(n,{children:`Hành động này không thể hoàn tác. Dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi máy chủ.`})]}),(0,m.jsxs)(s,{children:[(0,m.jsx)(c,{children:`Hủy bỏ`}),(0,m.jsx)(o,{children:`Tiếp tục`})]})]})]})})]})},y={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(g,{children:`Trường hợp hành động nguy hiểm:`}),(0,m.jsx)(_,{style:{borderColor:`var(--color-danger-dim)`},children:(0,m.jsxs)(u,{children:[(0,m.jsx)(a,{asChild:!0,children:(0,m.jsx)(p,{variant:`danger`,children:`Xóa tài khoản`})}),(0,m.jsxs)(i,{children:[(0,m.jsxs)(l,{children:[(0,m.jsx)(r,{children:`Xóa tài khoản vĩnh viễn?`}),(0,m.jsx)(n,{children:`Tất cả các project và dữ liệu liên quan sẽ bị xóa ngay lập tức. Hãy chắc chắn rằng bạn đã sao lưu dữ liệu quan trọng.`})]}),(0,m.jsxs)(s,{children:[(0,m.jsx)(c,{children:`Để tôi suy nghĩ lại`}),(0,m.jsx)(o,{variant:`danger`,children:`Tôi hiểu, hãy xóa đi`})]})]})]})})]})},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Bấm vào nút bên dưới để xem hộp thoại:</DemoLabel>\r
      <DemoBox>\r
        <AlertDialog>\r
          <AlertDialogTrigger asChild>\r
            <Button variant="primary">Mở Alert Dialog</Button>\r
          </AlertDialogTrigger>\r
          <AlertDialogContent>\r
            <AlertDialogHeader>\r
              <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>\r
              <AlertDialogDescription>\r
                Hành động này không thể hoàn tác. Dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi máy chủ.\r
              </AlertDialogDescription>\r
            </AlertDialogHeader>\r
            <AlertDialogFooter>\r
              <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>\r
              <AlertDialogAction>Tiếp tục</AlertDialogAction>\r
            </AlertDialogFooter>\r
          </AlertDialogContent>\r
        </AlertDialog>\r
      </DemoBox>\r
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Trường hợp hành động nguy hiểm:</DemoLabel>\r
      <DemoBox style={{
      borderColor: 'var(--color-danger-dim)'
    }}>\r
        <AlertDialog>\r
          <AlertDialogTrigger asChild>\r
            <Button variant="danger">Xóa tài khoản</Button>\r
          </AlertDialogTrigger>\r
          <AlertDialogContent>\r
            <AlertDialogHeader>\r
              <AlertDialogTitle>Xóa tài khoản vĩnh viễn?</AlertDialogTitle>\r
              <AlertDialogDescription>\r
                Tất cả các project và dữ liệu liên quan sẽ bị xóa ngay lập tức. Hãy chắc chắn rằng bạn đã sao lưu dữ liệu quan trọng.\r
              </AlertDialogDescription>\r
            </AlertDialogHeader>\r
            <AlertDialogFooter>\r
              <AlertDialogCancel>Để tôi suy nghĩ lại</AlertDialogCancel>\r
              <AlertDialogAction variant="danger">\r
                Tôi hiểu, hãy xóa đi\r
              </AlertDialogAction>\r
            </AlertDialogFooter>\r
          </AlertDialogContent>\r
        </AlertDialog>\r
      </DemoBox>\r
    </div>
}`,...y.parameters?.docs?.source}}},b=[`Default`,`Danger`]}))();export{y as Danger,v as Default,b as __namedExportsOrder,h as default};