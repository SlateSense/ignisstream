"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "post" | "comment" | "user";
  targetId: string;
  targetUserId?: string;
}

const reportReasons = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "violence", label: "Violence or dangerous content" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "misinformation", label: "False information" },
  { value: "other", label: "Other" }
];

export default function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetUserId
}: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user || !reason) {
      toast({
        title: "Missing information",
        description: "Please select a reason for reporting",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const reportData: any = {
        reporter_id: user.id,
        reason,
        description: description.trim() || null,
        status: "pending"
      };

      // Add specific target fields
      if (targetType === "post") {
        reportData.post_id = targetId;
        reportData.reported_user_id = targetUserId;
      } else if (targetType === "comment") {
        reportData.comment_id = targetId;
        reportData.reported_user_id = targetUserId;
      } else if (targetType === "user") {
        reportData.reported_user_id = targetId;
      }

      const { error } = await supabase
        .from("reports")
        .insert(reportData);

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe. We'll review this report."
      });

      handleClose();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Report failed",
        description: error.message || "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report {targetType}
          </DialogTitle>
          <DialogDescription>
            Help us understand what's happening with this {targetType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Why are you reporting this?
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((reasonOption) => (
                <div key={reasonOption.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reasonOption.value} id={reasonOption.value} />
                  <Label
                    htmlFor={reasonOption.value}
                    className="font-normal cursor-pointer"
                  >
                    {reasonOption.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional details */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium mb-2 block">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              maxLength={500}
              rows={4}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/500
            </div>
          </div>

          {/* Warning message */}
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> False reports may result in action being taken on your account. Please only report content that violates our community guidelines.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            variant="destructive"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
