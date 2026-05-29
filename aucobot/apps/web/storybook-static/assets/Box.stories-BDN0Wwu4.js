import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-D8t7WUQB.js";import{n,t as r}from"./Box-BK_5Sy_L.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`Layout/Box`,component:r,tags:[`autodocs`],argTypes:{p:{control:`number`},px:{control:`number`},py:{control:`number`},pt:{control:`number`},pb:{control:`number`},pl:{control:`number`},pr:{control:`number`},radius:{control:`select`,options:[`sm`,`md`,`lg`,`xl`,`full`]},color:{control:`select`,options:[`white`,`subtle`,`surface`,`primary-dim`,`danger-dim`,`success-dim`,`primary`,`success`,`warning`,`danger`]},border:{control:`boolean`}}},o={args:{p:4,children:`A simple box.`}},s={render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,width:`500px`},children:[(0,i.jsx)(`p`,{style:{fontSize:`12px`,fontWeight:600},children:`DIM COLORS`}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,flexWrap:`wrap`},children:[(0,i.jsx)(r,{color:`primary-dim`,p:3,children:`Primary Dim`}),(0,i.jsx)(r,{color:`danger-dim`,p:3,children:`Danger Dim`}),(0,i.jsx)(r,{color:`success-dim`,p:3,children:`Success Dim`})]}),(0,i.jsx)(`p`,{style:{fontSize:`12px`,fontWeight:600,marginTop:`16px`},children:`SOLID COLORS`}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,flexWrap:`wrap`},children:[(0,i.jsx)(r,{color:`primary`,p:3,width:`100px`,style:{textAlign:`center`},children:`Primary`}),(0,i.jsx)(r,{color:`success`,p:3,width:`100px`,style:{textAlign:`center`},children:`Success`}),(0,i.jsx)(r,{color:`warning`,p:3,width:`100px`,style:{textAlign:`center`},children:`Warning`}),(0,i.jsx)(r,{color:`danger`,p:3,width:`100px`,style:{textAlign:`center`},children:`Danger`})]}),(0,i.jsx)(`p`,{style:{fontSize:`12px`,fontWeight:600,marginTop:`16px`},children:`CUSTOM COLORS`}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,flexWrap:`wrap`},children:[(0,i.jsx)(r,{color:`#6366f1`,p:3,radius:`md`,children:`Indigo (#6366f1)`}),(0,i.jsx)(r,{color:`hotpink`,p:3,radius:`md`,children:`Hot Pink`}),(0,i.jsx)(r,{color:`rgba(0, 128, 128, 0.5)`,p:3,radius:`md`,children:`Teal Alpha`})]})]})},c={args:{color:`primary`,p:6,width:`100%`,style:{textAlign:`center`,fontWeight:`bold`},children:`BOX SOLID PRIMARY`}},l={render:()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,width:`500px`},children:[(0,i.jsx)(`p`,{style:{fontSize:`12px`,fontWeight:600},children:`PIXEL VALUES (NUMBERS)`}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,flexWrap:`wrap`,alignItems:`center`},children:[(0,i.jsx)(r,{color:`surface`,p:10,border:!0,children:`Padding 10 (10px)`}),(0,i.jsx)(r,{color:`surface`,p:32,border:!0,children:`Padding 32 (32px)`}),(0,i.jsx)(r,{color:`surface`,px:30,py:5,border:!0,children:`PX 30, PY 5`})]}),(0,i.jsx)(`p`,{style:{fontSize:`12px`,fontWeight:600,marginTop:`16px`},children:`PER-SIDE SPACING`}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,flexWrap:`wrap`,alignItems:`center`},children:[(0,i.jsx)(r,{color:`surface`,p:20,pt:2,border:!0,children:`P=20, PT=2`}),(0,i.jsxs)(r,{color:`surface`,py:30,px:10,border:!0,children:[`PY=30, PX=`,10]})]})]})},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    p: 4,
    children: 'A simple box.'
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '500px'
  }}>\r
      <p style={{
      fontSize: '12px',
      fontWeight: 600
    }}>DIM COLORS</p>\r
      <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>\r
        <Box color="primary-dim" p={3}>Primary Dim</Box>\r
        <Box color="danger-dim" p={3}>Danger Dim</Box>\r
        <Box color="success-dim" p={3}>Success Dim</Box>\r
      </div>\r
\r
      <p style={{
      fontSize: '12px',
      fontWeight: 600,
      marginTop: '16px'
    }}>SOLID COLORS</p>\r
      <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>\r
        <Box color="primary" p={3} width="100px" style={{
        textAlign: 'center'
      }}>Primary</Box>\r
        <Box color="success" p={3} width="100px" style={{
        textAlign: 'center'
      }}>Success</Box>\r
        <Box color="warning" p={3} width="100px" style={{
        textAlign: 'center'
      }}>Warning</Box>\r
        <Box color="danger" p={3} width="100px" style={{
        textAlign: 'center'
      }}>Danger</Box>\r
      </div>\r
\r
      <p style={{
      fontSize: '12px',
      fontWeight: 600,
      marginTop: '16px'
    }}>CUSTOM COLORS</p>\r
      <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>\r
        <Box color="#6366f1" p={3} radius="md">Indigo (#6366f1)</Box>\r
        <Box color="hotpink" p={3} radius="md">Hot Pink</Box>\r
        <Box color="rgba(0, 128, 128, 0.5)" p={3} radius="md">Teal Alpha</Box>\r
      </div>\r
    </div>
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    color: 'primary',
    p: 6,
    width: '100%',
    style: {
      textAlign: 'center',
      fontWeight: 'bold'
    },
    children: 'BOX SOLID PRIMARY'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '500px'
  }}>\r
      <p style={{
      fontSize: '12px',
      fontWeight: 600
    }}>PIXEL VALUES (NUMBERS)</p>\r
      <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>\r
        <Box color="surface" p={10} border>Padding 10 (10px)</Box>\r
        <Box color="surface" p={32} border>Padding 32 (32px)</Box>\r
        <Box color="surface" px={30} py={5} border>PX 30, PY 5</Box>\r
      </div>\r
\r
      <p style={{
      fontSize: '12px',
      fontWeight: 600,
      marginTop: '16px'
    }}>PER-SIDE SPACING</p>\r
      <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>\r
        <Box color="surface" p={20} pt={2} border>P=20, PT=2</Box>\r
        <Box color="surface" py={30} px={10} border>PY=30, PX={10}</Box>\r
      </div>\r
    </div>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`BackgroundColors`,`Combined`,`ArbitrarySpacing`]}))();export{l as ArbitrarySpacing,s as BackgroundColors,c as Combined,o as Default,u as __namedExportsOrder,a as default};