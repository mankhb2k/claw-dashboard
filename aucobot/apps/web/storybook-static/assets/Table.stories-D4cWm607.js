import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t}from"./iframe-J7ohic6x.js";import{n,t as r}from"./Typography-BLpjlWB_.js";import{a as i,c as a,i as o,l as s,n as c,o as l,r as u,s as d,t as f}from"./Table-Dee5xP9e.js";import{n as p,t as m}from"./Flex-i1KOO1Yf.js";function h({status:e}){return(0,g.jsx)(r,{variant:`xs`,weight:`bold`,as:`span`,style:{display:`inline-block`,padding:`4px 8px`,borderRadius:`var(--radius-full)`,textTransform:`capitalize`,...x[e]},children:e})}var g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{g=t(),p(),n(),s(),_={title:`UI/Table`,component:f,parameters:{layout:`padded`},tags:[`autodocs`],argTypes:{scrollable:{control:`boolean`,description:`Horizontal scroll when content overflows`},size:{control:`select`,options:[`sm`,`md`]}}},v=({children:e})=>(0,g.jsx)(`p`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.05em`,color:`var(--color-muted-foreground)`,fontWeight:600,marginBottom:`12px`},children:e}),y=({children:e})=>(0,g.jsx)(`div`,{style:{width:`100%`,maxWidth:960,padding:`24px`,border:`1px dashed var(--color-border)`,borderRadius:`var(--radius-md)`,background:`var(--color-background)`},children:e}),b=[{model:`GPT-4o`,time:`2 mins ago`,user:`Admin`,status:`Success`,latency:450,tokens:1240,color:`#10b981`},{model:`Claude 3.5 Sonnet`,time:`15 mins ago`,user:`System`,status:`Success`,latency:820,tokens:4200,color:`#f59e0b`},{model:`Gemini 1.5 Pro`,time:`1 hour ago`,user:`API Key`,status:`Failed`,latency:120,tokens:0,color:`#3b82f6`}],x={Success:{background:`color-mix(in srgb, var(--color-success) 15%, transparent)`,color:`var(--color-success)`},Failed:{background:`color-mix(in srgb, var(--color-danger) 15%, transparent)`,color:`var(--color-danger)`}},S={render:()=>(0,g.jsx)(y,{children:(0,g.jsxs)(f,{children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Name`}),(0,g.jsx)(l,{label:`Role`}),(0,g.jsx)(l,{label:`Status`,align:`right`})]})}),(0,g.jsxs)(c,{children:[(0,g.jsxs)(a,{hoverable:!0,children:[(0,g.jsx)(o,{children:(0,g.jsx)(r,{variant:`small`,weight:`medium`,children:`Alice`})}),(0,g.jsx)(o,{children:(0,g.jsx)(r,{variant:`small`,children:`Admin`})}),(0,g.jsx)(o,{align:`right`,children:(0,g.jsx)(h,{status:`Success`})})]}),(0,g.jsxs)(a,{hoverable:!0,children:[(0,g.jsx)(o,{children:(0,g.jsx)(r,{variant:`small`,weight:`medium`,children:`Bob`})}),(0,g.jsx)(o,{children:(0,g.jsx)(r,{variant:`small`,children:`Editor`})}),(0,g.jsx)(o,{align:`right`,children:(0,g.jsx)(h,{status:`Failed`})})]})]})]})})},C={render:()=>(0,g.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:[(0,g.jsxs)(`div`,{children:[(0,g.jsx)(v,{children:`Medium (default)`}),(0,g.jsx)(y,{children:(0,g.jsxs)(f,{size:`md`,children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Column`}),(0,g.jsx)(l,{label:`Value`,align:`right`})]})}),(0,g.jsx)(c,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(o,{children:`Row A`}),(0,g.jsx)(o,{align:`right`,children:`100`})]})})]})})]}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(v,{children:`Small — dense lists`}),(0,g.jsx)(y,{children:(0,g.jsxs)(f,{size:`sm`,children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Column`}),(0,g.jsx)(l,{label:`Value`,align:`right`})]})}),(0,g.jsx)(c,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(o,{children:`Row A`}),(0,g.jsx)(o,{align:`right`,children:`100`})]})})]})})]})]})},w={render:()=>(0,g.jsx)(y,{children:(0,g.jsxs)(f,{children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Left`,align:`left`}),(0,g.jsx)(l,{label:`Center`,align:`center`}),(0,g.jsx)(l,{label:`Right`,align:`right`})]})}),(0,g.jsx)(c,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(o,{align:`left`,children:`Left cell`}),(0,g.jsx)(o,{align:`center`,children:`Center cell`}),(0,g.jsx)(o,{align:`right`,children:`Right cell`})]})})]})})},T={render:()=>(0,g.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`24px`},children:[(0,g.jsxs)(`div`,{children:[(0,g.jsx)(v,{children:`Hoverable rows`}),(0,g.jsx)(y,{children:(0,g.jsxs)(f,{children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Agent`}),(0,g.jsx)(l,{label:`Tokens`,align:`right`})]})}),(0,g.jsxs)(c,{children:[(0,g.jsxs)(a,{hoverable:!0,children:[(0,g.jsx)(o,{children:`main`}),(0,g.jsx)(o,{align:`right`,children:`12,400`})]}),(0,g.jsxs)(a,{hoverable:!0,children:[(0,g.jsx)(o,{children:`support`}),(0,g.jsx)(o,{align:`right`,children:`3,200`})]})]})]})})]}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(v,{children:`Selected row`}),(0,g.jsx)(y,{children:(0,g.jsxs)(f,{children:[(0,g.jsx)(d,{children:(0,g.jsx)(a,{children:(0,g.jsx)(l,{label:`Agent`})})}),(0,g.jsxs)(c,{children:[(0,g.jsx)(a,{selected:!0,children:(0,g.jsx)(o,{children:`Selected agent`})}),(0,g.jsx)(a,{hoverable:!0,children:(0,g.jsx)(o,{children:`Other agent`})})]})]})})]}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(v,{children:`Empty state`}),(0,g.jsx)(y,{children:(0,g.jsxs)(f,{children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Name`}),(0,g.jsx)(l,{label:`Status`})]})}),(0,g.jsx)(c,{children:(0,g.jsx)(i,{colSpan:2,message:`No rows yet`})})]})})]})]})},E={render:()=>(0,g.jsx)(y,{children:(0,g.jsxs)(f,{scrollable:!0,children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`ID`}),(0,g.jsx)(l,{label:`Description`}),(0,g.jsx)(l,{label:`Owner`}),(0,g.jsx)(l,{label:`Region`}),(0,g.jsx)(l,{label:`Created`}),(0,g.jsx)(l,{label:`Amount`,align:`right`})]})}),(0,g.jsx)(c,{children:(0,g.jsxs)(a,{hoverable:!0,children:[(0,g.jsx)(o,{children:`inv_001`}),(0,g.jsx)(o,{children:`Enterprise annual subscription renewal`}),(0,g.jsx)(o,{children:`ops@example.com`}),(0,g.jsx)(o,{children:`ap-southeast-1`}),(0,g.jsx)(o,{children:`2026-06-01`}),(0,g.jsx)(o,{align:`right`,children:`$12,400`})]})}),(0,g.jsx)(u,{children:`Scroll horizontally on narrow viewports`})]})})},D={name:`Dashboard usage (model calls)`,render:()=>(0,g.jsx)(y,{children:(0,g.jsxs)(f,{scrollable:!0,size:`md`,children:[(0,g.jsx)(d,{children:(0,g.jsxs)(a,{children:[(0,g.jsx)(l,{label:`Model / Task`}),(0,g.jsx)(l,{label:`User / Source`}),(0,g.jsx)(l,{label:`Status`}),(0,g.jsx)(l,{label:`Latency`,align:`right`}),(0,g.jsx)(l,{label:`Tokens`,align:`right`})]})}),(0,g.jsx)(c,{children:b.map(e=>(0,g.jsxs)(a,{hoverable:!0,children:[(0,g.jsx)(o,{children:(0,g.jsxs)(m,{align:`center`,gap:12,children:[(0,g.jsx)(`div`,{style:{width:32,height:32,borderRadius:`var(--radius-sm)`,opacity:.8,background:e.color,flexShrink:0},"aria-hidden":!0}),(0,g.jsxs)(m,{direction:`column`,gap:2,children:[(0,g.jsx)(r,{variant:`small`,weight:`medium`,children:e.model}),(0,g.jsx)(r,{variant:`xs`,color:`muted`,children:e.time})]})]})}),(0,g.jsx)(o,{children:(0,g.jsx)(r,{variant:`small`,children:e.user})}),(0,g.jsx)(o,{children:(0,g.jsx)(h,{status:e.status})}),(0,g.jsx)(o,{align:`right`,children:(0,g.jsxs)(r,{variant:`small`,children:[e.latency,`ms`]})}),(0,g.jsx)(o,{align:`right`,children:(0,g.jsx)(r,{variant:`small`,weight:`bold`,children:e.tokens.toLocaleString(`en-US`)})})]},e.model))})]})})},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <DemoBox>\r
      <Table>\r
        <TableHeader>\r
          <TableRow>\r
            <TableHead label="Name" />\r
            <TableHead label="Role" />\r
            <TableHead label="Status" align="right" />\r
          </TableRow>\r
        </TableHeader>\r
        <TableBody>\r
          <TableRow hoverable>\r
            <TableCell>\r
              <Typography variant="small" weight="medium">\r
                Alice\r
              </Typography>\r
            </TableCell>\r
            <TableCell>\r
              <Typography variant="small">Admin</Typography>\r
            </TableCell>\r
            <TableCell align="right">\r
              <StatusBadge status="Success" />\r
            </TableCell>\r
          </TableRow>\r
          <TableRow hoverable>\r
            <TableCell>\r
              <Typography variant="small" weight="medium">\r
                Bob\r
              </Typography>\r
            </TableCell>\r
            <TableCell>\r
              <Typography variant="small">Editor</Typography>\r
            </TableCell>\r
            <TableCell align="right">\r
              <StatusBadge status="Failed" />\r
            </TableCell>\r
          </TableRow>\r
        </TableBody>\r
      </Table>\r
    </DemoBox>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  }}>\r
      <div>\r
        <DemoLabel>Medium (default)</DemoLabel>\r
        <DemoBox>\r
          <Table size="md">\r
            <TableHeader>\r
              <TableRow>\r
                <TableHead label="Column" />\r
                <TableHead label="Value" align="right" />\r
              </TableRow>\r
            </TableHeader>\r
            <TableBody>\r
              <TableRow>\r
                <TableCell>Row A</TableCell>\r
                <TableCell align="right">100</TableCell>\r
              </TableRow>\r
            </TableBody>\r
          </Table>\r
        </DemoBox>\r
      </div>\r
      <div>\r
        <DemoLabel>Small — dense lists</DemoLabel>\r
        <DemoBox>\r
          <Table size="sm">\r
            <TableHeader>\r
              <TableRow>\r
                <TableHead label="Column" />\r
                <TableHead label="Value" align="right" />\r
              </TableRow>\r
            </TableHeader>\r
            <TableBody>\r
              <TableRow>\r
                <TableCell>Row A</TableCell>\r
                <TableCell align="right">100</TableCell>\r
              </TableRow>\r
            </TableBody>\r
          </Table>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <DemoBox>\r
      <Table>\r
        <TableHeader>\r
          <TableRow>\r
            <TableHead label="Left" align="left" />\r
            <TableHead label="Center" align="center" />\r
            <TableHead label="Right" align="right" />\r
          </TableRow>\r
        </TableHeader>\r
        <TableBody>\r
          <TableRow>\r
            <TableCell align="left">Left cell</TableCell>\r
            <TableCell align="center">Center cell</TableCell>\r
            <TableCell align="right">Right cell</TableCell>\r
          </TableRow>\r
        </TableBody>\r
      </Table>\r
    </DemoBox>
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  }}>\r
      <div>\r
        <DemoLabel>Hoverable rows</DemoLabel>\r
        <DemoBox>\r
          <Table>\r
            <TableHeader>\r
              <TableRow>\r
                <TableHead label="Agent" />\r
                <TableHead label="Tokens" align="right" />\r
              </TableRow>\r
            </TableHeader>\r
            <TableBody>\r
              <TableRow hoverable>\r
                <TableCell>main</TableCell>\r
                <TableCell align="right">12,400</TableCell>\r
              </TableRow>\r
              <TableRow hoverable>\r
                <TableCell>support</TableCell>\r
                <TableCell align="right">3,200</TableCell>\r
              </TableRow>\r
            </TableBody>\r
          </Table>\r
        </DemoBox>\r
      </div>\r
      <div>\r
        <DemoLabel>Selected row</DemoLabel>\r
        <DemoBox>\r
          <Table>\r
            <TableHeader>\r
              <TableRow>\r
                <TableHead label="Agent" />\r
              </TableRow>\r
            </TableHeader>\r
            <TableBody>\r
              <TableRow selected>\r
                <TableCell>Selected agent</TableCell>\r
              </TableRow>\r
              <TableRow hoverable>\r
                <TableCell>Other agent</TableCell>\r
              </TableRow>\r
            </TableBody>\r
          </Table>\r
        </DemoBox>\r
      </div>\r
      <div>\r
        <DemoLabel>Empty state</DemoLabel>\r
        <DemoBox>\r
          <Table>\r
            <TableHeader>\r
              <TableRow>\r
                <TableHead label="Name" />\r
                <TableHead label="Status" />\r
              </TableRow>\r
            </TableHeader>\r
            <TableBody>\r
              <TableEmpty colSpan={2} message="No rows yet" />\r
            </TableBody>\r
          </Table>\r
        </DemoBox>\r
      </div>\r
    </div>
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <DemoBox>\r
      <Table scrollable>\r
        <TableHeader>\r
          <TableRow>\r
            <TableHead label="ID" />\r
            <TableHead label="Description" />\r
            <TableHead label="Owner" />\r
            <TableHead label="Region" />\r
            <TableHead label="Created" />\r
            <TableHead label="Amount" align="right" />\r
          </TableRow>\r
        </TableHeader>\r
        <TableBody>\r
          <TableRow hoverable>\r
            <TableCell>inv_001</TableCell>\r
            <TableCell>Enterprise annual subscription renewal</TableCell>\r
            <TableCell>ops@example.com</TableCell>\r
            <TableCell>ap-southeast-1</TableCell>\r
            <TableCell>2026-06-01</TableCell>\r
            <TableCell align="right">$12,400</TableCell>\r
          </TableRow>\r
        </TableBody>\r
        <TableCaption>Scroll horizontally on narrow viewports</TableCaption>\r
      </Table>\r
    </DemoBox>
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Dashboard usage (model calls)",
  render: () => <DemoBox>\r
      <Table scrollable size="md">\r
        <TableHeader>\r
          <TableRow>\r
            <TableHead label="Model / Task" />\r
            <TableHead label="User / Source" />\r
            <TableHead label="Status" />\r
            <TableHead label="Latency" align="right" />\r
            <TableHead label="Tokens" align="right" />\r
          </TableRow>\r
        </TableHeader>\r
        <TableBody>\r
          {USAGE_ROWS.map(row => <TableRow key={row.model} hoverable>\r
              <TableCell>\r
                <Flex align="center" gap={12}>\r
                  <div style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                opacity: 0.8,
                background: row.color,
                flexShrink: 0
              }} aria-hidden />\r
                  <Flex direction="column" gap={2}>\r
                    <Typography variant="small" weight="medium">\r
                      {row.model}\r
                    </Typography>\r
                    <Typography variant="xs" color="muted">\r
                      {row.time}\r
                    </Typography>\r
                  </Flex>\r
                </Flex>\r
              </TableCell>\r
              <TableCell>\r
                <Typography variant="small">{row.user}</Typography>\r
              </TableCell>\r
              <TableCell>\r
                <StatusBadge status={row.status} />\r
              </TableCell>\r
              <TableCell align="right">\r
                <Typography variant="small">{row.latency}ms</Typography>\r
              </TableCell>\r
              <TableCell align="right">\r
                <Typography variant="small" weight="bold">\r
                  {row.tokens.toLocaleString("en-US")}\r
                </Typography>\r
              </TableCell>\r
            </TableRow>)}\r
        </TableBody>\r
      </Table>\r
    </DemoBox>
}`,...D.parameters?.docs?.source}}},O=[`Default`,`Sizes`,`Alignments`,`States`,`Scrollable`,`DashboardUsage`]}))();export{w as Alignments,D as DashboardUsage,S as Default,E as Scrollable,C as Sizes,T as States,O as __namedExportsOrder,_ as default};