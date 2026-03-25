"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Filter,
  Grid3X3,
  List,
  Clock,
  Trophy,
  Gamepad2,
  Users,
  Star,
  Play,
  Eye,
  Settings,
  Download,
  Bell,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { gamingCalendarManager, GameEvent, EventType, CalendarFilter, CalendarStats } from '@/lib/calendar/gaming-calendar-manager';

interface GamingCalendarProps {
  initialView?: 'month' | 'week' | 'day' | 'agenda';
  showSidebar?: boolean;
  compactMode?: boolean;
}

export default function GamingCalendar({ 
  initialView = 'month', 
  showSidebar = true,
  compactMode = false 
}: GamingCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>(initialView);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<CalendarFilter>({
    event_types: [],
    games: [],
    priority: [],
    status: ['scheduled', 'live'],
    user_events_only: false,
    friends_events: false
  });

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [currentDate, user]);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const calendarFilter: CalendarFilter = {
        date_range: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      };

      const eventList = await gamingCalendarManager.getEvents(calendarFilter);
      setEvents(eventList);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      toast({
        title: "Error loading events",
        description: "Failed to load calendar events. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const calendarStats = await gamingCalendarManager.getCalendarStats(user?.id);
      setStats(calendarStats);
    } catch (error) {
      console.error('Error loading calendar stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.event_types && filters.event_types.length > 0) {
      filtered = filtered.filter(event => filters.event_types!.includes(event.type));
    }

    if (filters.games && filters.games.length > 0) {
      filtered = filtered.filter(event => event.game_id && filters.games!.includes(event.game_id));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(event => filters.priority!.includes(event.priority));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(event => filters.status!.includes(event.status));
    }

    if (filters.user_events_only) {
      filtered = filtered.filter(event => 
        event.organizer_id === user?.id || 
        event.participants.some(p => p.user_id === user?.id)
      );
    }

    setFilteredEvents(filtered);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeIcon = (type: EventType) => {
    const iconMap = {
      tournament: <Trophy className="h-4 w-4 text-yellow-500" />,
      game_release: <Star className="h-4 w-4 text-purple-500" />,
      community_event: <Users className="h-4 w-4 text-blue-500" />,
      scrimmage: <Gamepad2 className="h-4 w-4 text-green-500" />,
      gaming_session: <Play className="h-4 w-4 text-orange-500" />,
      stream_schedule: <Eye className="h-4 w-4 text-red-500" />,
      maintenance: <Settings className="h-4 w-4 text-gray-500" />,
      league_match: <Trophy className="h-4 w-4 text-indigo-500" />
    };
    
    return iconMap[type] || <CalendarIcon className="h-4 w-4" />;
  };

  const getEventTypeColor = (type: EventType) => {
    const colorMap = {
      tournament: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
      game_release: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      community_event: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      scrimmage: 'bg-green-500/20 text-green-700 dark:text-green-300',
      gaming_session: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      stream_schedule: 'bg-red-500/20 text-red-700 dark:text-red-300',
      maintenance: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
      league_match: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
    };
    
    return colorMap[type] || 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-gray-300';
    }
  };

  const formatEventTime = (startTime: string, endTime?: string, allDay?: boolean) => {
    const start = new Date(startTime);
    
    if (allDay) {
      return 'All day';
    }
    
    const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (endTime) {
      const end = new Date(endTime);
      const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${timeStr} - ${endTimeStr}`;
    }
    
    return timeStr;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    const currentDay = new Date(startOfWeek);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayEvents = getEventsForDate(currentDay);
      const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
      const isToday = currentDay.toDateString() === new Date().toDateString();
      
      days.push(
        <motion.div
          key={currentDay.toISOString()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.01 }}
          className={`min-h-[120px] p-2 border border-border ${
            isCurrentMonth ? 'bg-background' : 'bg-muted/50'
          } ${isToday ? 'ring-2 ring-primary' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              isCurrentMonth ? '' : 'text-muted-foreground'
            } ${isToday ? 'text-primary font-bold' : ''}`}>
              {currentDay.getDate()}
            </span>
            {dayEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dayEvents.length}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.05 }}
                className={`p-1 rounded text-xs cursor-pointer border-l-2 ${getPriorityColor(event.priority)} ${getEventTypeColor(event.type)}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-center gap-1">
                  {getEventTypeIcon(event.type)}
                  <span className="truncate flex-1">{event.title}</span>
                </div>
                <div className="text-xs opacity-75">
                  {formatEventTime(event.start_time, event.end_time, event.all_day)}
                </div>
              </motion.div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </motion.div>
      );
      
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
        {/* Week headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center font-medium bg-muted text-sm">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderAgendaView = () => {
    const today = new Date();
    const upcoming = filteredEvents
      .filter(event => new Date(event.start_time) >= today)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 20);

    const groupedEvents: { [key: string]: GameEvent[] } = {};
    upcoming.forEach(event => {
      const dateKey = new Date(event.start_time).toDateString();
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return (
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
          <div key={dateKey}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {new Date(dateKey).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`cursor-pointer border-l-4 ${getPriorityColor(event.priority)} hover:shadow-lg transition-shadow`}
                        onClick={() => setSelectedEvent(event)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getEventTypeIcon(event.type)}
                            <h4 className="font-semibold">{event.title}</h4>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatEventTime(event.start_time, event.end_time, event.all_day)}
                            </div>
                            
                            {event.game && (
                              <div className="flex items-center gap-1">
                                <Gamepad2 className="h-3 w-3" />
                                {event.game.name}
                              </div>
                            )}
                            
                            {event.participants.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.participants.length}
                                {event.max_participants && ` / ${event.max_participants}`}
                              </div>
                            )}
                            
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {event.prize_pool && (
                            <Badge variant="outline" className="text-green-600">
                              ${event.prize_pool.toLocaleString()}
                            </Badge>
                          )}
                          
                          {event.status === 'live' && (
                            <Badge className="bg-red-500 text-white animate-pulse">
                              LIVE
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1">
                            {event.participants.slice(0, 3).map((participant, index) => (
                              <Avatar key={participant.user_id} className="h-6 w-6 -ml-1 border-2 border-background">
                                <AvatarImage src={participant.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {participant.username[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {event.participants.length > 3 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                +{event.participants.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        
        {upcoming.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">No upcoming events</p>
              <p className="text-muted-foreground">
                Create your first gaming event or check back later for new tournaments and releases
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const getDateRangeText = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    switch (view) {
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'agenda':
        return 'Upcoming Events';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-6 ${compactMode ? 'max-w-4xl' : ''}`}>
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <h1 className="text-xl font-bold">{getDateRangeText()}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={view} onValueChange={(value: any) => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className={`grid ${showSidebar ? 'lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
        {/* Main Calendar */}
        <div className={showSidebar ? 'lg:col-span-3' : ''}>
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading calendar events...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {view === 'month' && renderMonthView()}
              {view === 'agenda' && renderAgendaView()}
              {(view === 'week' || view === 'day') && renderAgendaView()}
            </>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="space-y-6">
            {/* Quick Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Gaming Calendar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-secondary/20 rounded">
                      <p className="font-bold text-lg">{stats.upcoming_events}</p>
                      <p className="text-muted-foreground text-xs">Upcoming</p>
                    </div>
                    <div className="text-center p-2 bg-secondary/20 rounded">
                      <p className="font-bold text-lg">{stats.tournaments_registered}</p>
                      <p className="text-muted-foreground text-xs">Tournaments</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>This Week</span>
                      <span>{stats.events_this_week}</span>
                    </div>
                    <Progress value={(stats.events_this_week / 7) * 100} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Event Types</label>
                        <div className="space-y-1">
                          {['tournament', 'game_release', 'gaming_session', 'community_event'].map((type) => (
                            <label key={type} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={filters.event_types?.includes(type as EventType)}
                                onChange={(e) => {
                                  const types = filters.event_types || [];
                                  if (e.target.checked) {
                                    setFilters({...filters, event_types: [...types, type as EventType]});
                                  } else {
                                    setFilters({...filters, event_types: types.filter(t => t !== type)});
                                  }
                                }}
                              />
                              {type.replace('_', ' ')}
                            </label>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full text-sm justify-start">
                  <Trophy className="h-4 w-4 mr-2" />
                  Browse Tournaments
                </Button>
                <Button variant="outline" className="w-full text-sm justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Schedule Gaming Session
                </Button>
                <Button variant="outline" className="w-full text-sm justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Manage Notifications
                </Button>
                <Button variant="outline" className="w-full text-sm justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Calendar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
