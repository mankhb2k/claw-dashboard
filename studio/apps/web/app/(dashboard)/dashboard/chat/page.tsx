import { ClientChatPage } from "./_components/ClientChatPage/ClientChatPage";
import styles from "./chat.module.css";

export default function ChatPage() {
  return (
    <div className={styles.page}>
      <ClientChatPage />
    </div>
  );
}
