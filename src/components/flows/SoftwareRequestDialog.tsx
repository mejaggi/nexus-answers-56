import { useState } from "react";
import { CheckCircle2, Loader2, PackageSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { tap, shareText } from "@/lib/native";

type Step = 1 | 2 | 3 | 4;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const SoftwareRequestDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    software: "",
    vendor: "",
    licenseType: "individual",
    urgency: "normal",
    justification: "",
  });

  const reset = () => {
    setStep(1);
    setForm({
      software: "",
      vendor: "",
      licenseType: "individual",
      urgency: "normal",
      justification: "",
    });
    setTicketId(null);
    setSubmitting(false);
  };

  const next = () => {
    tap();
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const submit = async () => {
    tap();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const id = `SR-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(id);
    setSubmitting(false);
    setStep(4);
    toast({ title: "Request submitted", description: `Ticket ${id} created.` });
  };

  const canNext =
    (step === 1 && form.software.trim().length > 1) ||
    (step === 2 && form.justification.trim().length > 5) ||
    step === 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-accent" /> Software Request
          </DialogTitle>
          <DialogDescription>
            {step < 4 ? `Step ${step} of 3` : "Submitted"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        {step < 4 && (
          <div className="flex gap-1.5 mb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sw">Software / Tool name *</Label>
              <Input
                id="sw"
                value={form.software}
                onChange={(e) => setForm({ ...form, software: e.target.value })}
                placeholder="e.g. Figma, Tableau, JetBrains"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor (optional)</Label>
              <Input
                id="vendor"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="Vendor / publisher"
              />
            </div>
            <div className="space-y-2">
              <Label>License type</Label>
              <RadioGroup
                value={form.licenseType}
                onValueChange={(v) => setForm({ ...form, licenseType: v })}
                className="grid grid-cols-2 gap-2"
              >
                {["individual", "team", "site", "trial"].map((v) => (
                  <Label
                    key={v}
                    className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/40"
                  >
                    <RadioGroupItem value={v} /> <span className="capitalize">{v}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="just">Business justification *</Label>
              <Textarea
                id="just"
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                placeholder="Why is this needed? Which project / outcome?"
                className="min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={form.urgency}
                onValueChange={(v) => setForm({ ...form, urgency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — within a month</SelectItem>
                  <SelectItem value="normal">Normal — within 2 weeks</SelectItem>
                  <SelectItem value="high">High — within 3 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Review your request</p>
            <div className="rounded-lg border border-border divide-y divide-border">
              {[
                ["Software", form.software],
                ["Vendor", form.vendor || "—"],
                ["License", form.licenseType],
                ["Urgency", form.urgency],
                ["Justification", form.justification],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 p-3">
                  <span className="w-24 shrink-0 text-muted-foreground">{k}</span>
                  <span className="flex-1 font-medium break-words">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Will be routed to your manager and IT procurement.
            </p>
          </div>
        )}

        {step === 4 && ticketId && (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
            <h3 className="font-semibold text-lg">Request submitted</h3>
            <p className="text-sm text-muted-foreground">
              Ticket <span className="font-mono font-medium text-foreground">{ticketId}</span> has
              been created. You'll get an update by email.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                shareText(
                  "Software Request",
                  `Ticket ${ticketId} for ${form.software}`,
                )
              }
            >
              Share ticket
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={back} disabled={submitting}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button onClick={next} disabled={!canNext} className="bg-gradient-accent text-accent-foreground">
              Next
            </Button>
          )}
          {step === 3 && (
            <Button onClick={submit} disabled={submitting} className="bg-gradient-accent text-accent-foreground">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit request"
              )}
            </Button>
          )}
          {step === 4 && (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
