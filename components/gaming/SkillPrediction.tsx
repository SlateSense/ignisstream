'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Brain, 
  Crosshair, 
  Users, 
  MapPin,
  Lightbulb,
  Star,
  Trophy
} from 'lucide-react';
import { SkillPrediction } from '@/lib/gaming/game-api-manager';

interface SkillPredictionProps {
  prediction: SkillPrediction;
  currentRank?: string;
  gameName?: string;
}

export function SkillPredictionCard({ 
  prediction, 
  currentRank = 'Unranked',
  gameName = 'Game'
}: SkillPredictionProps) {
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSkillTrendIcon = (value: number) => {
    if (value > 0.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < -0.1) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 rounded-full bg-gray-300" />;
  };

  const getSkillIcon = (skillType: string) => {
    switch (skillType) {
      case 'aim': return <Crosshair className="h-4 w-4" />;
      case 'strategy': return <Brain className="h-4 w-4" />;
      case 'teamwork': return <Users className="h-4 w-4" />;
      case 'positioning': return <MapPin className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const formatSkillName = (skill: string) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1);
  };

  const getImprovementIcon = (area: string) => {
    switch (area) {
      case 'aim_accuracy': return <Crosshair className="h-4 w-4" />;
      case 'game_sense': return <Brain className="h-4 w-4" />;
      case 'teamwork': return <Users className="h-4 w-4" />;
      case 'consistency': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const formatImprovementArea = (area: string) => {
    return area.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Prediction Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Skill Prediction - {gameName}
            </CardTitle>
            <Badge 
              variant="secondary"
              className={`${getConfidenceColor(prediction.confidence)} border-0`}
            >
              {(prediction.confidence * 100).toFixed(0)}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current vs Predicted Rank */}
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Current Rank</div>
              <div className="text-2xl font-bold text-blue-600">{currentRank}</div>
            </div>
            
            <div className="flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Predicted Rank</div>
              <div className="text-2xl font-bold text-green-600">{prediction.predictedRank}</div>
            </div>
          </div>
          
          {/* Time to Next Rank */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time to Next Rank</span>
              </div>
              <span className="text-lg font-bold">
                {Math.round(prediction.timeToNextRank)} hours
              </span>
            </div>
            <div className="mt-2">
              <Progress 
                value={Math.max(10, 100 - (prediction.timeToNextRank / 100) * 100)} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Skill Trends Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(prediction.skillTrends).map(([skill, value]) => (
              <div key={skill} className="text-center space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  {getSkillIcon(skill)}
                  <span className="text-sm font-medium">{formatSkillName(skill)}</span>
                </div>
                <div className="flex items-center justify-center">
                  {getSkillTrendIcon(value)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {value > 0 ? 'Improving' : value < 0 ? 'Declining' : 'Stable'}
                </div>
                <Progress 
                  value={Math.abs(value) * 100} 
                  className={`h-1 ${value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500'}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      {prediction.improvementAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex-shrink-0 text-orange-600">
                    {getImprovementIcon(area)}
                  </div>
                  <div>
                    <div className="font-medium text-orange-900">
                      {formatImprovementArea(area)}
                    </div>
                    <div className="text-sm text-orange-700">
                      {getImprovementSuggestion(area)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Performance Analysis</h4>
              <p className="text-sm text-purple-700">
                Based on your recent gameplay patterns, our AI model predicts you have a{' '}
                <span className="font-semibold">{(prediction.confidence * 100).toFixed(0)}% chance</span> of 
                reaching <span className="font-semibold">{prediction.predictedRank}</span> within the next{' '}
                <span className="font-semibold">{Math.round(prediction.timeToNextRank)} hours</span> of focused gameplay.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Recommendation</h4>
              <p className="text-sm text-blue-700">
                {getPersonalizedRecommendation(prediction)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getImprovementSuggestion(area: string): string {
  const suggestions = {
    aim_accuracy: "Practice aim training exercises and adjust your sensitivity settings",
    game_sense: "Study professional gameplay and work on map awareness",
    teamwork: "Focus on communication and coordinate better with teammates", 
    consistency: "Maintain regular practice schedule and review your gameplay"
  };
  
  return suggestions[area as keyof typeof suggestions] || "Focus on dedicated practice in this area";
}

function getPersonalizedRecommendation(prediction: SkillPrediction): string {
  const topWeakness = prediction.improvementAreas[0];
  const strongestSkill = Object.entries(prediction.skillTrends)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
    
  if (topWeakness && strongestSkill) {
    return `Your ${strongestSkill} skills are trending upward, but focus on improving your ${topWeakness.replace('_', ' ')} to reach the next rank faster.`;
  }
  
  return "Continue your current practice routine and focus on consistency to maintain your improvement trajectory.";
}
