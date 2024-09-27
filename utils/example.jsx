import { useOptimistic, useRef,useState } from "react";
import { useFormStatus } from "react-dom";

import { deliverMessage } from "./actions.js";

function Button() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      Send
    </button>
  );
}

function Thread({ messages, sendMessage }) {
  const formRef = useRef();
  async function formAction(formData) {
    const text = formData.get("message")?.trim();
    if (!text) {
      return;
    }

    addOptimisticMessage(text);
    formRef.current.reset();
    await sendMessage(text);
  }
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [
      ...state,
      {
        text: newMessage,
        sending: true,
      },
    ]
  );

  return (
    <>
      {optimisticMessages.map((message, index) => (
        <div
          key={index}
          style={{
            height: "16px",
          }}
        >
          {message.text}
          {!!message.sending && <small> (Sending...)</small>}
        </div>
      ))}

      <form action={formAction} ref={formRef}>
        <input type="text" name="message" placeholder="Hello!" />
        <Button />
      </form>
    </>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { text: "Hello there!", sending: false, key: 1 },
  ]);

  async function sendMessage(text) {
    const sentMessage = await deliverMessage(text);
    setMessages((messages) => [...messages, { text: sentMessage }]);
  }

  return <Thread messages={messages} sendMessage={sendMessage} />;
}
