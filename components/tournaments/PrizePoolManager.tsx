"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Trophy, 
  Crown, 
  Medal, 
  Award,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  Star,
  ExternalLink,
  Upload,
  Building,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tournament, TournamentSponsor, PrizeDistribution, tournamentManager } from '@/lib/tournaments/tournament-manager';

interface PrizePoolManagerProps {
  tournament: Tournament;
  isOrganizer?: boolean;
  onUpdate?: () => void;
}

export default function PrizePoolManager({ tournament, isOrganizer = false, onUpdate }: PrizePoolManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [prizeDistribution, setPrizeDistribution] = useState<PrizeDistribution[]>([
    { placement: 1, amount: 0, percentage: 50 },
    { placement: 2, amount: 0, percentage: 30 },
    { placement: 3, amount: 0, percentage: 20 }
  ]);
  const [sponsors, setSponsors] = useState<TournamentSponsor[]>(tournament.sponsors || []);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [showEditPrizes, setShowEditPrizes] = useState(false);
  const [loading, setLoading] = useState(false);

  // New sponsor form state
  const [newSponsor, setNewSponsor] = useState({
    sponsor_name: '',
    sponsor_logo: '',
    sponsor_url: '',
    contribution_amount: 0,
    sponsor_tier: 'supporting' as const
  });

  const totalPrizePool = tournament.prize_pool + (tournament.sponsor_prize_pool || 0);
  const basePrizePool = tournament.prize_pool - (tournament.sponsor_prize_pool || 0);
  const sponsorContribution = tournament.sponsor_prize_pool || 0;

  useEffect(() => {
    calculatePrizeAmounts();
  }, [totalPrizePool, prizeDistribution]);

  const calculatePrizeAmounts = () => {
    const updated = prizeDistribution.map(prize => ({
      ...prize,
      amount: (totalPrizePool * prize.percentage) / 100
    }));
    setPrizeDistribution(updated);
  };

  const updatePrizeDistribution = (placement: number, percentage: number) => {
    const updated = prizeDistribution.map(prize =>
      prize.placement === placement ? { ...prize, percentage } : prize
    );
    
    // Ensure total doesn't exceed 100%
    const total = updated.reduce((sum, prize) => sum + prize.percentage, 0);
    if (total <= 100) {
      setPrizeDistribution(updated);
    }
  };

  const addPrizePlacement = () => {
    const nextPlacement = prizeDistribution.length + 1;
    setPrizeDistribution([
      ...prizeDistribution,
      { placement: nextPlacement, amount: 0, percentage: 5 }
    ]);
  };

  const removePrizePlacement = (placement: number) => {
    if (prizeDistribution.length > 1) {
      setPrizeDistribution(prizeDistribution.filter(prize => prize.placement !== placement));
    }
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.sponsor_name || newSponsor.contribution_amount <= 0) {
      toast({
        title: "Invalid data",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await tournamentManager.addSponsor(tournament.id, {
        ...newSponsor,
        created_at: new Date().toISOString()
      });

      if (success) {
        toast({
          title: "Sponsor added!",
          description: `${newSponsor.sponsor_name} has been added as a sponsor.`,
        });
        
        // Add to local state
        setSponsors([...sponsors, {
          id: Date.now().toString(),
          tournament_id: tournament.id,
          ...newSponsor,
          created_at: new Date().toISOString()
        }]);
        
        setNewSponsor({
          sponsor_name: '',
          sponsor_logo: '',
          sponsor_url: '',
          contribution_amount: 0,
          sponsor_tier: 'supporting'
        });
        setShowAddSponsor(false);
        
        if (onUpdate) onUpdate();
      } else {
        throw new Error('Failed to add sponsor');
      }
    } catch (error) {
      console.error('Error adding sponsor:', error);
      toast({
        title: "Error adding sponsor",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSponsorTierIcon = (tier: string) => {
    switch (tier) {
      case 'title':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'presenting':
        return <Trophy className="h-4 w-4 text-silver-500" />;
      case 'official':
        return <Medal className="h-4 w-4 text-orange-500" />;
      case 'supporting':
        return <Award className="h-4 w-4 text-blue-500" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getSponsorTierColor = (tier: string) => {
    switch (tier) {
      case 'title':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'presenting':
        return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 'official':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'supporting':
        return 'bg-gradient-to-r from-blue-500 to-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPlacementIcon = (placement: number) => {
    switch (placement) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />;
    }
  };

  const totalPercentage = prizeDistribution.reduce((sum, prize) => sum + prize.percentage, 0);

  return (
    <div className="space-y-6">
      {/* Prize Pool Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Prize Pool Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">${totalPrizePool.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Prize Pool</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
              <Building className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">${basePrizePool.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Base Pool</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">${sponsorContribution.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Sponsor Contributions</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{sponsors.length}</p>
              <p className="text-sm text-muted-foreground">Sponsors</p>
            </div>
          </div>
          
          {/* Prize Pool Growth */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Prize Pool Composition</span>
              <span className="text-sm text-muted-foreground">
                {((sponsorContribution / totalPrizePool) * 100).toFixed(1)}% from sponsors
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div className="flex h-full rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500"
                  style={{ width: `${(basePrizePool / totalPrizePool) * 100}%` }}
                />
                <div 
                  className="bg-purple-500"
                  style={{ width: `${(sponsorContribution / totalPrizePool) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Prize Distribution</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Prize Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Prize Distribution</h3>
            {isOrganizer && (
              <Button onClick={() => setShowEditPrizes(true)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Distribution
              </Button>
            )}
          </div>

          {/* Prize Breakdown */}
          <div className="grid gap-4">
            {prizeDistribution.map((prize, index) => (
              <motion.div
                key={prize.placement}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPlacementIcon(prize.placement)}
                        <div>
                          <p className="font-semibold">
                            {prize.placement === 1 ? '1st Place' : 
                             prize.placement === 2 ? '2nd Place' : 
                             prize.placement === 3 ? '3rd Place' : 
                             `${prize.placement}th Place`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {prize.percentage}% of total prize pool
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-500">
                          ${prize.amount.toLocaleString()}
                        </p>
                        <Badge variant="outline">
                          {prize.percentage}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Distribution Validation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Distribution</span>
                <Badge variant={totalPercentage === 100 ? "default" : "destructive"}>
                  {totalPercentage}%
                </Badge>
              </div>
              <Progress value={totalPercentage} className="h-2" />
              {totalPercentage !== 100 && (
                <Alert className="mt-2">
                  <AlertDescription>
                    Prize distribution must total 100%. 
                    {totalPercentage > 100 ? 'Reduce' : 'Increase'} percentages by {Math.abs(100 - totalPercentage)}%.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sponsors Tab */}
        <TabsContent value="sponsors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tournament Sponsors</h3>
            {isOrganizer && (
              <Button onClick={() => setShowAddSponsor(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            )}
          </div>

          {sponsors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">No sponsors yet</p>
                <p className="text-muted-foreground mb-4">
                  Sponsors help increase the prize pool and support the tournament
                </p>
                {isOrganizer && (
                  <Button onClick={() => setShowAddSponsor(true)}>
                    Add First Sponsor
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sponsors.map((sponsor, index) => (
                <motion.div
                  key={sponsor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                            {sponsor.sponsor_logo ? (
                              <img 
                                src={sponsor.sponsor_logo} 
                                alt={sponsor.sponsor_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{sponsor.sponsor_name}</h4>
                              {getSponsorTierIcon(sponsor.sponsor_tier)}
                              <Badge className={`${getSponsorTierColor(sponsor.sponsor_tier)} text-white capitalize`}>
                                {sponsor.sponsor_tier}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              Contributed ${sponsor.contribution_amount.toLocaleString()} to prize pool
                            </p>
                            
                            {sponsor.sponsor_url && (
                              <a 
                                href={sponsor.sponsor_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                Visit website
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {isOrganizer && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Prize Pool Analytics</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Growth Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Prize pool growth chart would be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contribution Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Entry Fees</span>
                    <span className="font-semibold">${(basePrizePool * 0.7).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Organizer Contribution</span>
                    <span className="font-semibold">${(basePrizePool * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sponsor Contributions</span>
                    <span className="font-semibold">${sponsorContribution.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span>${totalPrizePool.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Sponsor Dialog */}
      <Dialog open={showAddSponsor} onOpenChange={setShowAddSponsor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tournament Sponsor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="sponsorName">Sponsor Name</Label>
              <Input
                id="sponsorName"
                value={newSponsor.sponsor_name}
                onChange={(e) => setNewSponsor({...newSponsor, sponsor_name: e.target.value})}
                placeholder="Company or organization name"
              />
            </div>
            
            <div>
              <Label htmlFor="sponsorLogo">Logo URL</Label>
              <Input
                id="sponsorLogo"
                value={newSponsor.sponsor_logo}
                onChange={(e) => setNewSponsor({...newSponsor, sponsor_logo: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div>
              <Label htmlFor="sponsorUrl">Website (Optional)</Label>
              <Input
                id="sponsorUrl"
                value={newSponsor.sponsor_url}
                onChange={(e) => setNewSponsor({...newSponsor, sponsor_url: e.target.value})}
                placeholder="https://sponsor-website.com"
              />
            </div>
            
            <div>
              <Label htmlFor="contribution">Contribution Amount</Label>
              <Input
                id="contribution"
                type="number"
                value={newSponsor.contribution_amount}
                onChange={(e) => setNewSponsor({...newSponsor, contribution_amount: parseFloat(e.target.value) || 0})}
                placeholder="1000"
              />
            </div>
            
            <div>
              <Label htmlFor="tier">Sponsor Tier</Label>
              <Select value={newSponsor.sponsor_tier} onValueChange={(value: any) => setNewSponsor({...newSponsor, sponsor_tier: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title Sponsor</SelectItem>
                  <SelectItem value="presenting">Presenting Sponsor</SelectItem>
                  <SelectItem value="official">Official Sponsor</SelectItem>
                  <SelectItem value="supporting">Supporting Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddSponsor(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddSponsor}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Adding...' : 'Add Sponsor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
