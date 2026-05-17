import { SendHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"

type ConversationPageProps = {
  params: Promise<{
    documentId: string
    conversationId: string
  }>
}

const messages = [
  {
    id: "m1",
    role: "assistant",
    author: "AskDoc",
    initials: "AD",
    time: "2 min ago",
    text: "I reviewed the document and found the summary section on pages 3-4. What would you like to explore next?",
  },
  {
    id: "m2",
    role: "user",
    author: "You",
    initials: "YO",
    time: "1 min ago",
    text: "Pull the key points about the security controls and list them with their section names.",
  },
  {
    id: "m3",
    role: "assistant",
    author: "AskDoc",
    initials: "AD",
    time: "Just now",
    text: "The controls are organized under Access Management, Data Protection, and Monitoring. I can surface each section and cite the exact paragraphs.",
  },
]

export default async function ConversationPage({ params }: ConversationPageProps) {
  await params

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-xl font-semibold">Document preview</h2>
            <p className="text-sm text-muted-foreground">
              The PDF viewer will appear here once connected.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="flex max-w-sm flex-col gap-2 text-center">
              <p className="font-medium">PDF preview coming soon</p>
              <p className="text-sm text-muted-foreground">
                This panel will render the full document preview.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-xl font-semibold">Messages</h2>
            <p className="text-sm text-muted-foreground">
              Continue the discussion below. Responses will include citations
              once connected.
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-4">
            {messages.map((message) => {
              const isUser = message.role === "user"

              return (
                <div
                  key={message.id}
                  className={
                    isUser
                      ? "flex items-start justify-end gap-3"
                      : "flex items-start gap-3"
                  }
                >
                  <Avatar size="sm">
                    <AvatarImage alt={message.author} />
                    <AvatarFallback>{message.initials}</AvatarFallback>
                  </Avatar>
                  <Card className="w-full max-w-[520px]" size="sm">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {message.author}
                      </CardTitle>
                      <CardDescription>{message.time}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground">{message.text}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col gap-4">
            <Separator />
            <InputGroup>
              <InputGroupTextarea
                placeholder="Ask a question about this document..."
                rows={3}
              />
              <InputGroupAddon align="block-end">
                <InputGroupButton>
                  <SendHorizontal data-icon="inline-start" />
                  Send
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </section>
      </div>
    </main>
  )
}
