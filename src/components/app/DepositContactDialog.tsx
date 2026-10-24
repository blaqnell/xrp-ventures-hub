import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const DEPOSIT_CONTACT = { email: "xrpventuresadmin@gmail.com", telegram: "Xrpventures" };

export function DepositContactDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Deposit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a deposit</DialogTitle>
          <DialogDescription>To fund your account, message our team. We'll add the deposit to your balance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <a href={`mailto:${DEPOSIT_CONTACT.email}?subject=Deposit request`} className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted">
            <Mail className="h-4 w-4 text-primary" /><span>{DEPOSIT_CONTACT.email}</span>
          </a>
          <a href={`https://t.me/${DEPOSIT_CONTACT.telegram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted">
            <Send className="h-4 w-4 text-primary" /><span>Telegram: @{DEPOSIT_CONTACT.telegram}</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
