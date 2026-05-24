"use client";

import React, { useState, useEffect } from "react";
import { Flex } from "@/components/layout";
import { Typography, Input, Button, Avatar } from "@/components/ui";
import { Send, RotateCcw, Settings, Globe, Loader2, Bot, Layout, Terminal, PlayCircle } from "lucide-react";
import styles from "./PreviewPanel.module.css";

export function PreviewPanel() {
  const [activeTab, setActiveTab] = useState<"playground" | "canvas" | "diagnostics">("playground");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Xin chào! Tôi là Kế toán trưởng. Bạn cần tôi giúp gì về hóa đơn hay thuế VAT hôm nay?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // MOCKED LOGS STATE
  const [logs, setLogs] = useState<Array<{ time: string; tag: string; isError?: boolean; text: string }>>([
    { time: "16:20:01", tag: "[GATEWAY]", text: "Initializing session connection on port 18789..." },
    { time: "16:20:02", tag: "[GATEWAY]", text: "Session handshakes successful. ID: sess_981249" },
    { time: "16:20:03", tag: "[SANDBOX]", text: "Bootstrapping Docker execution container (execPolicy='on-miss')..." },
    { time: "16:20:04", tag: "[SANDBOX]", text: "Allowlisted binary packages loaded: [python, node, git]" },
    { time: "16:20:05", tag: "[AGENT]", text: "Standing orders compiled. Identity loaded (IDENTITY.md & SOUL.md)" }
  ]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    const newMsg = { id: Date.now(), role: "user", content: inputMessage };
    setMessages((prev) => [...prev, newMsg]);
    
    // Add transaction logs
    setLogs((prev) => [
      ...prev,
      { time: timestamp, tag: "[INBOUND]", text: `User message received: "${inputMessage}"` },
      { time: timestamp, tag: "[ROUTER]", text: "Steering message flow to active Pi Agent instance..." }
    ]);
    
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responseTime = new Date().toLocaleTimeString();
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: "Tôi đã kiểm tra dữ liệu và lập bảng tính doanh thu tạm thời kèm theo biểu đồ bên tab Canvas. Bạn có thể xem ngay nhé!" }
      ]);

      // Add sandbox logs
      setLogs((prev) => [
        ...prev,
        { time: responseTime, tag: "[AGENT]", text: "Prompt builder merged active SKILL.md. Triggering ExecTool..." },
        { time: responseTime, tag: "[SANDBOX]", text: 'Running safe script: python -c "print(15000000 * 0.1)"' },
        { time: responseTime, tag: "[SANDBOX]", text: "Command completed. Output: 1500000.0 (Execution time: 42ms)" },
        { time: responseTime, tag: "[CANVAS]", text: "Canvas UI payload sent: /__openclaw__/canvas/render_chart" }
      ]);
    }, 1500);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Flex align="center" gap={2}>
          <Typography variant="p" weight="bold">Preview Preview</Typography>
          <div className={styles.tabList}>
            <button
              className={`${styles.tabButton} ${activeTab === "playground" ? styles.active : ""}`}
              onClick={() => setActiveTab("playground")}
            >
              <PlayCircle size={14} /> Playground
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "canvas" ? styles.active : ""}`}
              onClick={() => setActiveTab("canvas")}
            >
              <Layout size={14} /> Canvas
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "diagnostics" ? styles.active : ""}`}
              onClick={() => setActiveTab("diagnostics")}
            >
              <Terminal size={14} /> Diagnostics
            </button>
          </div>
        </Flex>
        
        <Flex align="center" gap={2}>
          <div style={{ padding: "4px 8px", background: "var(--background-secondary)", borderRadius: 100 }}>
            <Typography variant="small" color="muted" style={{ fontSize: 11 }}>Claude 3.5 Sonnet</Typography>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Làm mới cuộc hội thoại" 
            onClick={() => setMessages([{ id: 1, role: "assistant", content: "Xin chào! Tôi là Kế toán trưởng. Bạn cần tôi giúp gì về hóa đơn hay thuế VAT hôm nay?" }])}
          >
            <RotateCcw size={16} />
          </Button>
          <Button variant="ghost" size="icon" title="Cài đặt Playground">
            <Settings size={16} />
          </Button>
        </Flex>
      </div>

      <div className={styles.body}>
        {/* =====================================================================
            1. PLAYGROUND VIEW
            ===================================================================== */}
        {activeTab === "playground" && (
          <>
            <div className={styles.chatArea}>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.message} ${msg.role === "user" ? styles.user : ""}`}>
                  {msg.role === "assistant" && <Avatar fallback="💼" size="md" />}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {msg.role === "assistant" && msg.id > 1 && (
                      <div className={styles.thoughtLog}>
                        <Globe size={14} />
                        <span>Đang tìm kiếm Google cho "Thuế suất doanh nghiệp mới nhất"... [Xong]</span>
                      </div>
                    )}
                    {msg.role === "assistant" && msg.id > 2 && (
                      <div className={styles.thoughtLog}>
                        <Bot size={14} />
                        <span>Đang giao việc cho [Tech Support] đối soát hóa đơn... [Xong]</span>
                      </div>
                    )}
                    <div className={styles.messageBubble}>
                      <Typography variant="p">{msg.content}</Typography>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className={styles.message}>
                  <Avatar fallback="💼" size="md" />
                  <div className={styles.messageBubble} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={16} className="animate-spin" />
                    <Typography variant="p" color="muted">Đang suy nghĩ...</Typography>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.chatInputArea}>
              <Flex gap={2}>
                <Input 
                  placeholder="Nhắn tin cho Agent để thử nghiệm..." 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleSend} disabled={!inputMessage.trim() || isTyping}>
                  <Send size={18} />
                </Button>
              </Flex>
              <Typography variant="small" color="muted" style={{ textAlign: "center", display: "block", marginTop: 8, fontSize: 11 }}>
                Playground tự động reload khi bạn thay đổi cấu hình bên trái.
              </Typography>
            </div>
          </>
        )}

        {/* =====================================================================
            2. CANVAS VIEW
            ===================================================================== */}
        {activeTab === "canvas" && (
          <div className={styles.canvasContainer}>
            <div className={styles.canvasCard}>
              <div>
                <Typography variant="p" weight="bold" style={{ margin: 0 }}>📊 Tính toán Thuế VAT Doanh thu Q2</Typography>
                <Typography variant="small" color="muted">Bản dựng thời gian thực tạo bởi Canvas Host</Typography>
              </div>

              <div className={styles.canvasChart}>
                <div className={styles.chartBar} style={{ height: "45px" }}><span className={styles.chartBarLabel}>T4</span></div>
                <div className={styles.chartBar} style={{ height: "85px" }}><span className={styles.chartBarLabel}>T5</span></div>
                <div className={styles.chartBar} style={{ height: "60px" }}><span className={styles.chartBarLabel}>T6</span></div>
              </div>

              <Flex justify="between" align="center">
                <div>
                  <Typography variant="small" color="muted" style={{ display: "block" }}>Tổng doanh thu</Typography>
                  <Typography variant="p" weight="bold" style={{ margin: 0 }}>15,000,000đ</Typography>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Typography variant="small" color="muted" style={{ display: "block" }}>Thuế VAT (10%)</Typography>
                  <Typography variant="p" weight="bold" color="primary" style={{ margin: 0 }}>1,500,000đ</Typography>
                </div>
              </Flex>

              <Button size="sm" style={{ width: "100%" }}>Xuất File PDF Báo Cáo</Button>
            </div>
          </div>
        )}

        {/* =====================================================================
            3. DIAGNOSTICS VIEW
            ===================================================================== */}
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
      </div>
    </div>
  );
}
