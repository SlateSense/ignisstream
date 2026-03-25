"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PollCardProps {
  poll: {
    id: string;
    post_id: string;
    question: string;
    options: any;
    total_votes: number;
    expires_at: string | null;
  };
  hasVoted?: boolean;
  userVote?: number | null;
}

export default function PollCard({ poll, hasVoted = false, userVote = null }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote);
  const [voted, setVoted] = useState(hasVoted);
  const [voting, setVoting] = useState(false);
  const [pollData, setPollData] = useState(poll);
  const { user } = useAuth();
  const { toast } = useToast();

  const options = Array.isArray(pollData.options) ? pollData.options : [];
  const isExpired = pollData.expires_at ? new Date(pollData.expires_at) < new Date() : false;

  const handleVote = async (optionIndex: number) => {
    if (!user || voted || isExpired) return;

    setVoting(true);
    try {
      const supabase = createClient();

      // Record vote
      const { error: voteError } = await supabase
        .from("poll_votes")
        .insert({
          poll_id: pollData.id,
          user_id: user.id,
          option_index: optionIndex
        });

      if (voteError) throw voteError;

      // Update poll options with new vote count
      const updatedOptions = options.map((opt: any, idx: number) => ({
        ...opt,
        votes: idx === optionIndex ? (opt.votes || 0) + 1 : (opt.votes || 0)
      }));

      // Update poll in database
      const { error: updateError } = await supabase
        .from("polls")
        .update({
          options: updatedOptions,
          total_votes: pollData.total_votes + 1
        })
        .eq("id", pollData.id);

      if (updateError) throw updateError;

      setPollData({
        ...pollData,
        options: updatedOptions,
        total_votes: pollData.total_votes + 1
      });

      setSelectedOption(optionIndex);
      setVoted(true);

      toast({
        title: "Vote recorded!",
        description: "Your vote has been counted"
      });
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        title: "Vote failed",
        description: error.message || "Failed to record your vote",
        variant: "destructive"
      });
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (pollData.total_votes === 0) return 0;
    return Math.round((votes / pollData.total_votes) * 100);
  };

  return (
    <Card className="mt-3">
      <CardHeader className="pb-3">
        <h3 className="font-semibold text-base">{pollData.question}</h3>
        {pollData.expires_at && !isExpired && (
          <p className="text-xs text-muted-foreground">
            Ends {formatDistanceToNow(new Date(pollData.expires_at), { addSuffix: true })}
          </p>
        )}
        {isExpired && (
          <p className="text-xs text-muted-foreground font-medium">Poll ended</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((option: any, index: number) => {
          const votes = option.votes || 0;
          const percentage = getPercentage(votes);
          const isSelected = selectedOption === index;
          const showResults = voted || isExpired;

          return (
            <motion.div
              key={index}
              whileHover={!voted && !isExpired ? { scale: 1.02 } : {}}
              whileTap={!voted && !isExpired ? { scale: 0.98 } : {}}
            >
              {showResults ? (
                <div className="relative">
                  <div className="relative z-10 flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium text-sm">{option.text}</span>
                    </div>
                    <span className="text-sm font-semibold">{percentage}%</span>
                  </div>
                  <div
                    className="absolute inset-0 bg-primary/10 rounded-lg transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleVote(index)}
                  disabled={voting}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{option.text}</span>
                </Button>
              )}
            </motion.div>
          );
        })}

        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{pollData.total_votes} {pollData.total_votes === 1 ? 'vote' : 'votes'}</span>
          {voted && !isExpired && (
            <span className="text-primary font-medium">You voted</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
