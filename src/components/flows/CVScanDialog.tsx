import { useState } from "react";
import { Upload, FileText, CheckCircle2, Loader2, X, Share2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { pickFile, shareText, tap } from "@/lib/native";
import { useToast } from "@/hooks/use-toast";

type Stage = "idle" | "uploading" | "parsing" | "scoring" | "done";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const stageLabel: Record<Stage, string> = {
  idle: "Ready",
  uploading: "Uploading CV…",
  parsing: "Parsing document…",
  scoring: "Scoring fitment vs. JD…",
  done: "Complete",
};

const stagePct: Record<Stage, number> = {
  idle: 0,
  uploading: 25,
  parsing: 55,
  scoring: 85,
  done: 100,
};

export const CVScanDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<null | {
    score: number;
    strengths: string[];
    gaps: string[];
  }>(null);

  const reset = () => {
    setFile(null);
    setJd("");
    setStage("idle");
    setResult(null);
  };

  const handlePick = async () => {
    tap();
    const f = await pickFile(".pdf,.doc,.docx,.txt");
    if (f) setFile(f);
  };

  const runScan = async () => {
    if (!file || !jd.trim()) return;
    tap();
    setResult(null);
    const stages: Stage[] = ["uploading", "parsing", "scoring", "done"];
    for (const s of stages) {
      setStage(s);
      await new Promise((r) => setTimeout(r, s === "done" ? 200 : 900));
    }
    // Mock result
    setResult({
      score: 78,
      strengths: ["6+ years backend", "Cloud (AWS) certified", "Team leadership"],
      gaps: ["Limited Kubernetes exposure", "No public-sector experience"],
    });
  };

  const share = async () => {
    if (!result) return;
    await shareText(
      `CV Fitment: ${file?.name}`,
      `Score ${result.score}/100\nStrengths: ${result.strengths.join(", ")}\nGaps: ${result.gaps.join(", ")}`,
    );
    toast({ title: "Shared", description: "Result shared / copied to clipboard." });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CV → JD Fitment Scan</DialogTitle>
          <DialogDescription>
            Upload a CV and paste the job description. We'll score the match.
          </DialogDescription>
        </DialogHeader>

        {/* File picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Candidate CV</label>
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <FileText className="h-5 w-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePick}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-accent/60 bg-muted/20 p-6 text-center transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Tap to upload CV</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX or TXT</p>
            </button>
          )}
        </div>

        {/* JD */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Job Description</label>
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the JD or key requirements…"
            className="min-h-[110px] resize-none"
          />
        </div>

        {/* Progress / result */}
        {stage !== "idle" && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {stage === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                )}
                {stageLabel[stage]}
              </span>
              <span className="text-muted-foreground">{stagePct[stage]}%</span>
            </div>
            <Progress value={stagePct[stage]} />
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fitment Score</span>
              <span className="text-2xl font-bold text-accent">{result.score}/100</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Strengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.strengths.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Gaps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.gaps.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {result && (
            <Button variant="outline" onClick={share}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          <Button
            onClick={runScan}
            disabled={!file || !jd.trim() || (stage !== "idle" && stage !== "done")}
            className="bg-gradient-accent text-accent-foreground"
          >
            {stage === "done" ? "Re-run scan" : "Run scan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
