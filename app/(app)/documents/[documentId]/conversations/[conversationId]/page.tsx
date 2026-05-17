import { SendHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  const { documentId, conversationId } = await params

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">Conversation</h1>
        <p className="text-sm text-muted-foreground">
          Document {documentId} · Thread {conversationId}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Continue the discussion below. Responses will include citations once
            connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
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
        </CardFooter>
      </Card>
    </main>
  )
}
