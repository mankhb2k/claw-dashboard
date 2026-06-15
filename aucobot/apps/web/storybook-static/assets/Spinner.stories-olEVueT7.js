import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-J7ohic6x.js";import{t as i}from"./Button-dxUFHqWY.js";import{t as a}from"./Typography-BLpjlWB_.js";import{n as o,r as s,t as c}from"./ui-BVQXb2az.js";import{t as l}from"./Flex-i1KOO1Yf.js";import{t as u}from"./layout-D0eUeG9n.js";var d,f,p,m,h,g,_,v,y;t((()=>{d=r(),f=e(n()),s(),u(),c(),p={title:`UI/Spinner`,component:o,tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`,`lg`],description:`Spinner size`},loading:{control:`boolean`,description:`Loading visibility`}}},m={args:{size:`md`,loading:!0}},h={render:()=>(0,d.jsxs)(l,{align:`center`,gap:4,children:[(0,d.jsxs)(l,{direction:`column`,align:`center`,gap:1,children:[(0,d.jsx)(o,{size:`sm`}),(0,d.jsx)(a,{variant:`small`,children:`Small`})]}),(0,d.jsxs)(l,{direction:`column`,align:`center`,gap:1,children:[(0,d.jsx)(o,{size:`md`}),(0,d.jsx)(a,{variant:`small`,children:`Medium`})]}),(0,d.jsxs)(l,{direction:`column`,align:`center`,gap:1,children:[(0,d.jsx)(o,{size:`lg`}),(0,d.jsx)(a,{variant:`small`,children:`Large`})]})]})},g={render:()=>(0,d.jsx)(()=>{let[e,t]=f.useState(!0);return(0,d.jsxs)(l,{direction:`column`,gap:2,align:`start`,children:[(0,d.jsxs)(`button`,{onClick:()=>t(!e),style:{padding:`var(--space-2) var(--space-3)`,background:`var(--color-muted)`,border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,cursor:`pointer`},children:[`Toggle Loading: `,e?`ON`:`OFF`]}),(0,d.jsxs)(l,{align:`center`,gap:2,children:[(0,d.jsx)(o,{loading:e}),(0,d.jsx)(a,{variant:`p`,children:e?`Loading data...`:`Data loaded!`})]})]})},{})},_={render:()=>(0,d.jsx)(()=>{let[e,t]=f.useState(!1);return(0,d.jsxs)(i,{onClick:()=>{t(!0),setTimeout(()=>t(!1),2e3)},disabled:e,style:{display:`flex`,alignItems:`center`,gap:`8px`},children:[e&&(0,d.jsx)(o,{size:`sm`}),e?`Processing...`:`Click here`]})},{})},v={render:()=>(0,d.jsx)(()=>{let[e,t]=f.useState(!1),[n,r]=f.useState(!1);return(0,d.jsxs)(l,{align:`center`,gap:2,children:[(0,d.jsx)(`button`,{onClick:()=>{t(!0),setTimeout(()=>{t(!1),r(!n)},1500)},disabled:e,style:{background:`transparent`,border:`none`,cursor:`pointer`,display:`flex`,alignItems:`center`,justifyContent:`center`,padding:`var(--space-2)`,borderRadius:`50%`,color:n?`var(--color-primary)`:`var(--color-muted-foreground)`,transition:`background var(--transition-fast) ease`},children:e?(0,d.jsx)(o,{size:`sm`}):n?(0,d.jsx)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`18`,height:`18`,viewBox:`0 0 24 24`,fill:`currentColor`,children:(0,d.jsx)(`path`,{d:`M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5zm2-2.55l5-2.5 5 2.5V5H7z`})}):(0,d.jsx)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`18`,height:`18`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:(0,d.jsx)(`path`,{d:`M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z`})})}),(0,d.jsx)(a,{variant:`small`,color:`muted`,children:e?`Saving...`:n?`Saved to bookmarks`:`Save to bookmarks`})]})},{})},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    size: "md",
    loading: true
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Flex align="center" gap={4}>\r
      <Flex direction="column" align="center" gap={1}>\r
        <Spinner size="sm" />\r
        <Typography variant="small">Small</Typography>\r
      </Flex>\r
      <Flex direction="column" align="center" gap={1}>\r
        <Spinner size="md" />\r
        <Typography variant="small">Medium</Typography>\r
      </Flex>\r
      <Flex direction="column" align="center" gap={1}>\r
        <Spinner size="lg" />\r
        <Typography variant="small">Large</Typography>\r
      </Flex>\r
    </Flex>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const LoadingDemo = () => {
      const [loading, setLoading] = React.useState(true);
      return <Flex direction="column" gap={2} align="start">\r
          <button onClick={() => setLoading(!loading)} style={{
          padding: "var(--space-2) var(--space-3)",
          background: "var(--color-muted)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer"
        }}>\r
            Toggle Loading: {loading ? "ON" : "OFF"}\r
          </button>\r
          <Flex align="center" gap={2}>\r
            <Spinner loading={loading} />\r
            <Typography variant="p">\r
              {loading ? "Loading data..." : "Data loaded!"}\r
            </Typography>\r
          </Flex>\r
        </Flex>;
    };
    return <LoadingDemo />;
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => {
    const ButtonDemo = () => {
      const [loading, setLoading] = React.useState(false);
      const handleClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
      };
      return <Button onClick={handleClick} disabled={loading} style={{
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>\r
          {loading && <Spinner size="sm" />}\r
          {loading ? "Processing..." : "Click here"}\r
        </Button>;
    };
    return <ButtonDemo />;
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const BookmarkDemo = () => {
      const [loading, setLoading] = React.useState(false);
      const [isBookmarked, setIsBookmarked] = React.useState(false);
      const handleBookmark = () => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setIsBookmarked(!isBookmarked);
        }, 1500);
      };
      return <Flex align="center" gap={2}>\r
          <button onClick={handleBookmark} disabled={loading} style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-2)",
          borderRadius: "50%",
          color: isBookmarked ? "var(--color-primary)" : "var(--color-muted-foreground)",
          transition: "background var(--transition-fast) ease"
        }}>\r
            {loading ? <Spinner size="sm" /> : isBookmarked ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5zm2-2.55l5-2.5 5 2.5V5H7z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>}\r
          </button>\r
          <Typography variant="small" color="muted">\r
            {loading ? "Saving..." : isBookmarked ? "Saved to bookmarks" : "Save to bookmarks"}\r
          </Typography>\r
        </Flex>;
    };
    return <BookmarkDemo />;
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`Sizes`,`LoadingState`,`InsideButton`,`BookmarkAction`]}))();export{v as BookmarkAction,m as Default,_ as InsideButton,g as LoadingState,h as Sizes,y as __namedExportsOrder,p as default};