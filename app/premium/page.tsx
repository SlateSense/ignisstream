"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Crown, 
  Zap, 
  Star,
  Check,
  Sparkles,
  Video,
  Users,
  Shield,
  Palette,
  Bot,
  Trophy,
  MessageSquare,
  Cloud,
  Gamepad2,
  Heart,
  Gift,
  Lock,
  Unlock,
  CreditCard,
  Timer,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
}

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'content' | 'social' | 'gaming' | 'exclusive';
  premium_only: boolean;
  preview?: string;
}

const premiumPlans: PremiumPlan[] = [
  {
    id: "forge-pro",
    name: "Forge Pro",
    price: 5.99,
    period: "month",
    description: "Perfect for casual gamers who want enhanced features",
    color: "from-blue-500 to-purple-500",
    features: [
      "Advanced video editor with 50+ effects",
      "Unlimited cloud storage (10GB)", 
      "Priority matchmaking",
      "Custom profile themes",
      "Ad-free experience",
      "Premium badges and frames",
      "Early access to new features",
      "Basic AI gaming insights"
    ]
  },
  {
    id: "forge-elite", 
    name: "Forge Elite",
    price: 9.99,
    period: "month",
    description: "For serious gamers and content creators",
    popular: true,
    color: "from-gaming-purple to-gaming-pink",
    features: [
      "Everything in Forge Pro",
      "Professional video editing suite",
      "Unlimited cloud storage (100GB)",
      "Advanced AI coaching & analysis",
      "Server creation & management tools", 
      "Creator monetization features",
      "VIP customer support",
      "Exclusive community access",
      "Custom emoji & stickers",
      "Stream integration tools"
    ]
  },
  {
    id: "forge-legendary",
    name: "Forge Legendary", 
    price: 19.99,
    period: "month",
    description: "The ultimate gaming experience with all features",
    color: "from-yellow-400 to-orange-500",
    features: [
      "Everything in Forge Elite",
      "Unlimited everything",
      "Personal AI gaming coach",
      "White-label server hosting",
      "Developer API access",
      "Revenue sharing program",
      "Personal account manager",
      "Beta feature access",
      "Exclusive events & tournaments",
      "Custom integrations",
      "Priority technical support"
    ]
  }
];

const premiumFeatures: PremiumFeature[] = [
  {
    id: "advanced-editor",
    name: "Advanced Video Editor", 
    description: "Professional-grade editing with 50+ effects, transitions, and filters",
    icon: <Video className="h-6 w-6" />,
    category: "content",
    premium_only: true,
    preview: "Create Hollywood-quality gaming montages"
  },
  {
    id: "ai-coaching",
    name: "AI Gaming Coach",
    description: "Personalized tips, strategy recommendations, and performance analysis",
    icon: <Bot className="h-6 w-6" />,
    category: "gaming", 
    premium_only: true,
    preview: "Improve your gameplay with AI insights"
  },
  {
    id: "priority-matching",
    name: "Priority Matchmaking",
    description: "Skip the queue and get matched with premium players first",
    icon: <Zap className="h-6 w-6" />,
    category: "gaming",
    premium_only: true
  },
  {
    id: "unlimited-storage",
    name: "Unlimited Storage",
    description: "Store all your gaming clips, screenshots, and memories",
    icon: <Cloud className="h-6 w-6" />,
    category: "content",
    premium_only: true
  },
  {
    id: "custom-themes",
    name: "Custom Profile Themes",
    description: "Personalize your profile with exclusive themes and frames",
    icon: <Palette className="h-6 w-6" />,
    category: "social",
    premium_only: true
  },
  {
    id: "exclusive-badges",
    name: "Exclusive Badges",
    description: "Show off your premium status with special badges and titles",
    icon: <Crown className="h-6 w-6" />,
    category: "exclusive",
    premium_only: true
  }
];

export default function PremiumPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("forge-elite");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState("plans");

  const isCurrentlyPremium = profile?.premium_status || false;
  const currentPlan = isCurrentlyPremium ? "forge-pro" : null;

  const handleSubscribe = async (planId: string) => {
    toast({
      title: "Redirecting to payment...",
      description: "Setting up your premium subscription.",
    });
    
    // Simulate subscription process
    setTimeout(() => {
      toast({
        title: "Welcome to Premium! 🎉",
        description: "Your premium features are now active.",
      });
    }, 2000);
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    handleSubscribe(planId);
  };

  const getDiscountedPrice = (price: number) => {
    return billingPeriod === "yearly" ? (price * 12 * 0.8) : price;
  };

  const getSavingsPercent = () => {
    return billingPeriod === "yearly" ? "20%" : "0%";
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gaming-purple via-gaming-pink to-gaming-blue pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-white font-medium">Unlock Your Gaming Potential</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-gaming font-bold text-white mb-6">
              Forge Premium
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Elevate your gaming experience with exclusive features, AI-powered insights, and premium tools designed for serious gamers.
            </p>
            
            {/* Current Status */}
            {isCurrentlyPremium ? (
              <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-green-400/30">
                <Crown className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Premium Active</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                <Lock className="h-5 w-5 text-white/60" />
                <span className="text-white/60 font-medium">Free Account</span>
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Users className="h-8 w-8 text-white mx-auto mb-3" />
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-white/70">Premium Members</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Trophy className="h-8 w-8 text-white mx-auto mb-3" />
                <p className="text-2xl font-bold text-white">95%</p>
                <p className="text-white/70">Satisfaction Rate</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Zap className="h-8 w-8 text-white mx-auto mb-3" />
                <p className="text-2xl font-bold text-white">3x</p>
                <p className="text-white/70">Faster Improvement</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md mx-auto mb-12">
            <TabsTrigger value="plans" className="flex-1">Pricing Plans</TabsTrigger>
            <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
            <TabsTrigger value="comparison" className="flex-1">Compare</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {/* Billing Toggle */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-4 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={cn(
                    "px-6 py-2 rounded-md font-medium transition-all",
                    billingPeriod === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={cn(
                    "px-6 py-2 rounded-md font-medium transition-all relative",
                    billingPeriod === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
                  )}
                >
                  Yearly
                  {billingPeriod === "yearly" && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                      Save 20%
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {premiumPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                    plan.popular && "border-primary shadow-lg scale-105",
                    currentPlan === plan.id && "ring-2 ring-primary"
                  )}>
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                      plan.color
                    )} />
                    
                    <CardHeader className="text-center pb-4">
                      <div className={cn(
                        "w-16 h-16 rounded-full bg-gradient-to-r flex items-center justify-center mx-auto mb-4",
                        plan.color
                      )}>
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <p className="text-muted-foreground">{plan.description}</p>
                      <div className="text-center mt-4">
                        <div className="text-4xl font-bold">
                          ${getDiscountedPrice(plan.price).toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">
                          per {billingPeriod === "yearly" ? "year" : "month"}
                        </div>
                        {billingPeriod === "yearly" && (
                          <Badge variant="outline" className="mt-2">
                            Save ${((plan.price * 12) - getDiscountedPrice(plan.price)).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4 mb-8">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {currentPlan === plan.id ? (
                        <Button className="w-full" variant="outline" disabled>
                          <Crown className="mr-2 h-4 w-4" />
                          Current Plan
                        </Button>
                      ) : currentPlan && premiumPlans.findIndex(p => p.id === currentPlan) < premiumPlans.findIndex(p => p.id === plan.id) ? (
                        <Button 
                          className={cn("w-full bg-gradient-to-r text-white", plan.color)}
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Upgrade Now
                        </Button>
                      ) : (
                        <Button 
                          className={cn("w-full bg-gradient-to-r text-white", plan.color)}
                          onClick={() => handleSubscribe(plan.id)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Get Started
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Money Back Guarantee */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg px-4 py-2 border border-green-500/20">
                <Shield className="h-5 w-5" />
                <span className="font-medium">30-day money-back guarantee</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Premium Features</h2>
                <p className="text-muted-foreground">
                  Unlock powerful tools and exclusive content designed for serious gamers
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {premiumFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-gradient-to-r from-gaming-purple to-gaming-pink p-3 rounded-lg text-white">
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{feature.name}</h3>
                              {feature.premium_only && (
                                <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white text-xs">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-3">
                              {feature.description}
                            </p>
                            {feature.preview && (
                              <div className="bg-muted rounded-lg p-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Sparkles className="h-4 w-4" />
                                  {feature.preview}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Plan Comparison</h2>
                <p className="text-muted-foreground">
                  See what's included in each plan to find the perfect fit
                </p>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium">Features</th>
                          <th className="text-center p-4 font-medium">Free</th>
                          <th className="text-center p-4 font-medium">Forge Pro</th>
                          <th className="text-center p-4 font-medium">Forge Elite</th>
                          <th className="text-center p-4 font-medium">Forge Legendary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Basic video editor", true, true, true, true],
                          ["Advanced video effects", false, true, true, true],
                          ["Cloud storage", "1GB", "10GB", "100GB", "Unlimited"],
                          ["AI gaming insights", false, "Basic", "Advanced", "Personal coach"],
                          ["Priority matchmaking", false, true, true, true],
                          ["Custom themes", false, true, true, true],
                          ["Server creation", false, false, true, true],
                          ["Revenue sharing", false, false, false, true],
                          ["API access", false, false, false, true],
                        ].map(([feature, free, pro, elite, legendary], i) => (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="p-4 font-medium">{feature}</td>
                            <td className="p-4 text-center">
                              {typeof free === 'boolean' ? (
                                free ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-400 mx-auto" />
                              ) : free}
                            </td>
                            <td className="p-4 text-center">
                              {typeof pro === 'boolean' ? (
                                pro ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-400 mx-auto" />
                              ) : pro}
                            </td>
                            <td className="p-4 text-center">
                              {typeof elite === 'boolean' ? (
                                elite ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-400 mx-auto" />
                              ) : elite}
                            </td>
                            <td className="p-4 text-center">
                              {typeof legendary === 'boolean' ? (
                                legendary ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-400 mx-auto" />
                              ) : legendary}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Can I cancel my subscription anytime?",
                  a: "Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period."
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards, PayPal, and various digital payment methods depending on your region."
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes! All new users get a 7-day free trial of Forge Pro to experience premium features before committing."
                },
                {
                  q: "Can I upgrade or downgrade my plan?",
                  a: "Absolutely! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle."
                }
              ].map((faq, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
