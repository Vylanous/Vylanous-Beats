import { useEffect, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  Send,
  XCircle,
} from "lucide-react";
import { adminApi, type EmailEvent, type InboundEmail } from "../../lib/admin";

export default function EmailInboxPanel() {
  const [messages, setMessages] = useState<InboundEmail[] | null>(null);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [selected, setSelected] = useState<InboundEmail | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);

  const load = () => {
    adminApi
      .listInbox()
      .then((result) => {
        setMessages(result.messages);
        setEvents(result.events);
      })
      .catch(() => setNotice("Unable to load the inbox."));
  };

  useEffect(load, []);

  const openMessage = async (message: InboundEmail) => {
    setSelected(message);
    setContent(null);
    setLoadingContent(true);
    try {
      const result = await adminApi.getInboxContent(message.id);
      setContent(result.text || "No plain-text content is available for this message.");
      setMessages(
        (current) =>
          current?.map((item) => (item.id === message.id ? { ...item, status: "read" } : item)) ||
          current,
      );
    } catch (error) {
      setContent(error instanceof Error ? error.message : "Message content is unavailable.");
    } finally {
      setLoadingContent(false);
    }
  };

  const archive = async (message: InboundEmail) => {
    await adminApi.updateInboxStatus(message.id, "archived");
    setMessages(
      (current) =>
        current?.map((item) => (item.id === message.id ? { ...item, status: "archived" } : item)) ||
        current,
    );
    if (selected?.id === message.id) setSelected({ ...message, status: "archived" });
  };

  const sendTest = async () => {
    setTesting(true);
    setNotice("");
    try {
      const result = await adminApi.sendEmailTest();
      setNotice(
        `Safe Resend test accepted${result.providerEmailId ? ` (${result.providerEmailId})` : ""}. Check the Email Events feed for delivery status.`,
      );
      load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The safe email test could not run.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-chrome">Email Inbox</h1>
          <p className="mt-1 font-body text-sm text-vb-silver/55">
            Verified support messages and Resend delivery events.
          </p>
        </div>
        <button
          onClick={sendTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg bg-vb-purple px-4 py-2.5 font-sub uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:opacity-60"
        >
          {testing ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {testing ? "Sending test" : "Run safe send test"}
        </button>
      </div>
      {notice && <p className="mb-4 font-body text-sm text-vb-purple-bright">{notice}</p>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-sub text-xl uppercase tracking-wide">Incoming messages</h2>
          </div>
          {messages === null ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="animate-spin text-vb-purple-bright" />
            </div>
          ) : messages.length === 0 ? (
            <div className="grid place-items-center gap-3 px-5 py-16 text-center">
              <Inbox className="text-vb-silver/30" size={28} />
              <p className="font-body text-sm text-vb-silver/50">
                No inbound messages yet. Configure the Resend webhook to begin receiving.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {messages
                .filter((message) => message.status !== "archived")
                .map((message) => (
                  <button
                    key={message.id}
                    onClick={() => openMessage(message)}
                    className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-white/[0.04] ${message.status === "unread" ? "bg-vb-purple/[0.06]" : ""}`}
                  >
                    <Mail
                      size={17}
                      className={
                        message.status === "unread"
                          ? "mt-0.5 shrink-0 text-vb-purple-bright"
                          : "mt-0.5 shrink-0 text-vb-silver/35"
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-sm text-vb-silver-bright">
                        {message.fromAddress || "Unknown sender"}
                      </span>
                      <span className="mt-0.5 block truncate font-body text-sm text-vb-silver/70">
                        {message.subject}
                      </span>
                      <span className="mt-1 block font-body text-xs text-vb-silver/35">
                        {new Date(message.receivedAt).toLocaleString()}
                      </span>
                    </span>
                    <ChevronRight size={16} className="mt-1 text-vb-silver/30" />
                  </button>
                ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body text-sm text-vb-silver/55">From {selected.fromAddress}</p>
                  <h2 className="mt-1 font-sub text-2xl uppercase tracking-wide text-vb-silver-bright">
                    {selected.subject}
                  </h2>
                  <p className="mt-2 font-body text-xs text-vb-silver/40">
                    To: {selected.to.join(", ") || "Unknown"} ·{" "}
                    {new Date(selected.receivedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  aria-label="Archive message"
                  onClick={() => archive(selected)}
                  className="rounded-lg border border-white/10 p-2 text-vb-silver/60 transition hover:border-vb-purple/50 hover:text-vb-purple-bright"
                >
                  <Archive size={17} />
                </button>
              </div>
              <div className="mt-6 whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-vb-black/60 p-4 font-body text-sm leading-relaxed text-vb-silver/80">
                {loadingContent ? (
                  <Loader2 className="animate-spin text-vb-purple-bright" size={18} />
                ) : (
                  content
                )}
              </div>
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center text-center">
              <p className="font-body text-sm text-vb-silver/45">
                Select a message to view its plain-text content.
              </p>
            </div>
          )}
          <div className="mt-7 border-t border-white/[0.06] pt-5">
            <h2 className="font-sub text-xl uppercase tracking-wide">Email events</h2>
            <div className="mt-3 space-y-2">
              {events.slice(0, 8).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg bg-vb-black/45 px-3 py-2.5"
                >
                  <EventIcon type={event.eventType} />
                  <span className="min-w-0 flex-1 truncate font-body text-sm text-vb-silver/75">
                    {event.eventType}
                  </span>
                  <span className="font-body text-xs text-vb-silver/35">
                    {new Date(event.receivedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <p className="font-body text-sm text-vb-silver/45">
                  No verified Resend events recorded yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  if (type.includes("delivered") || type.includes("received"))
    return <CheckCircle2 size={16} className="text-emerald-400" />;
  if (type.includes("bounced") || type.includes("complained"))
    return <XCircle size={16} className="text-red-400" />;
  return <Mail size={16} className="text-vb-purple-bright" />;
}
