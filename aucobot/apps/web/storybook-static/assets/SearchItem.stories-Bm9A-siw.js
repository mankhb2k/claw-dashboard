import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{n as i,t as a}from"./lucide-react-sgqGO4mA.js";import{n as o,t as s}from"./Input-DdeIBfR1.js";var c,l,u,d,f,p=t((()=>{c=`_searchContainer_ayn7m_2`,l=`_pageSpacing_ayn7m_9`,u=`_searchInput_ayn7m_14`,d=`_clearButton_ayn7m_19`,f={searchContainer:c,pageSpacing:l,searchInput:u,clearButton:d}}));function m({value:e,onChange:t,placeholder:n=`Searching...`,id:r=`search-input`,className:a=``,maxWidth:o,size:c=`md`,pageSpacing:l=!1}){let u=()=>{t(``)},d=o?{maxWidth:typeof o==`number`?`${o}px`:o}:void 0;return(0,h.jsxs)(`div`,{className:`${f.searchContainer} ${l?f.pageSpacing:``} ${a}`.trim(),style:d,"data-size":c,children:[(0,h.jsx)(s,{id:r,type:`text`,size:c,labelPosition:`none`,"aria-label":n,placeholder:n,value:e,autoComplete:`off`,spellCheck:!1,className:f.searchInput,onChange:e=>t(e.target.value),onKeyDown:e=>{e.key===`Enter`&&e.preventDefault()}}),e&&(0,h.jsx)(`button`,{type:`button`,className:f.clearButton,onClick:u,"aria-label":`Clear search`,children:(0,h.jsx)(i,{size:16})})]})}var h,g=t((()=>{h=r(),o(),a(),p(),m.__docgenInfo={description:``,methods:[],displayName:`SearchItem`,props:{value:{required:!0,tsType:{name:`string`},description:`Current search text`},onChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(value: string) => void`,signature:{arguments:[{type:{name:`string`},name:`value`}],return:{name:`void`}}},description:`Called when the input value changes`},placeholder:{required:!1,tsType:{name:`string`},description:`Input placeholder`,defaultValue:{value:`"Searching..."`,computed:!1}},id:{required:!1,tsType:{name:`string`},description:`Input element id`,defaultValue:{value:`"search-input"`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:`Extra wrapper class names`,defaultValue:{value:`""`,computed:!1}},maxWidth:{required:!1,tsType:{name:`union`,raw:`string | number`,elements:[{name:`string`},{name:`number`}]},description:`Max width (e.g. '320px', 360)`},size:{required:!1,tsType:{name:`InputSize`},description:"Input size — defaults to `md`",defaultValue:{value:`"md"`,computed:!1}},pageSpacing:{required:!1,tsType:{name:`boolean`},description:`Margin 16px trên/dưới — dùng trên list page dưới TitleHeader`,defaultValue:{value:`false`,computed:!1}}}}}));function _(e){let[t,n]=(0,y.useState)(e.value||``);return(0,v.jsx)(m,{...e,value:t,onChange:n})}var v,y,b,x,S,C,w,T,E,D,O,k;t((()=>{v=r(),y=e(n()),g(),b={title:`Dashboard/SearchItem`,component:m,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`]},maxWidth:{control:`text`}}},x=({children:e})=>(0,v.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),S=({children:e})=>(0,v.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`,padding:`32px`,minWidth:`400px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),C={args:{value:``,onChange:()=>{},placeholder:`Search agents, skills...`,size:`md`,pageSpacing:!0}},w={render:()=>(0,v.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:(0,v.jsxs)(`div`,{children:[(0,v.jsx)(x,{children:`Sizes`}),(0,v.jsxs)(S,{children:[(0,v.jsx)(m,{id:`search-size-md`,value:``,onChange:()=>{},placeholder:`Medium (default)`,size:`md`}),(0,v.jsx)(m,{id:`search-size-sm`,value:``,onChange:()=>{},placeholder:`Small`,size:`sm`})]})]})})},T={args:{value:`Claude 3.5 Sonnet`,onChange:()=>{},placeholder:`Searching...`,size:`md`}},E={render:e=>(0,v.jsx)(_,{...e}),args:{placeholder:`Type to try the clear button...`,id:`search-interactive`,size:`md`}},D={args:{value:``,onChange:()=>{},placeholder:`Search by connector name...`,size:`md`}},O={args:{value:``,onChange:()=>{},placeholder:`Max width 200px...`,maxWidth:200,size:`md`}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Search agents, skills...",
    size: "md",
    pageSpacing: true
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  }}>\r
      <div>\r
        <DemoLabel>Sizes</DemoLabel>\r
        <DemoBox>\r
          <SearchItem id="search-size-md" value="" onChange={() => {}} placeholder="Medium (default)" size="md" />\r
          <SearchItem id="search-size-sm" value="" onChange={() => {}} placeholder="Small" size="sm" />\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    value: "Claude 3.5 Sonnet",
    onChange: () => {},
    placeholder: "Searching...",
    size: "md"
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: args => <SearchItemInteractive {...args} />,
  args: {
    placeholder: "Type to try the clear button...",
    id: "search-interactive",
    size: "md"
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Search by connector name...",
    size: "md"
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Max width 200px...",
    maxWidth: 200,
    size: "md"
  }
}`,...O.parameters?.docs?.source}}},k=[`Default`,`Sizes`,`WithText`,`Interactive`,`CustomPlaceholder`,`CustomMaxWidth`]}))();export{O as CustomMaxWidth,D as CustomPlaceholder,C as Default,E as Interactive,w as Sizes,T as WithText,k as __namedExportsOrder,b as default};