"use client";

import React, { useState } from "react";
import { Box, Flex } from "@/components/layout";
import {
  Typography,
  Input,
  Button,
  Avatar,
  Card,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import {
  Send,
  RotateCcw,
  Settings,
  Globe,
  Bot,
  Layout,
  Terminal,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { ChatMessageBubble } from "@/app/(dashboard)/dashboard/chat/_components/ChatMessageBubble";
import { PreviewCollaborationBanner } from "../PreviewCollaborationBanner/PreviewCollaborationBanner";
import styles from "./PreviewPanel.module.css";

interface PreviewPanelProps {
  agentSlug?: string;
}

type PreviewTab = "playground" | "canvas" | "diagnostics";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type LogEntry = {
  time: string;
  tag: string;
  isError?: boolean;
  text: string;
};

const INITIAL_ASSISTANT_MESSAGE =
  "Hello! I'm the Chief Accountant. How can I help with invoices or VAT today?";

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, role: "assistant", content: INITIAL_ASSISTANT_MESSAGE },
];

const INITIAL_LOGS: LogEntry[] = [
  { time: "16:20:01", tag: "[GATEWAY]", text: "Initializing session connection on port 18789..." },
  { time: "16:20:02", tag: "[GATEWAY]", text: "Session handshakes successful. ID: sess_981249" },
  { time: "16:20:03", tag: "[SANDBOX]", text: "Bootstrapping Docker execution container (execPolicy='on-miss')..." },
  { time: "16:20:04", tag: "[SANDBOX]", text: "Allowlisted binary packages loaded: [python, node, git]" },
  { time: "16:20:05", tag: "[AGENT]", text: "Standing orders compiled. Identity loaded (IDENTITY.md & SOUL.md)" },
];

function ThoughtLog({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <Box border color="subtle" radius="md" px={12} py={8} className={styles.thoughtLog}>
      <Flex align="center" gap={8}>
        <Icon size={14} aria-hidden />
        <Typography variant="small" color="muted">
          {text}
        </Typography>
      </Flex>
    </Box>
  );
}

export function PreviewPanel({ agentSlug }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("playground");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    const userText = inputMessage.trim();
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: userText }]);
    setLogs((prev) => [
      ...prev,
      { time: timestamp, tag: "[INBOUND]", text: `User message received: "${userText}"` },
      { time: timestamp, tag: "[ROUTER]", text: "Steering message flow to active Pi Agent instance..." },
    ]);

    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const responseTime = new Date().toLocaleTimeString();
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "I've reviewed the data and built a provisional revenue sheet with a chart in the Canvas tab. Take a look!",
        },
      ]);
      setLogs((prev) => [
        ...prev,
        { time: responseTime, tag: "[AGENT]", text: "Prompt builder merged active SKILL.md. Triggering ExecTool..." },
        { time: responseTime, tag: "[SANDBOX]", text: 'Running safe script: python -c "print(15000000 * 0.1)"' },
        { time: responseTime, tag: "[SANDBOX]", text: "Command completed. Output: 1500000.0 (Execution time: 42ms)" },
        { time: responseTime, tag: "[CANVAS]", text: "Canvas UI payload sent: /__openclaw__/canvas/render_chart" },
      ]);
    }, 1500);
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setLogs(INITIAL_LOGS);
    setIsTyping(false);
  };

  return (
    <Flex direction="column" fullWidth fullHeight className={styles.root}>
      <Flex justify="between" align="center" className={styles.header}>
        <Flex align="center" gap={12} className={styles.headerStart}>
          <Typography variant="p" weight="bold">
            Preview
          </Typography>
          <ToggleGroup
            type="single"
            value={activeTab}
            onValueChange={(value) => {
              if (value === "playground" || value === "canvas" || value === "diagnostics") {
                setActiveTab(value);
              }
            }}
            size="sm"
            className={styles.tabToggle}
          >
            <ToggleGroupItem value="playground" className={styles.tabItem}>
              <PlayCircle size={14} aria-hidden />
              Playground
            </ToggleGroupItem>
            <ToggleGroupItem value="canvas" className={styles.tabItem}>
              <Layout size={14} aria-hidden />
              Canvas
            </ToggleGroupItem>
            <ToggleGroupItem value="diagnostics" className={styles.tabItem}>
              <Terminal size={14} aria-hidden />
              Diagnostics
            </ToggleGroupItem>
          </ToggleGroup>
        </Flex>

        <Flex align="center" gap={8}>
          <Box color="primary-dim" px={12} py={4} radius="full">
            <Typography variant="xs" color="muted">
              Claude 3.5 Sonnet
            </Typography>
          </Box>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Refresh conversation"
            onClick={resetChat}
          >
            <RotateCcw size={16} />
          </Button>
          <Button type="button" variant="ghost" size="icon" title="Playground settings">
            <Settings size={16} />
          </Button>
        </Flex>
      </Flex>

      {agentSlug ? <PreviewCollaborationBanner agentSlug={agentSlug} /> : null}

      <Flex direction="column" className={styles.body}>
        {activeTab === "playground" && (
          <>
            <Flex direction="column" gap={16} className={styles.chatArea}>
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <ChatMessageBubble key={msg.id} role="user" text={msg.content} />
                ) : (
                  <Flex key={msg.id} direction="column" gap={8} className={styles.assistantBlock}>
                    {msg.id > 1 && (
                      <ThoughtLog
                        icon={Globe}
                        text='Searching Google for "Latest corporate tax rate"... [Done]'
                      />
                    )}
                    {msg.id > 2 && (
                      <ThoughtLog
                        icon={Bot}
                        text="Delegating to [Tech Support] for invoice reconciliation... [Done]"
                      />
                    )}
                    <ChatMessageBubble role="assistant" text={msg.content} />
                  </Flex>
                ),
              )}

              {isTyping && (
                <Flex align="start" gap={12} className={styles.typingRow}>
                  <Avatar fallback="💼" size="md" />
                  <Box border radius="lg" color="surface" p={12} className={styles.typingBubble}>
                    <Flex align="center" gap={8}>
                      <Spinner size="sm" />
                      <Typography variant="small" color="muted">
                        Thinking...
                      </Typography>
                    </Flex>
                  </Box>
                </Flex>
              )}
            </Flex>

            <Flex direction="column" gap={8} className={styles.chatInputArea}>
              <Flex align="center" gap={8} className={styles.inputRow}>
                <div className={styles.inputWrap}>
                  <Input
                    placeholder="Message the agent to test..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                    className={styles.messageInput}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isTyping}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </Flex>
              <Typography variant="xs" color="muted" className={styles.inputHint}>
                Playground reloads automatically when you change settings on the left.
              </Typography>
            </Flex>
          </>
        )}

        {activeTab === "canvas" && (
          <Flex center fullWidth fullHeight className={styles.canvasContainer}>
            <Card disableHover className={styles.canvasCard}>
              <Flex direction="column" gap={4}>
                <Typography variant="p" weight="bold">
                  📊 Q2 Revenue VAT Calculation
                </Typography>
                <Typography variant="small" color="muted">
                  Real-time render by Canvas Host
                </Typography>
              </Flex>

              <div className={styles.canvasChart} aria-hidden>
                <div className={`${styles.chartBar} ${styles.chartBarT4}`}>
                  <span className={styles.chartBarLabel}>T4</span>
                </div>
                <div className={`${styles.chartBar} ${styles.chartBarT5}`}>
                  <span className={styles.chartBarLabel}>T5</span>
                </div>
                <div className={`${styles.chartBar} ${styles.chartBarT6}`}>
                  <span className={styles.chartBarLabel}>T6</span>
                </div>
              </div>

              <Flex justify="between" align="center">
                <Flex direction="column" gap={4}>
                  <Typography variant="small" color="muted">
                    Total revenue
                  </Typography>
                  <Typography variant="p" weight="bold">
                    $15,000,000
                  </Typography>
                </Flex>
                <Flex direction="column" gap={4} align="end">
                  <Typography variant="small" color="muted">
                    VAT (10%)
                  </Typography>
                  <Typography variant="p" weight="bold" color="primary">
                    $1,500,000
                  </Typography>
                </Flex>
              </Flex>

              <Button type="button" size="sm" fullWidth>
                Export PDF Report
              </Button>
            </Card>
          </Flex>
        )}

        {activeTab === "diagnostics" && (
          <div className={styles.terminal}>
            {logs.map((log, idx) => (
              <div key={idx} className={styles.logRow}>
                <span className={styles.logTime}>[{log.time}]</span>
                <span className={log.isError ? styles.logTagError : styles.logTag}>{log.tag}</span>
                <span className={styles.logText}>{log.text}</span>
              </div>
            ))}
          </div>
        )}
      </Flex>
    </Flex>
  );
}
