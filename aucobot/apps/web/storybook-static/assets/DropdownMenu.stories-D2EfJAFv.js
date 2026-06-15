import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{A as i,H as a,I as o,c as s,ct as c,mt as l,o as u,t as d,w as f}from"./lucide-react-sgqGO4mA.js";import{a as p,c as m,i as h,l as g,n as _,o as v,r as y,s as b,t as x,u as S}from"./DropdownMenu-MfSxiunq.js";var C,w,T,E,D,O,k,A,j,M,N;t((()=>{C=r(),w=e(n()),d(),S(),T={title:`UI/DropdownMenu`,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{align:{control:`select`,options:[`start`,`center`,`end`],description:`Menu popup alignment relative to the trigger`},triggerVariant:{control:`select`,options:[`default`,`kebab`,`unstyled`],description:`Trigger button style`},triggerText:{control:`text`,description:`Trigger label (default variant only)`},sideOffset:{control:`number`,description:`Gap between menu popup and trigger (px)`},contentWidth:{control:{type:`number`,min:120,max:400,step:10},description:`Minimum menu popup width (px)`},subContentWidth:{control:{type:`number`,min:120,max:400,step:10},description:`Minimum submenu popup width (px)`},select:{control:`boolean`,description:`DropdownMenuSub — single-select submenu (checkmark)`},theme:{control:`select`,options:[`light`,`dark`,`system`],description:`Selected value in Appearance submenu`}}},E=({children:e})=>(0,C.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),D=({children:e})=>(0,C.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,padding:`60px`,minWidth:`300px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`,alignItems:`center`},children:e}),O={args:{align:`end`,triggerVariant:`default`,triggerText:`Options`,sideOffset:4,contentWidth:180},render:e=>(0,C.jsxs)(`div`,{children:[(0,C.jsx)(E,{children:`Click the button to open the menu (hover changes background and text)`}),(0,C.jsx)(D,{children:(0,C.jsxs)(x,{children:[(0,C.jsx)(g,{variant:e.triggerVariant,children:e.triggerVariant===`kebab`?(0,C.jsx)(c,{size:20}):e.triggerText}),(0,C.jsxs)(_,{align:e.align,sideOffset:e.sideOffset,width:e.contentWidth,children:[(0,C.jsx)(h,{children:`My account`}),(0,C.jsx)(p,{}),(0,C.jsx)(y,{children:`Profile`}),(0,C.jsx)(y,{children:`Settings`}),(0,C.jsx)(y,{children:`Team`}),(0,C.jsx)(p,{}),(0,C.jsx)(y,{variant:`danger`,children:`Log out`})]})]})})]})},k={args:{align:`end`,sideOffset:4,contentWidth:180},render:e=>(0,C.jsxs)(`div`,{children:[(0,C.jsx)(E,{children:`Kebab menu (open: transparent background, icon color only)`}),(0,C.jsx)(D,{children:(0,C.jsxs)(x,{children:[(0,C.jsx)(g,{variant:`kebab`,children:(0,C.jsx)(c,{size:20})}),(0,C.jsxs)(_,{align:e.align,sideOffset:e.sideOffset,width:e.contentWidth,children:[(0,C.jsx)(y,{children:`Edit`}),(0,C.jsx)(y,{children:`Copy ID`}),(0,C.jsx)(p,{}),(0,C.jsx)(y,{variant:`danger`,children:`Delete permanently`})]})]})})]})},A={light:`Light`,dark:`Dark`,system:`System`},j={args:{align:`start`,triggerText:`Account`,sideOffset:4,contentWidth:220,subContentWidth:180,select:!0,theme:`light`},render:function(e){let[t,n]=w.useState(e.theme);return w.useEffect(()=>{n(e.theme)},[e.theme]),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(E,{children:"SubItem + submenu — chevron on the right, `select` enables checkmark"}),(0,C.jsx)(D,{children:(0,C.jsxs)(x,{children:[(0,C.jsx)(g,{variant:`default`,children:e.triggerText}),(0,C.jsxs)(_,{align:e.align,sideOffset:e.sideOffset,width:e.contentWidth,children:[(0,C.jsxs)(y,{children:[(0,C.jsx)(i,{size:14,"aria-hidden":!0}),`Settings`]}),(0,C.jsxs)(v,{select:e.select,children:[(0,C.jsxs)(m,{detail:A[t],children:[(0,C.jsx)(f,{size:14,"aria-hidden":!0}),`Appearance`]}),(0,C.jsxs)(b,{width:e.subContentWidth,children:[(0,C.jsxs)(y,{selected:t===`light`,onSelect:()=>n(`light`),children:[(0,C.jsx)(f,{size:14,"aria-hidden":!0}),`Light`]}),(0,C.jsxs)(y,{selected:t===`dark`,onSelect:()=>n(`dark`),children:[(0,C.jsx)(o,{size:14,"aria-hidden":!0}),`Dark`]}),(0,C.jsxs)(y,{selected:t===`system`,onSelect:()=>n(`system`),children:[(0,C.jsx)(i,{size:14,"aria-hidden":!0}),`System`]})]})]}),(0,C.jsxs)(v,{children:[(0,C.jsxs)(m,{children:[(0,C.jsx)(l,{size:14,"aria-hidden":!0}),`Help`]}),(0,C.jsxs)(b,{width:200,children:[(0,C.jsx)(y,{children:`Documentation`}),(0,C.jsx)(y,{children:`Get support`}),(0,C.jsx)(y,{children:`Contact`})]})]}),(0,C.jsx)(p,{}),(0,C.jsxs)(y,{variant:`danger`,children:[(0,C.jsx)(a,{size:14,"aria-hidden":!0}),`Log out`]})]})]})})]})}},M={args:{align:`end`,triggerText:`Account`,sideOffset:4,contentWidth:200},render:e=>(0,C.jsxs)(`div`,{children:[(0,C.jsx)(E,{children:`Menu items with icon + text (gap from .item)`}),(0,C.jsx)(D,{children:(0,C.jsxs)(x,{children:[(0,C.jsx)(g,{variant:`default`,children:e.triggerText}),(0,C.jsxs)(_,{align:e.align,sideOffset:e.sideOffset,width:e.contentWidth,children:[(0,C.jsx)(h,{children:`My account`}),(0,C.jsx)(p,{}),(0,C.jsxs)(y,{children:[(0,C.jsx)(s,{size:14,"aria-hidden":!0}),`Profile`]}),(0,C.jsxs)(y,{children:[(0,C.jsx)(i,{size:14,"aria-hidden":!0}),`Settings`]}),(0,C.jsxs)(y,{children:[(0,C.jsx)(u,{size:14,"aria-hidden":!0}),`Team`]}),(0,C.jsx)(p,{}),(0,C.jsxs)(y,{children:[(0,C.jsx)(o,{size:14,"aria-hidden":!0}),`Dark mode`]}),(0,C.jsxs)(y,{children:[(0,C.jsx)(f,{size:14,"aria-hidden":!0}),`Light mode`]}),(0,C.jsx)(p,{}),(0,C.jsxs)(y,{variant:`danger`,children:[(0,C.jsx)(a,{size:14,"aria-hidden":!0}),`Log out`]})]})]})})]})},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    align: 'end',
    triggerVariant: 'default',
    triggerText: 'Options',
    sideOffset: 4,
    contentWidth: 180
  },
  render: args => <div>\r
      <DemoLabel>Click the button to open the menu (hover changes background and text)</DemoLabel>\r
      <DemoBox>\r
        <DropdownMenu>\r
          <DropdownMenuTrigger variant={args.triggerVariant}>\r
            {args.triggerVariant === 'kebab' ? <Ellipsis size={20} /> : args.triggerText}\r
          </DropdownMenuTrigger>\r
          <DropdownMenuContent align={args.align} sideOffset={args.sideOffset} width={args.contentWidth}>\r
            <DropdownMenuLabel>My account</DropdownMenuLabel>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem>Profile</DropdownMenuItem>\r
            <DropdownMenuItem>Settings</DropdownMenuItem>\r
            <DropdownMenuItem>Team</DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem variant="danger">Log out</DropdownMenuItem>\r
          </DropdownMenuContent>\r
        </DropdownMenu>\r
      </DemoBox>\r
    </div>
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    align: 'end',
    sideOffset: 4,
    contentWidth: 180
  },
  render: args => <div>\r
      <DemoLabel>Kebab menu (open: transparent background, icon color only)</DemoLabel>\r
      <DemoBox>\r
        <DropdownMenu>\r
          <DropdownMenuTrigger variant="kebab">\r
            <Ellipsis size={20} />\r
          </DropdownMenuTrigger>\r
          <DropdownMenuContent align={args.align} sideOffset={args.sideOffset} width={args.contentWidth}>\r
            <DropdownMenuItem>Edit</DropdownMenuItem>\r
            <DropdownMenuItem>Copy ID</DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem variant="danger">Delete permanently</DropdownMenuItem>\r
          </DropdownMenuContent>\r
        </DropdownMenu>\r
      </DemoBox>\r
    </div>
}`,...k.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    align: 'start',
    triggerText: 'Account',
    sideOffset: 4,
    contentWidth: 220,
    subContentWidth: 180,
    select: true,
    theme: 'light'
  },
  render: function ItemExtendStory(args) {
    const [theme, setTheme] = React.useState<ThemeOption>(args.theme);
    React.useEffect(() => {
      setTheme(args.theme);
    }, [args.theme]);
    return <div>\r
        <DemoLabel>\r
          SubItem + submenu — chevron on the right, \`select\` enables checkmark\r
        </DemoLabel>\r
        <DemoBox>\r
          <DropdownMenu>\r
            <DropdownMenuTrigger variant="default">{args.triggerText}</DropdownMenuTrigger>\r
            <DropdownMenuContent align={args.align} sideOffset={args.sideOffset} width={args.contentWidth}>\r
              <DropdownMenuItem>\r
                <Settings size={14} aria-hidden />\r
                Settings\r
              </DropdownMenuItem>\r
              <DropdownMenuSub select={args.select}>\r
                <DropdownMenuSubItem detail={THEME_LABELS[theme]}>\r
                  <Sun size={14} aria-hidden />\r
                  Appearance\r
                </DropdownMenuSubItem>\r
                <DropdownMenuSubContent width={args.subContentWidth}>\r
                  <DropdownMenuItem selected={theme === 'light'} onSelect={() => setTheme('light')}>\r
                    <Sun size={14} aria-hidden />\r
                    Light\r
                  </DropdownMenuItem>\r
                  <DropdownMenuItem selected={theme === 'dark'} onSelect={() => setTheme('dark')}>\r
                    <Moon size={14} aria-hidden />\r
                    Dark\r
                  </DropdownMenuItem>\r
                  <DropdownMenuItem selected={theme === 'system'} onSelect={() => setTheme('system')}>\r
                    <Settings size={14} aria-hidden />\r
                    System\r
                  </DropdownMenuItem>\r
                </DropdownMenuSubContent>\r
              </DropdownMenuSub>\r
              <DropdownMenuSub>\r
                <DropdownMenuSubItem>\r
                  <HelpCircle size={14} aria-hidden />\r
                  Help\r
                </DropdownMenuSubItem>\r
                <DropdownMenuSubContent width={200}>\r
                  <DropdownMenuItem>Documentation</DropdownMenuItem>\r
                  <DropdownMenuItem>Get support</DropdownMenuItem>\r
                  <DropdownMenuItem>Contact</DropdownMenuItem>\r
                </DropdownMenuSubContent>\r
              </DropdownMenuSub>\r
              <DropdownMenuSeparator />\r
              <DropdownMenuItem variant="danger">\r
                <LogOut size={14} aria-hidden />\r
                Log out\r
              </DropdownMenuItem>\r
            </DropdownMenuContent>\r
          </DropdownMenu>\r
        </DemoBox>\r
      </div>;
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    align: 'end',
    triggerText: 'Account',
    sideOffset: 4,
    contentWidth: 200
  },
  render: args => <div>\r
      <DemoLabel>Menu items with icon + text (gap from .item)</DemoLabel>\r
      <DemoBox>\r
        <DropdownMenu>\r
          <DropdownMenuTrigger variant="default">{args.triggerText}</DropdownMenuTrigger>\r
          <DropdownMenuContent align={args.align} sideOffset={args.sideOffset} width={args.contentWidth}>\r
            <DropdownMenuLabel>My account</DropdownMenuLabel>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem>\r
              <User size={14} aria-hidden />\r
              Profile\r
            </DropdownMenuItem>\r
            <DropdownMenuItem>\r
              <Settings size={14} aria-hidden />\r
              Settings\r
            </DropdownMenuItem>\r
            <DropdownMenuItem>\r
              <Users size={14} aria-hidden />\r
              Team\r
            </DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem>\r
              <Moon size={14} aria-hidden />\r
              Dark mode\r
            </DropdownMenuItem>\r
            <DropdownMenuItem>\r
              <Sun size={14} aria-hidden />\r
              Light mode\r
            </DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem variant="danger">\r
              <LogOut size={14} aria-hidden />\r
              Log out\r
            </DropdownMenuItem>\r
          </DropdownMenuContent>\r
        </DropdownMenu>\r
      </DemoBox>\r
    </div>
}`,...M.parameters?.docs?.source}}},N=[`Default`,`KebabMenu`,`ItemExtend`,`WithIcons`]}))();export{O as Default,j as ItemExtend,k as KebabMenu,M as WithIcons,N as __namedExportsOrder,T as default};