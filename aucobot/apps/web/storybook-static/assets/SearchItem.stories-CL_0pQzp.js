import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-D8t7WUQB.js";import{n as i,t as a}from"./lucide-react-BKuYmqPY.js";import{n as o,t as s}from"./Input-DCRp7IqI.js";var c,l,u,d,f=t((()=>{c=`_searchContainer_guyut_2`,l=`_searchInput_guyut_9`,u=`_clearButton_guyut_14`,d={searchContainer:c,searchInput:l,clearButton:u}}));function p({value:e,onChange:t,placeholder:n=`Tìm kiếm...`,id:r=`search-input`,className:a=``,maxWidth:o}){let c=()=>{t(``)},l=o?{maxWidth:typeof o==`number`?`${o}px`:o}:void 0;return(0,m.jsxs)(`div`,{className:`${d.searchContainer} ${a}`,style:l,children:[(0,m.jsx)(s,{id:r,type:`text`,"aria-label":n,placeholder:n,value:e,autoComplete:`off`,spellCheck:!1,className:d.searchInput,onChange:e=>t(e.target.value),onKeyDown:e=>{e.key===`Enter`&&e.preventDefault()}}),e&&(0,m.jsx)(`button`,{type:`button`,className:d.clearButton,onClick:c,"aria-label":`Xóa tìm kiếm`,children:(0,m.jsx)(i,{size:16})})]})}var m,h=t((()=>{m=r(),o(),a(),f(),p.__docgenInfo={description:``,methods:[],displayName:`SearchItem`,props:{value:{required:!0,tsType:{name:`string`},description:`Giá trị text tìm kiếm hiện tại`},onChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(value: string) => void`,signature:{arguments:[{type:{name:`string`},name:`value`}],return:{name:`void`}}},description:`Callback sự kiện thay đổi giá trị nhập`},placeholder:{required:!1,tsType:{name:`string`},description:`Gợi ý hiển thị trong ô input`,defaultValue:{value:`"Tìm kiếm..."`,computed:!1}},id:{required:!1,tsType:{name:`string`},description:`ID duy nhất cho thẻ input`,defaultValue:{value:`"search-input"`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:`Tên class bổ sung bên ngoài`,defaultValue:{value:`""`,computed:!1}},maxWidth:{required:!1,tsType:{name:`union`,raw:`string | number`,elements:[{name:`string`},{name:`number`}]},description:`Độ rộng tối đa (ví dụ: '320px', 360)`}}}}));function g(e){let[t,n]=(0,v.useState)(e.value||``);return(0,_.jsx)(p,{...e,value:t,onChange:n})}var _,v,y,b,x,S,C,w,T;t((()=>{_=r(),v=e(n()),h(),y={title:`Dashboard/SearchItem`,component:p,parameters:{layout:`centered`},tags:[`autodocs`],decorators:[e=>(0,_.jsx)(`div`,{style:{width:`400px`,padding:`20px`,background:`var(--color-background)`,borderRadius:`var(--radius-lg)`,border:`1px solid var(--color-border)`},children:(0,_.jsx)(e,{})})]},b={render:e=>(0,_.jsx)(g,{...e}),args:{placeholder:`Gõ thử để trải nghiệm nút Clear...`,id:`search-interactive`}},x={args:{value:``,onChange:()=>{},placeholder:`Tìm kiếm agent, kỹ năng...`}},S={args:{value:`Claude 3.5 Sonnet`,onChange:()=>{},placeholder:`Tìm kiếm...`}},C={args:{value:``,onChange:()=>{},placeholder:`Tìm kiếm theo tên kênh kết nối...`}},w={args:{value:``,onChange:()=>{},placeholder:`Rộng tối đa 200px...`,maxWidth:200}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: args => <SearchItemInteractive {...args} />,
  args: {
    placeholder: "Gõ thử để trải nghiệm nút Clear...",
    id: "search-interactive"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Tìm kiếm agent, kỹ năng..."
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    value: "Claude 3.5 Sonnet",
    onChange: () => {},
    placeholder: "Tìm kiếm..."
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Tìm kiếm theo tên kênh kết nối..."
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Rộng tối đa 200px...",
    maxWidth: 200
  }
}`,...w.parameters?.docs?.source}}},T=[`Interactive`,`Default`,`WithText`,`CustomPlaceholder`,`CustomMaxWidth`]}))();export{w as CustomMaxWidth,C as CustomPlaceholder,x as Default,b as Interactive,S as WithText,T as __namedExportsOrder,y as default};