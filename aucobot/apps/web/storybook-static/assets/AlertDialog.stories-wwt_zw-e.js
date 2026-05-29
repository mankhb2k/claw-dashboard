import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{a as n,c as r,i,l as a,n as o,o as s,r as c,s as l,t as u,u as d}from"./AlertDialog-ChXeOUwV.js";import{n as f,t as p}from"./Button-CVrsnW4w.js";var m,h,g,_,v,y,b;e((()=>{m=t(),d(),f(),h={title:`UI/AlertDialog`,component:u,parameters:{layout:`centered`},tags:[`autodocs`]},g=({children:e})=>(0,m.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),_=({children:e,style:t})=>(0,m.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`32px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,...t},children:e}),v={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(g,{children:`Click the button below to open the dialog:`}),(0,m.jsx)(_,{children:(0,m.jsxs)(u,{children:[(0,m.jsx)(a,{asChild:!0,children:(0,m.jsx)(p,{variant:`primary`,children:`Open alert dialog`})}),(0,m.jsxs)(i,{children:[(0,m.jsxs)(l,{children:[(0,m.jsx)(r,{children:`Are you sure?`}),(0,m.jsx)(n,{children:`This action cannot be undone. Your data will be permanently deleted from the server.`})]}),(0,m.jsxs)(s,{children:[(0,m.jsx)(c,{children:`Cancel`}),(0,m.jsx)(o,{children:`Continue`})]})]})]})})]})},y={render:()=>(0,m.jsxs)(`div`,{children:[(0,m.jsx)(g,{children:`Dangerous action:`}),(0,m.jsx)(_,{style:{borderColor:`var(--color-danger-dim)`},children:(0,m.jsxs)(u,{children:[(0,m.jsx)(a,{asChild:!0,children:(0,m.jsx)(p,{variant:`danger`,children:`Delete account`})}),(0,m.jsxs)(i,{children:[(0,m.jsxs)(l,{children:[(0,m.jsx)(r,{children:`Delete account permanently?`}),(0,m.jsx)(n,{children:`All projects and related data will be deleted immediately. Make sure you have backed up anything important.`})]}),(0,m.jsxs)(s,{children:[(0,m.jsx)(c,{children:`Let me think`}),(0,m.jsx)(o,{variant:`danger`,children:`I understand, delete it`})]})]})]})})]})},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Click the button below to open the dialog:</DemoLabel>\r
      <DemoBox>\r
        <AlertDialog>\r
          <AlertDialogTrigger asChild>\r
            <Button variant="primary">Open alert dialog</Button>\r
          </AlertDialogTrigger>\r
          <AlertDialogContent>\r
            <AlertDialogHeader>\r
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>\r
              <AlertDialogDescription>\r
                This action cannot be undone. Your data will be permanently deleted from the server.\r
              </AlertDialogDescription>\r
            </AlertDialogHeader>\r
            <AlertDialogFooter>\r
              <AlertDialogCancel>Cancel</AlertDialogCancel>\r
              <AlertDialogAction>Continue</AlertDialogAction>\r
            </AlertDialogFooter>\r
          </AlertDialogContent>\r
        </AlertDialog>\r
      </DemoBox>\r
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div>\r
      <DemoLabel>Dangerous action:</DemoLabel>\r
      <DemoBox style={{
      borderColor: 'var(--color-danger-dim)'
    }}>\r
        <AlertDialog>\r
          <AlertDialogTrigger asChild>\r
            <Button variant="danger">Delete account</Button>\r
          </AlertDialogTrigger>\r
          <AlertDialogContent>\r
            <AlertDialogHeader>\r
              <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>\r
              <AlertDialogDescription>\r
                All projects and related data will be deleted immediately. Make sure you have backed up anything important.\r
              </AlertDialogDescription>\r
            </AlertDialogHeader>\r
            <AlertDialogFooter>\r
              <AlertDialogCancel>Let me think</AlertDialogCancel>\r
              <AlertDialogAction variant="danger">\r
                I understand, delete it\r
              </AlertDialogAction>\r
            </AlertDialogFooter>\r
          </AlertDialogContent>\r
        </AlertDialog>\r
      </DemoBox>\r
    </div>
}`,...y.parameters?.docs?.source}}},b=[`Default`,`Danger`]}))();export{y as Danger,v as Default,b as __namedExportsOrder,h as default};