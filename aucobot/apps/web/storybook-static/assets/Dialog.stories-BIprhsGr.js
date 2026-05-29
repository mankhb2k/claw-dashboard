import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./Button-CVrsnW4w.js";import{a as i,c as a,i as o,l as s,n as c,o as l,r as u,s as d,t as f}from"./Dialog-B_m9f_vp.js";var p,m,h,g,_,v,y;e((()=>{p=t(),s(),n(),m={title:`UI/Dialog`,component:u,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{showClose:{control:`boolean`,description:`Show X close button in the top-right corner`},title:{control:`text`,description:`Modal title (demo only)`},description:{control:`text`,description:`Modal description (demo only)`},content:{control:`text`,description:`Modal body content (demo only)`}}},h=({children:e})=>(0,p.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),g=({children:e,style:t})=>(0,p.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`32px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,...t},children:e}),_={args:{showClose:!0,title:`Modal title`,description:`You can change this text in the Controls panel below.`,content:`Main modal content goes here. You can edit this too!`},render:e=>(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Click the button to open the dialog and test Controls props:`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{children:[(0,p.jsx)(a,{asChild:!0,children:(0,p.jsx)(r,{variant:`primary`,children:`Open dialog`})}),(0,p.jsxs)(u,{showClose:e.showClose,children:[(0,p.jsxs)(l,{children:[(0,p.jsx)(d,{children:e.title}),(0,p.jsx)(o,{children:e.description})]}),(0,p.jsx)(`div`,{style:{padding:`var(--space-4) 0`},children:(0,p.jsx)(`p`,{style:{fontSize:`var(--font-size-sm)`,color:`var(--color-foreground)`},children:e.content})}),(0,p.jsxs)(i,{children:[(0,p.jsx)(c,{asChild:!0,children:(0,p.jsx)(r,{variant:`ghost`,children:`Cancel`})}),(0,p.jsx)(r,{variant:`primary`,children:`Save`})]})]})]})})]})},v={args:{showClose:!1,title:`Confirm action`,description:``,content:`Are you sure you want to perform this action?`},render:e=>(0,p.jsxs)(`div`,{children:[(0,p.jsx)(h,{children:`Custom modal (hide default close button via props):`}),(0,p.jsx)(g,{children:(0,p.jsxs)(f,{children:[(0,p.jsx)(a,{asChild:!0,children:(0,p.jsx)(r,{variant:`outline`,children:`Open custom modal`})}),(0,p.jsxs)(u,{showClose:e.showClose,children:[(0,p.jsx)(l,{children:(0,p.jsx)(d,{children:e.title})}),(0,p.jsxs)(`div`,{style:{padding:`var(--space-4) 0`,textAlign:`center`},children:[(0,p.jsx)(`div`,{style:{width:`48px`,height:`48px`,borderRadius:`50%`,background:`var(--color-primary-dim)`,color:`var(--color-primary)`,display:`flex`,alignItems:`center`,justifyContent:`center`,margin:`0 auto 16px`},children:`ℹ️`}),(0,p.jsx)(`p`,{style:{fontSize:`var(--font-size-sm)`,color:`var(--color-foreground)`},children:e.content})]}),(0,p.jsxs)(i,{style:{justifyContent:`center`},children:[(0,p.jsx)(c,{asChild:!0,children:(0,p.jsx)(r,{variant:`ghost`,children:`Go back`})}),(0,p.jsx)(r,{variant:`primary`,children:`I agree`})]})]})]})})]})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    showClose: true,
    title: 'Modal title',
    description: 'You can change this text in the Controls panel below.',
    content: 'Main modal content goes here. You can edit this too!'
  },
  render: args => <div>\r
      <DemoLabel>Click the button to open the dialog and test Controls props:</DemoLabel>\r
      <DemoBox>\r
        <Dialog>\r
          <DialogTrigger asChild>\r
            <Button variant="primary">Open dialog</Button>\r
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
                <Button variant="ghost">Cancel</Button>\r
              </DialogClose>\r
              <Button variant="primary">Save</Button>\r
            </DialogFooter>\r
          </DialogContent>\r
        </Dialog>\r
      </DemoBox>\r
    </div>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    showClose: false,
    title: 'Confirm action',
    description: '',
    content: 'Are you sure you want to perform this action?'
  },
  render: args => <div>\r
      <DemoLabel>Custom modal (hide default close button via props):</DemoLabel>\r
      <DemoBox>\r
        <Dialog>\r
          <DialogTrigger asChild>\r
            <Button variant="outline">Open custom modal</Button>\r
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
                <Button variant="ghost">Go back</Button>\r
              </DialogClose>\r
              <Button variant="primary">I agree</Button>\r
            </DialogFooter>\r
          </DialogContent>\r
        </Dialog>\r
      </DemoBox>\r
    </div>
}`,...v.parameters?.docs?.source}}},y=[`Interactive`,`CustomContent`]}))();export{v as CustomContent,_ as Interactive,y as __namedExportsOrder,m as default};