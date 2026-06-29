import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS, type ClientStatus } from "@/lib/client-status";

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = CLIENT_STATUS[status];
  return (
    <Badge tone="neutral" dotColor={meta.color} title={meta.help}>
      {meta.label}
    </Badge>
  );
}
