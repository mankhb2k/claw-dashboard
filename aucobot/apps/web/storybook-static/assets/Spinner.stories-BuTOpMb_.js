import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{P as n,d as r}from"./iframe-D8t7WUQB.js";import{t as i}from"./Button-CVrsnW4w.js";import{n as a,r as o,t as s}from"./ui-DEP7NoVw.js";import{t as c}from"./Typography-5rlSyI0z.js";import{n as l}from"./Box-BK_5Sy_L.js";import{n as u}from"./Container-CtLlDOns.js";import{n as d,t as f}from"./Flex-DeArrcJD.js";import{n as p}from"./Grid-DC36zUUg.js";var m=t((()=>{l(),d(),p(),u()})),h,g,_,v,y,b,x,S,C;t((()=>{h=r(),g=e(n()),o(),m(),s(),_={title:`UI/Spinner`,component:a,tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`sm`,`md`,`lg`],description:`Spinner size`},loading:{control:`boolean`,description:`Loading visibility`}}},v={args:{size:`md`,loading:!0}},y={render:()=>(0,h.jsxs)(f,{align:`center`,gap:4,children:[(0,h.jsxs)(f,{direction:`column`,align:`center`,gap:1,children:[(0,h.jsx)(a,{size:`sm`}),(0,h.jsx)(c,{variant:`small`,children:`Small`})]}),(0,h.jsxs)(f,{direction:`column`,align:`center`,gap:1,children:[(0,h.jsx)(a,{size:`md`}),(0,h.jsx)(c,{variant:`small`,children:`Medium`})]}),(0,h.jsxs)(f,{direction:`column`,align:`center`,gap:1,children:[(0,h.jsx)(a,{size:`lg`}),(0,h.jsx)(c,{variant:`small`,children:`Large`})]})]})},b={render:()=>(0,h.jsx)(()=>{let[e,t]=g.useState(!0);return(0,h.jsxs)(f,{direction:`column`,gap:2,align:`start`,children:[(0,h.jsxs)(`button`,{onClick:()=>t(!e),style:{padding:`var(--space-2) var(--space-3)`,background:`var(--color-muted)`,border:`1px solid var(--color-border)`,borderRadius:`var(--radius-md)`,cursor:`pointer`},children:[`Toggle Loading: `,e?`ON`:`OFF`]}),(0,h.jsxs)(f,{align:`center`,gap:2,children:[(0,h.jsx)(a,{loading:e}),(0,h.jsx)(c,{variant:`p`,children:e?`Loading data...`:`Data loaded!`})]})]})},{})},x={render:()=>(0,h.jsx)(()=>{let[e,t]=g.useState(!1);return(0,h.jsxs)(i,{onClick:()=>{t(!0),setTimeout(()=>t(!1),2e3)},disabled:e,style:{display:`flex`,alignItems:`center`,gap:`8px`},children:[e&&(0,h.jsx)(a,{size:`sm`}),e?`Processing...`:`Click here`]})},{})},S={render:()=>(0,h.jsx)(()=>{let[e,t]=g.useState(!1),[n,r]=g.useState(!1);return(0,h.jsxs)(f,{align:`center`,gap:2,children:[(0,h.jsx)(`button`,{onClick:()=>{t(!0),setTimeout(()=>{t(!1),r(!n)},1500)},disabled:e,style:{background:`transparent`,border:`none`,cursor:`pointer`,display:`flex`,alignItems:`center`,justifyContent:`center`,padding:`var(--space-2)`,borderRadius:`50%`,color:n?`var(--color-primary)`:`var(--color-muted-foreground)`,transition:`background var(--transition-fast) ease`},children:e?(0,h.jsx)(a,{size:`sm`}):n?(0,h.jsx)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`18`,height:`18`,viewBox:`0 0 24 24`,fill:`currentColor`,children:(0,h.jsx)(`path`,{d:`M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5zm2-2.55l5-2.5 5 2.5V5H7z`})}):(0,h.jsx)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`18`,height:`18`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:(0,h.jsx)(`path`,{d:`M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z`})})}),(0,h.jsx)(c,{variant:`small`,color:`muted`,children:e?`Saving...`:n?`Saved to bookmarks`:`Save to bookmarks`})]})},{})},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    size: "md",
    loading: true
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C=[`Default`,`Sizes`,`LoadingState`,`InsideButton`,`BookmarkAction`]}))();export{S as BookmarkAction,v as Default,x as InsideButton,b as LoadingState,y as Sizes,C as __namedExportsOrder,_ as default};