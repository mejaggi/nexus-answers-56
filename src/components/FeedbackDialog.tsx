import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  messageId: string;
  department: string;
}

type TicketStep = "form" | "submitting" | "success";

export const FeedbackDialog = ({
  open,
  onOpenChange,
  messageContent,
  messageId,
  department,
}: FeedbackDialogProps) => {
  const [step, setStep] = useState<TicketStep>("form");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("");
  const [description, setDescription] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason || !urgency) {
      toast({
        title: "Missing fields",
        description: "Please fill in the reason and urgency.",
        variant: "destructive",
      });
      return;
    }

    setStep("submitting");

    // Simulate ServiceNow ticket creation (prototype)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockTicket = `INC${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
    setTicketNumber(mockTicket);
    setStep("success");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep("form");
      setReason("");
      setUrgency("");
      setDescription("");
      setTicketNumber("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Report Unsatisfactory Response
              </DialogTitle>
              <DialogDescription>
                Help us improve by telling us what went wrong. A ServiceNow
                ticket will be created for the support team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  What was wrong with the response? <span className="text-destructive">*</span>
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incorrect">Incorrect information</SelectItem>
                    <SelectItem value="incomplete">Incomplete answer</SelectItem>
                    <SelectItem value="outdated">Outdated policy/procedure</SelectItem>
                    <SelectItem value="irrelevant">Irrelevant to my question</SelectItem>
                    <SelectItem value="confusing">Confusing or unclear</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Urgency <span className="text-destructive">*</span>
                </Label>
                <RadioGroup value={urgency} onValueChange={setUrgency} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="font-normal cursor-pointer">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="font-normal cursor-pointer">High</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us what you expected or any additional context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">Ticket will include:</p>
                <p><span className="font-medium">Department:</span> {department}</p>
                <p><span className="font-medium">AI Response:</span> {messageContent.slice(0, 80)}...</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Create ServiceNow Ticket
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "submitting" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating ServiceNow ticket...</p>
          </div>
        )}

        {step === "success" && (
          <>
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ticket Created</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your ServiceNow ticket has been logged successfully.
                </p>
              </div>
              <div className="rounded-md bg-muted px-4 py-3 text-sm font-mono font-semibold text-foreground">
                {ticketNumber}
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                The support team will review the AI response and update the knowledge base accordingly.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
