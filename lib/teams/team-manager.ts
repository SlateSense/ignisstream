/**
 * IgnisStream Advanced Team Formation System
 * Professional squad/clan creation and management tools
 * Intelligent matchmaking and team optimization
 */

export interface Team {
  id: string;
  name: string;
  tag: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  type: 'casual' | 'competitive' | 'professional' | 'clan';
  game: string;
  region: string;
  language: string[];
  maxMembers: number;
  currentMembers: number;
  isPublic: boolean;
  requiresApplication: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: TeamStats;
  settings: TeamSettings;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'captain' | 'member' | 'recruit';
  joinedAt: Date;
  permissions: TeamPermission[];
  stats: MemberStats;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: Date;
}

export interface TeamStats {
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  averageRating: number;
  tournamentWins: number;
  totalMatches: number;
  streak: { type: 'win' | 'loss'; count: number };
  ranking: number;
  points: number;
  achievements: string[];
}

export interface MemberStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  avgPerformance: number;
  contribution: number;
  leadership: number;
  teamwork: number;
  reliability: number;
}

export interface TeamSettings {
  autoAcceptApplications: boolean;
  minimumSkillRating: number;
  maximumSkillRating: number;
  preferredRoles: string[];
  activeHours: TimeRange[];
  voiceRequired: boolean;
  ageRestriction?: number;
  regionLocked: boolean;
  customRequirements: string[];
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface TeamPermission {
  action: 'invite' | 'kick' | 'promote' | 'demote' | 'manage_settings' | 'schedule_matches' | 'manage_roster';
  granted: boolean;
}

export interface TeamApplication {
  id: string;
  userId: string;
  teamId: string;
  message: string;
  preferredRole: string;
  availability: TimeRange[];
  experience: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface MatchmakingCriteria {
  gameMode: string;
  skillRange: { min: number; max: number };
  region: string;
  language?: string[];
  teamSize: number;
  voiceRequired: boolean;
  timePreferences: TimeRange[];
  preferredRoles: string[];
  avoidList: string[]; // User IDs to avoid
}

export interface TeamRecommendation {
  team: Team;
  compatibility: number;
  reasons: string[];
  matchingCriteria: string[];
  potentialRole: string;
  estimatedWaitTime: number;
}

export interface TeamEvent {
  id: string;
  teamId: string;
  type: 'practice' | 'scrim' | 'tournament' | 'meeting' | 'tryout';
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number; // minutes
  requiredAttendees: string[];
  optionalAttendees: string[];
  location?: string; // Discord server, game lobby, etc.
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  results?: EventResults;
}

export interface EventResults {
  outcome: 'win' | 'loss' | 'draw' | 'cancelled';
  score?: string;
  mvp?: string;
  performance: Record<string, number>;
  notes: string;
}

export class TeamManager {
  private teams: Map<string, Team> = new Map();
  private members: Map<string, TeamMember[]> = new Map();
  private applications: Map<string, TeamApplication[]> = new Map();
  private events: Map<string, TeamEvent[]> = new Map();
  private matchmakingQueue: MatchmakingCriteria[] = [];

  constructor() {
    this.initializeMatchmaking();
  }

  private initializeMatchmaking(): void {
    // Start matchmaking processor
    setInterval(() => {
      this.processMatchmakingQueue();
    }, 30000); // Process every 30 seconds
  }

  public async createTeam(
    creatorId: string,
    teamData: Partial<Team>
  ): Promise<string> {
    const teamId = this.generateId();
    
    const team: Team = {
      id: teamId,
      name: teamData.name || 'New Team',
      tag: teamData.tag || 'NEW',
      description: teamData.description || '',
      logoUrl: teamData.logoUrl,
      bannerUrl: teamData.bannerUrl,
      type: teamData.type || 'casual',
      game: teamData.game || 'valorant',
      region: teamData.region || 'na',
      language: teamData.language || ['en'],
      maxMembers: teamData.maxMembers || 5,
      currentMembers: 1,
      isPublic: teamData.isPublic ?? true,
      requiresApplication: teamData.requiresApplication ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        averageRating: 0,
        tournamentWins: 0,
        totalMatches: 0,
        streak: { type: 'win', count: 0 },
        ranking: 0,
        points: 0,
        achievements: []
      },
      settings: {
        autoAcceptApplications: false,
        minimumSkillRating: teamData.settings?.minimumSkillRating || 0,
        maximumSkillRating: teamData.settings?.maximumSkillRating || 5000,
        preferredRoles: [],
        activeHours: [],
        voiceRequired: false,
        regionLocked: false,
        customRequirements: []
      }
    };

    this.teams.set(teamId, team);
    
    // Add creator as owner
    const ownerMember: TeamMember = {
      id: this.generateId(),
      userId: creatorId,
      teamId,
      role: 'owner',
      joinedAt: new Date(),
      permissions: this.getAllPermissions(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        avgPerformance: 0,
        contribution: 0,
        leadership: 100,
        teamwork: 100,
        reliability: 100
      },
      status: 'active',
      lastActive: new Date()
    };

    this.members.set(teamId, [ownerMember]);
    this.applications.set(teamId, []);
    this.events.set(teamId, []);

    return teamId;
  }

  public async joinTeam(userId: string, teamId: string, message?: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const currentMembers = this.members.get(teamId) || [];
    if (currentMembers.length >= team.maxMembers) {
      return false;
    }

    if (team.requiresApplication) {
      return await this.submitApplication(userId, teamId, message);
    } else {
      return await this.addMember(userId, teamId, 'member');
    }
  }

  private async submitApplication(
    userId: string,
    teamId: string,
    message?: string,
    preferredRole?: string
  ): Promise<boolean> {
    const application: TeamApplication = {
      id: this.generateId(),
      userId,
      teamId,
      message: message || '',
      preferredRole: preferredRole || 'member',
      availability: [],
      experience: '',
      status: 'pending',
      submittedAt: new Date()
    };

    const applications = this.applications.get(teamId) || [];
    applications.push(application);
    this.applications.set(teamId, applications);

    // Auto-accept if settings allow
    const team = this.teams.get(teamId);
    if (team?.settings.autoAcceptApplications) {
      return await this.processApplication(application.id, 'accepted');
    }

    return true;
  }

  public async processApplication(
    applicationId: string,
    decision: 'accepted' | 'rejected',
    reviewNotes?: string
  ): Promise<boolean> {
    // Find application
    let application: TeamApplication | undefined;
    let teamId: string | undefined;

    for (const [tId, apps] of Array.from(this.applications.entries())) {
      const found = apps.find((app: TeamApplication) => app.id === applicationId);
      if (found) {
        application = found;
        teamId = tId;
        break;
      }
    }

    if (!application || !teamId) return false;

    application.status = decision;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewNotes;

    if (decision === 'accepted') {
      await this.addMember(application.userId, teamId, 'member');
    }

    return true;
  }

  private async addMember(userId: string, teamId: string, role: TeamMember['role']): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const currentMembers = this.members.get(teamId) || [];
    
    // Check if already a member
    if (currentMembers.some(m => m.userId === userId)) {
      return false;
    }

    const member: TeamMember = {
      id: this.generateId(),
      userId,
      teamId,
      role,
      joinedAt: new Date(),
      permissions: this.getRolePermissions(role),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        avgPerformance: 0,
        contribution: 0,
        leadership: role === 'owner' ? 100 : 50,
        teamwork: 50,
        reliability: 50
      },
      status: 'active',
      lastActive: new Date()
    };

    currentMembers.push(member);
    this.members.set(teamId, currentMembers);

    // Update team member count
    team.currentMembers = currentMembers.length;
    team.updatedAt = new Date();

    return true;
  }

  public async findTeams(
    criteria: Partial<MatchmakingCriteria>,
    userId: string
  ): Promise<TeamRecommendation[]> {
    const recommendations: TeamRecommendation[] = [];
    
    for (const [teamId, team] of Array.from(this.teams.entries())) {
      if (!team.isPublic) continue;
      if (team.currentMembers >= team.maxMembers) continue;
      
      const compatibility = this.calculateTeamCompatibility(team, criteria, userId);
      
      if (compatibility > 0.3) { // Minimum 30% compatibility
        recommendations.push({
          team,
          compatibility,
          reasons: this.getCompatibilityReasons(team, criteria),
          matchingCriteria: this.getMatchingCriteria(team, criteria),
          potentialRole: this.suggestRole(team, userId),
          estimatedWaitTime: this.estimateWaitTime(team, criteria)
        });
      }
    }

    return recommendations
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 10);
  }

  private calculateTeamCompatibility(
    team: Team,
    criteria: Partial<MatchmakingCriteria>,
    userId: string
  ): number {
    let score = 0;
    let factors = 0;

    // Game compatibility
    if (criteria.gameMode && team.game) {
      score += team.game === criteria.gameMode ? 1 : 0;
      factors++;
    }

    // Region compatibility
    if (criteria.region) {
      score += team.region === criteria.region ? 1 : 0.5;
      factors++;
    }

    // Language compatibility
    if (criteria.language && team.language.length > 0) {
      const hasCommonLanguage = criteria.language.some(lang => 
        team.language.includes(lang)
      );
      score += hasCommonLanguage ? 1 : 0.2;
      factors++;
    }

    // Skill range compatibility
    if (criteria.skillRange) {
      const userRating = 1500; // Would get from user profile
      const withinRange = userRating >= team.settings.minimumSkillRating &&
                         userRating <= team.settings.maximumSkillRating;
      score += withinRange ? 1 : 0;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  private getCompatibilityReasons(
    team: Team,
    criteria: Partial<MatchmakingCriteria>
  ): string[] {
    const reasons: string[] = [];

    if (criteria.region === team.region) {
      reasons.push('Same region');
    }

    if (criteria.language?.some(lang => team.language.includes(lang))) {
      reasons.push('Common language');
    }

    if (team.type === 'competitive') {
      reasons.push('Competitive focus');
    }

    if (team.stats.winRate > 60) {
      reasons.push('High win rate');
    }

    return reasons;
  }

  private getMatchingCriteria(
    team: Team,
    criteria: Partial<MatchmakingCriteria>
  ): string[] {
    return [
      `${team.game}`,
      `${team.region}`,
      `${team.type}`,
      `${team.currentMembers}/${team.maxMembers} members`
    ];
  }

  private suggestRole(team: Team, userId: string): string {
    // Analyze team composition and suggest best role
    const members = this.members.get(team.id) || [];
    const roles = ['duelist', 'initiator', 'controller', 'sentinel'];
    
    // Simple role balancing
    const roleCounts = roles.reduce((acc, role) => {
      acc[role] = members.filter(m => 
        team.settings.preferredRoles.includes(role)
      ).length;
      return acc;
    }, {} as Record<string, number>);

    // Return role with least players
    return Object.entries(roleCounts)
      .sort(([,a], [,b]) => a - b)[0]?.[0] || 'member';
  }

  private estimateWaitTime(
    team: Team,
    criteria: Partial<MatchmakingCriteria>
  ): number {
    // Estimate time to get accepted/join team
    if (!team.requiresApplication) return 0;
    
    const baseWaitTime = team.type === 'professional' ? 24 : 2; // hours
    const popularityFactor = Math.min(team.currentMembers / team.maxMembers, 1);
    
    return Math.round(baseWaitTime * (1 + popularityFactor));
  }

  public async scheduleEvent(
    teamId: string,
    eventData: Partial<TeamEvent>,
    organizerId: string
  ): Promise<string> {
    // Check permissions
    const member = this.getUserMember(organizerId, teamId);
    if (!member || !this.hasPermission(member, 'schedule_matches')) {
      throw new Error('No permission to schedule events');
    }

    const eventId = this.generateId();
    const event: TeamEvent = {
      id: eventId,
      teamId,
      type: eventData.type || 'practice',
      title: eventData.title || 'Team Event',
      description: eventData.description || '',
      scheduledAt: eventData.scheduledAt || new Date(),
      duration: eventData.duration || 60,
      requiredAttendees: eventData.requiredAttendees || [],
      optionalAttendees: eventData.optionalAttendees || [],
      location: eventData.location,
      status: 'scheduled'
    };

    const events = this.events.get(teamId) || [];
    events.push(event);
    this.events.set(teamId, events);

    return eventId;
  }

  public async updateMemberRole(
    teamId: string,
    memberId: string,
    newRole: TeamMember['role'],
    promoterId: string
  ): Promise<boolean> {
    const promoter = this.getUserMember(promoterId, teamId);
    if (!promoter || !this.hasPermission(promoter, 'promote')) {
      return false;
    }

    const members = this.members.get(teamId) || [];
    const member = members.find(m => m.id === memberId);
    
    if (!member) return false;

    member.role = newRole;
    member.permissions = this.getRolePermissions(newRole);
    
    return true;
  }

  private processMatchmakingQueue(): void {
    // Process users looking for teams
    this.matchmakingQueue.forEach(async (criteria, index) => {
      const recommendations = await this.findTeams(criteria, 'queue-user');
      
      if (recommendations.length > 0) {
        // Remove from queue (would notify user in real app)
        this.matchmakingQueue.splice(index, 1);
      }
    });
  }

  private getUserMember(userId: string, teamId: string): TeamMember | undefined {
    const members = this.members.get(teamId) || [];
    return members.find(m => m.userId === userId);
  }

  private hasPermission(member: TeamMember, action: TeamPermission['action']): boolean {
    return member.permissions.some(p => p.action === action && p.granted);
  }

  private getRolePermissions(role: TeamMember['role']): TeamPermission[] {
    const allPermissions = this.getAllPermissions();
    
    switch (role) {
      case 'owner':
        return allPermissions;
      case 'captain':
        return allPermissions.filter(p => 
          ['invite', 'kick', 'schedule_matches', 'manage_roster'].includes(p.action)
        );
      case 'member':
        return allPermissions.filter(p => p.action === 'invite');
      case 'recruit':
        return [];
      default:
        return [];
    }
  }

  private getAllPermissions(): TeamPermission[] {
    const actions: TeamPermission['action'][] = [
      'invite', 'kick', 'promote', 'demote', 
      'manage_settings', 'schedule_matches', 'manage_roster'
    ];
    
    return actions.map(action => ({ action, granted: true }));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Public API methods
  public async getTeamDetails(teamId: string): Promise<Team | null> {
    return this.teams.get(teamId) || null;
  }

  public async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.members.get(teamId) || [];
  }

  public async getUserTeams(userId: string): Promise<Team[]> {
    const userTeams: Team[] = [];
    
    for (const [teamId, members] of Array.from(this.members.entries())) {
      if (members.some((m: TeamMember) => m.userId === userId)) {
        const team = this.teams.get(teamId);
        if (team) userTeams.push(team);
      }
    }
    
    return userTeams;
  }

  public async leaveTeam(userId: string, teamId: string): Promise<boolean> {
    const members = this.members.get(teamId) || [];
    const memberIndex = members.findIndex(m => m.userId === userId);
    
    if (memberIndex === -1) return false;
    
    const member = members[memberIndex];
    if (member.role === 'owner') {
      // Transfer ownership or disband team
      const nextOwner = members.find(m => m.role === 'captain');
      if (nextOwner) {
        nextOwner.role = 'owner';
        nextOwner.permissions = this.getAllPermissions();
      }
    }
    
    members.splice(memberIndex, 1);
    this.members.set(teamId, members);
    
    // Update team member count
    const team = this.teams.get(teamId);
    if (team) {
      team.currentMembers = members.length;
      team.updatedAt = new Date();
    }
    
    return true;
  }
}
