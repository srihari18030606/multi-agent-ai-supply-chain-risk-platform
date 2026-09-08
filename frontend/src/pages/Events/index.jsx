import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Search, X, ChevronLeft, ChevronRight, MapPin, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';

const fetchEvents = async () => {
  const response = await api.get('/events/');
  return response.data;
};

export default function Events() {
  const navigate = useNavigate();
  const { data: events = [], isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  // Filtering State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Derive unique filter options from data
  const eventTypes = useMemo(() => [...new Set(events.map(e => e.event_type).filter(Boolean))], [events]);
  const severities = useMemo(() => [...new Set(events.map(e => e.severity).filter(Boolean))], [events]);
  const statuses = useMemo(() => [...new Set(events.map(e => e.status).filter(Boolean))], [events]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = search === '' || 
        event.title?.toLowerCase().includes(search.toLowerCase()) || 
        event.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === '' || event.event_type === typeFilter;
      const matchesSeverity = severityFilter === '' || event.severity === severityFilter;
      const matchesStatus = statusFilter === '' || event.status === statusFilter;

      return matchesSearch && matchesType && matchesSeverity && matchesStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [events, search, typeFilter, severityFilter, statusFilter]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setSeverityFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, typeFilter, severityFilter, statusFilter]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <Activity className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load events</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">Monitor and manage global supply chain disruptions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Event Type</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Severity</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                {severities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                </select>
              </div>
              {(search || typeFilter || severityFilter || statusFilter) && (
                <Button variant="ghost" className="h-9 w-9 p-0 mt-6 shrink-0" onClick={handleClearFilters} title="Clear filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Results ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10">
              <Activity className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No events found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.map(event => (
                    <TableRow 
                      key={event.id} 
                      className="cursor-pointer"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="line-clamp-1" title={event.title}>{event.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{event.event_type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.location || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {event.event_time ? format(new Date(event.event_time), 'MMM d, yyyy') : 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={event.severity} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SeverityBadge({ severity }) {
  if (!severity) return <Badge variant="outline">Unknown</Badge>;
  const lower = severity.toLowerCase();
  if (lower === 'high' || lower === 'critical') return <Badge variant="high">{severity}</Badge>;
  if (lower === 'medium') return <Badge variant="medium">{severity}</Badge>;
  if (lower === 'low') return <Badge variant="low">{severity}</Badge>;
  return <Badge variant="outline">{severity}</Badge>;
}
