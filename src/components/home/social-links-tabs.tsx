import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  BookOpen,
  ExternalLink,
  Github,
  Mail,
  MonitorPlay,
  Tv,
  Twitter,
} from "lucide-react";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";

// EDIT HERE: Your social media links
const SOCIAL_LINKS = {
  github: "https://github.com/BarrySong97",
  twitter: "https://x.com/BarrySong97",
  bilibili: "https://space.bilibili.com/868586",
  douyin: "https://www.douyin.com/user/self?from_tab_name=main",
  rednote: "https://www.xiaohongshu.com/user/profile/648339340000000012036a56",
  email: "524000659@qq.com",
} as const;

export function SocialLinksTabs() {
  return (
    <Tabs defaultValue="github" className="mt-4">
      <div className="rounded-md border border-border bg-muted">
        <div className="px-4 pt-3">
          <TabsList variant="line">
            <TabsTrigger value="github">
              <Github className="size-4" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="twitter">
              <Twitter className="size-4" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="bilibili">
              <MonitorPlay className="size-4" />
              Bilibili
            </TabsTrigger>
            <TabsTrigger value="douyin">
              <Tv className="size-4" />
              抖音
            </TabsTrigger>
            <TabsTrigger value="rednote">
              <BookOpen className="size-4" />
              小红书
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="size-4" />
              Email
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="border-t border-border p-4">
          <TabsContent value="github">
            <div className="flex items-center justify-between gap-2">
              <code className="truncate text-sm text-muted-foreground">
                {SOCIAL_LINKS.github}
              </code>
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8"
                )}
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </TabsContent>
          <TabsContent value="twitter">
            <div className="flex items-center justify-between gap-2">
              <code className="truncate text-sm text-muted-foreground">
                {SOCIAL_LINKS.twitter}
              </code>
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8"
                )}
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </TabsContent>
          <TabsContent value="bilibili">
            <div className="flex items-center justify-between gap-2">
              <code className="truncate text-sm text-muted-foreground">
                {SOCIAL_LINKS.bilibili}
              </code>
              <a
                href={SOCIAL_LINKS.bilibili}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8"
                )}
              >
                <ExternalLink className="size-4" />
              </a>
              {/* <HoverCard>
                <HoverCardTrigger
                  delay={0}
                  onClick={() => window.open(SOCIAL_LINKS.bilibili, "_blank")}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-8 cursor-pointer"
                  )}
                >
                  <QrCode className="size-4" />
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      SOCIAL_LINKS.bilibili
                    )}`}
                    alt="Bilibili QR Code"
                    className="size-24"
                  />
                </HoverCardContent>
              </HoverCard> */}
            </div>
          </TabsContent>
          <TabsContent value="douyin">
            <div className="flex items-center justify-between gap-2">
              <code className="truncate text-sm text-muted-foreground">
                {SOCIAL_LINKS.douyin}
              </code>
              <a
                href={SOCIAL_LINKS.douyin}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8"
                )}
              >
                <ExternalLink className="size-4" />
              </a>
              {/* <HoverCard>
                <HoverCardTrigger
                  onClick={() => window.open(SOCIAL_LINKS.douyin, "_blank")}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-8 cursor-pointer"
                  )}
                >
                  <QrCode className="size-4" />
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      SOCIAL_LINKS.douyin
                    )}`}
                    alt="Douyin QR Code"
                    className="size-24"
                  />
                </HoverCardContent>
              </HoverCard> */}
            </div>
          </TabsContent>
          <TabsContent value="rednote">
            <div className="flex items-center justify-between gap-2">
              <code className="truncate text-sm text-muted-foreground">
                {SOCIAL_LINKS.rednote}
              </code>
              <a
                href={SOCIAL_LINKS.rednote}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8"
                )}
              >
                <ExternalLink className="size-4" />
              </a>
              {/* <HoverCard>
                <HoverCardTrigger
                  onClick={() => window.open(SOCIAL_LINKS.rednote, "_blank")}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-8 cursor-pointer"
                  )}
                >
                  <QrCode className="size-4" />
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      SOCIAL_LINKS.rednote
                    )}`}
                    alt="Rednote QR Code"
                    className="size-24"
                  />
                </HoverCardContent>
              </HoverCard> */}
            </div>
          </TabsContent>
          <TabsContent value="email">
            <div className="flex items-center justify-between gap-2">
              <code className="truncate text-sm text-muted-foreground">
                {SOCIAL_LINKS.email}
              </code>
              <a
                href={`mailto:${SOCIAL_LINKS.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8"
                )}
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
