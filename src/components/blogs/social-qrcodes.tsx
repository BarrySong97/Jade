import { cn } from "@/lib/utils";

export interface SocialQRCode {
  platform: string;
  qrCodeUrl: string;
  label: string;
  icon?: string;
}

export interface SocialQRCodesProps {
  qrCodes: SocialQRCode[];
  className?: string;
}

export function SocialQRCodes({ qrCodes, className }: SocialQRCodesProps) {
  return (
    <div className={cn("py-8 border-t border-border", className)}>
      <h3 className="text-lg font-semibold mb-6 text-center">关注我</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {qrCodes.map((social) => (
          <div
            key={social.platform}
            className="flex flex-col items-center space-y-3"
          >
            <div className="w-32 h-32 bg-white rounded-lg p-2 shadow-sm border border-border">
              <img
                src={social.qrCodeUrl}
                alt={`${social.label} 二维码`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{social.label}</p>
              <p className="text-xs text-muted-foreground">{social.platform}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

