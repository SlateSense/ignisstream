import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTournament } from '../../hooks/useTournament';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Match {
  id: string;
  round: number;
  position: number;
  team1?: {
    id: string;
    name: string;
    logo?: string;
    score?: number;
  };
  team2?: {
    id: string;
    name: string;
    logo?: string;
    score?: number;
  };
  winner_id?: string;
  status: 'upcoming' | 'live' | 'completed';
  scheduled_time?: string;
  stream_url?: string;
}

interface MobileTournamentBracketProps {
  tournamentId: string;
  onMatchPress?: (match: Match) => void;
  showLiveIndicators?: boolean;
  enableInteraction?: boolean;
}

export default function MobileTournamentBracket({
  tournamentId,
  onMatchPress,
  showLiveIndicators = true,
  enableInteraction = true
}: MobileTournamentBracketProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { tournament, matches, loading, refreshTournament } = useTournament(tournamentId);
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [bracketData, setBracketData] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (matches) {
      organizeBracketData(matches);
    }
  }, [matches]);

  useEffect(() => {
    // Animate live matches
    if (showLiveIndicators) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showLiveIndicators]);

  const organizeBracketData = (matchList: Match[]) => {
    const organized = matchList.sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.position - b.position;
    });

    setBracketData(organized);
    setMaxRounds(Math.max(...organized.map(m => m.round)));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTournament();
    setRefreshing(false);
  };

  const handleMatchPress = (match: Match) => {
    if (!enableInteraction) return;
    
    setSelectedMatch(match);
    setShowMatchModal(true);
    
    if (onMatchPress) {
      onMatchPress(match);
    }
  };

  const renderMatchCard = (match: Match, index: number) => {
    const isLive = match.status === 'live';
    const isCompleted = match.status === 'completed';
    const hasWinner = match.winner_id;
    
    const cardWidth = SCREEN_WIDTH * 0.8;
    const cardHeight = 120;

    return (
      <Animated.View
        key={match.id}
        style={[
          styles.matchCard,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: theme.colors.surface,
            borderColor: isLive ? '#10B981' : theme.colors.border,
            borderWidth: isLive ? 2 : 1,
            marginBottom: 16,
            transform: isLive ? [{ scale: pulseAnim }] : [{ scale: 1 }],
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleMatchPress(match)}
          style={styles.matchCardTouchable}
          activeOpacity={0.7}
        >
          {isLive && (
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.1)', 'transparent']}
              style={styles.liveGradient}
            />
          )}
          
          {/* Match Header */}
          <View style={styles.matchHeader}>
            <View style={styles.roundInfo}>
              <Text style={[styles.roundText, { color: theme.colors.text }]}>
                Round {match.round}
              </Text>
              {isLive && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            
            {match.stream_url && (
              <TouchableOpacity style={styles.streamButton}>
                <Ionicons name="videocam" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Teams */}
          <View style={styles.teamsContainer}>
            {/* Team 1 */}
            <View style={[
              styles.teamContainer,
              hasWinner && match.winner_id === match.team1?.id && styles.winnerTeam
            ]}>
              <View style={styles.teamInfo}>
                <Text 
                  style={[
                    styles.teamName, 
                    { color: theme.colors.text },
                    hasWinner && match.winner_id === match.team1?.id && styles.winnerText
                  ]}
                  numberOfLines={1}
                >
                  {match.team1?.name || 'TBD'}
                </Text>
              </View>
              
              {isCompleted && (
                <View style={[
                  styles.scoreContainer,
                  hasWinner && match.winner_id === match.team1?.id && styles.winnerScore
                ]}>
                  <Text style={[
                    styles.scoreText,
                    hasWinner && match.winner_id === match.team1?.id && styles.winnerText
                  ]}>
                    {match.team1?.score || 0}
                  </Text>
                </View>
              )}
            </View>

            {/* VS Separator */}
            <View style={styles.vsContainer}>
              <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
                VS
              </Text>
            </View>

            {/* Team 2 */}
            <View style={[
              styles.teamContainer,
              hasWinner && match.winner_id === match.team2?.id && styles.winnerTeam
            ]}>
              <View style={styles.teamInfo}>
                <Text 
                  style={[
                    styles.teamName, 
                    { color: theme.colors.text },
                    hasWinner && match.winner_id === match.team2?.id && styles.winnerText
                  ]}
                  numberOfLines={1}
                >
                  {match.team2?.name || 'TBD'}
                </Text>
              </View>
              
              {isCompleted && (
                <View style={[
                  styles.scoreContainer,
                  hasWinner && match.winner_id === match.team2?.id && styles.winnerScore
                ]}>
                  <Text style={[
                    styles.scoreText,
                    hasWinner && match.winner_id === match.team2?.id && styles.winnerText
                  ]}>
                    {match.team2?.score || 0}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Match Footer */}
          {match.scheduled_time && (
            <View style={styles.matchFooter}>
              <Ionicons 
                name="time-outline" 
                size={14} 
                color={theme.colors.textSecondary} 
              />
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {new Date(match.scheduled_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRoundSelector = () => (
    <View style={styles.roundSelector}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roundSelectorContent}
      >
        {Array.from({ length: maxRounds }, (_, i) => i + 1).map((round) => {
          const isActive = round === currentRound;
          const roundMatches = bracketData.filter(m => m.round === round);
          const hasLiveMatch = roundMatches.some(m => m.status === 'live');
          
          return (
            <TouchableOpacity
              key={round}
              style={[
                styles.roundTab,
                {
                  backgroundColor: isActive ? theme.colors.primary : 'transparent',
                  borderColor: hasLiveMatch ? '#10B981' : theme.colors.border,
                }
              ]}
              onPress={() => setCurrentRound(round)}
            >
              {hasLiveMatch && (
                <View style={styles.roundLiveIndicator} />
              )}
              <Text style={[
                styles.roundTabText,
                {
                  color: isActive ? '#FFFFFF' : theme.colors.text,
                  fontWeight: isActive ? '600' : '400'
                }
              ]}>
                R{round}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderMatchModal = () => (
    <Modal
      visible={showMatchModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowMatchModal(false)}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          {selectedMatch && (
            <>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Match Details
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMatchModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalTeams}>
                <View style={styles.modalTeam}>
                  <Text style={[styles.modalTeamName, { color: theme.colors.text }]}>
                    {selectedMatch.team1?.name || 'TBD'}
                  </Text>
                  {selectedMatch.status === 'completed' && (
                    <Text style={styles.modalScore}>
                      {selectedMatch.team1?.score || 0}
                    </Text>
                  )}
                </View>
                
                <Text style={[styles.modalVs, { color: theme.colors.textSecondary }]}>
                  VS
                </Text>
                
                <View style={styles.modalTeam}>
                  <Text style={[styles.modalTeamName, { color: theme.colors.text }]}>
                    {selectedMatch.team2?.name || 'TBD'}
                  </Text>
                  {selectedMatch.status === 'completed' && (
                    <Text style={styles.modalScore}>
                      {selectedMatch.team2?.score || 0}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.modalActions}>
                {selectedMatch.stream_url && (
                  <TouchableOpacity style={styles.streamActionButton}>
                    <Ionicons name="videocam" size={20} color="#FFFFFF" />
                    <Text style={styles.streamActionText}>Watch Stream</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: theme.colors.border }]}
                  onPress={() => {
                    // Add to calendar or set reminder
                    Alert.alert('Reminder Set', 'You will be notified when this match starts');
                  }}
                >
                  <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                    Set Reminder
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Animated.View style={[
          styles.loadingSpinner,
          { transform: [{ rotate: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })}]}
        ]}>
          <Ionicons name="refresh" size={32} color={theme.colors.primary} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading Tournament Bracket...
        </Text>
      </View>
    );
  }

  const currentRoundMatches = bracketData.filter(match => match.round === currentRound);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Round Selector */}
      {renderRoundSelector()}

      {/* Bracket Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {currentRoundMatches.length > 0 ? (
          currentRoundMatches.map((match, index) => renderMatchCard(match, index))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons 
              name="trophy-outline" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No matches in this round yet
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Match Detail Modal */}
      {renderMatchModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  roundSelector: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  roundSelectorContent: {
    paddingHorizontal: 16,
  },
  roundTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
  },
  roundLiveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  roundTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  matchCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  matchCardTouchable: {
    flex: 1,
  },
  liveGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  streamButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  teamsContainer: {
    flex: 1,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  winnerTeam: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  winnerText: {
    color: '#22C55E',
  },
  scoreContainer: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerScore: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  vsContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalTeams: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTeam: {
    alignItems: 'center',
    marginVertical: 8,
  },
  modalTeamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  modalVs: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 8,
  },
  modalActions: {
    gap: 12,
  },
  streamActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
  },
  streamActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
