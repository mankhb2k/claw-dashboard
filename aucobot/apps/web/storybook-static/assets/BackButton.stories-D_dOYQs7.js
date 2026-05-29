import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,f as n,m as r}from"./iframe-D8t7WUQB.js";import{ot as i,t as a}from"./lucide-react-BKuYmqPY.js";var o,s,c,l,u,d,f=e((()=>{o=`_root_mvr87_3`,s=`_iconOnly_mvr87_71`,c=`_withLabel_mvr87_83`,l=`_icon_mvr87_71`,u=`_label_mvr87_109`,d={root:o,iconOnly:s,withLabel:c,icon:l,label:u}}));function p({href:e=h,onClick:t,children:n,className:a=``,disabled:o=!1}){let s=r(),c=n!=null&&n!==!1;return(0,m.jsxs)(`button`,{type:`button`,className:[d.root,c?d.withLabel:d.iconOnly,a].filter(Boolean).join(` `),onClick:()=>{if(!o){if(t){t();return}s.push(e)}},disabled:o,"aria-label":c?void 0:`Back`,children:[(0,m.jsx)(i,{size:g,"aria-hidden":!0,className:d.icon}),c?(0,m.jsx)(`span`,{className:d.label,children:n}):null]})}var m,h,g,_=e((()=>{m=t(),n(),a(),f(),h=`/dashboard/agent`,g=18,p.__docgenInfo={description:``,methods:[],displayName:`BackButton`,props:{href:{required:!1,tsType:{name:`string`},description:`Destination URL when clicked (default: /dashboard/agent)`,defaultValue:{value:`"/dashboard/agent"`,computed:!1}},onClick:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:`Override navigation behavior`},children:{required:!1,tsType:{name:`ReactReactNode`,raw:`React.ReactNode`},description:`Label displayed next to icon — entire button region`},className:{required:!1,tsType:{name:`string`},description:`Additional class names`,defaultValue:{value:`""`,computed:!1}},disabled:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}}}}})),v,y,b,x,S,C,w,T,E,D;e((()=>{v=t(),_(),y={title:`Dashboard/BackButton`,component:p,parameters:{layout:`centered`,nextjs:{appDirectory:!0,navigation:{pathname:`/dashboard/agent/create`}}},tags:[`autodocs`],decorators:[e=>(0,v.jsx)(`div`,{style:{padding:`20px`,background:`var(--color-background)`,borderRadius:`var(--radius-lg)`,border:`1px solid var(--color-border)`},children:(0,v.jsx)(e,{})})],argTypes:{href:{control:`text`},disabled:{control:`boolean`},onClick:{action:`clicked`}}},b={args:{href:`/dashboard/agent`}},x={args:{href:`/dashboard/agent`,children:`Edit Agent`}},S={args:{href:`/dashboard/agent`,children:`Create New Agent`}},C={args:{href:`/dashboard/overview`,children:`Back to Overview`}},w={args:{children:`Edit Agent`,onClick:()=>{}}},T={args:{children:`Edit Agent`,disabled:!0}},E={args:{disabled:!0}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    href: "/dashboard/agent"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    href: "/dashboard/agent",
    children: "Edit Agent"
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    href: "/dashboard/agent",
    children: "Create New Agent"
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    href: "/dashboard/overview",
    children: "Back to Overview"
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    children: "Edit Agent",
    onClick: () => {}
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    children: "Edit Agent",
    disabled: true
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...E.parameters?.docs?.source}}},D=[`IconOnly`,`WithLabel`,`CreateLabel`,`CustomHref`,`WithOnClick`,`Disabled`,`DisabledIconOnly`]}))();export{S as CreateLabel,C as CustomHref,T as Disabled,E as DisabledIconOnly,b as IconOnly,x as WithLabel,w as WithOnClick,D as __namedExportsOrder,y as default};