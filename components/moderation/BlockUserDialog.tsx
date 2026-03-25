"use client";

import { useState } from "react";
import { Ban, AlertTriangle } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface BlockUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  onBlocked?: () => void;
}

export default function BlockUserDialog({
  isOpen,
  onClose,
  targetUser,
  onBlocked
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBlock = async () => {
    if (!user) return;

    setBlocking(true);
    try {
      const supabase = createClient();

      // Create block record
      const { error: blockError } = await supabase
        .from("blocks")
        .insert({
          blocker_id: user.id,
          blocked_id: targetUser.id,
          reason: reason.trim() || null
        });

      if (blockError) throw blockError;

      // Remove any existing follows between users
      await Promise.all([
        supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUser.id),
        supabase
          .from("follows")
          .delete()
          .eq("follower_id", targetUser.id)
          .eq("following_id", user.id)
      ]);

      toast({
        title: "User blocked",
        description: `You have blocked @${targetUser.username}. You won't see their content anymore.`
      });

      onBlocked?.();
      handleClose();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast({
        title: "Block failed",
        description: error.message || "Failed to block user",
        variant: "destructive"
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Block User
          </DialogTitle>
          <DialogDescription>
            Block @{targetUser.username}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User info */}
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={targetUser.avatar_url} />
              <AvatarFallback>
                {targetUser.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {targetUser.display_name || targetUser.username}
              </p>
              <p className="text-sm text-muted-foreground">
                @{targetUser.username}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">What happens when you block someone:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>They won't be able to see your posts or profile</li>
                <li>You won't see their posts or comments</li>
                <li>They won't be able to message you</li>
                <li>Any existing follows will be removed</li>
              </ul>
            </div>
          </div>

          {/* Reason (optional) */}
          <div>
            <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Reason (optional, for your reference)
            </Label>
            <Textarea
              id="reason"
              placeholder="Why are you blocking this user?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              maxLength={200}
              rows={3}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {reason.length}/200
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={blocking}>
            Cancel
          </Button>
          <Button
            onClick={handleBlock}
            disabled={blocking}
            variant="destructive"
          >
            {blocking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Blocking...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Block User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
