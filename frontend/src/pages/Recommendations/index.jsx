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
import { Search, X, ChevronLeft, ChevronRight, Lightbulb, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const fetchRecommendations = async () => {
  const response = await api.get('/recommendations/');
  return response.data;
};

export default function Recommendations() {
  const navigate = useNavigate();
  const { data: recommendations = [], isLoading, isError, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
  });

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const priorities = useMemo(() => [...new Set(recommendations.map(r => r.priority).filter(Boolean))], [recommendations]);
  const statuses = useMemo(() => [...new Set(recommendations.map(r => r.status).filter(Boolean))], [recommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      const matchesSearch = search === '' || 
        rec.recommendation_title?.toLowerCase().includes(search.toLowerCase()) ||
        rec.recommendation_text?.toLowerCase().includes(search.toLowerCase());
      
      const matchesPriority = priorityFilter === '' || rec.priority === priorityFilter;
      const matchesStatus = statusFilter === '' || rec.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [recommendations, search, priorityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecommendations.length / itemsPerPage));
  const paginatedRecommendations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecommendations.slice(start, start + itemsPerPage);
  }, [filteredRecommendations, currentPage]);

  const handleClearFilters = () => {
    setSearch('');
    setPriorityFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, priorityFilter, statusFilter]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <Lightbulb className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load recommendations</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Recommendations</h2>
          <p className="text-muted-foreground">Actionable mitigation strategies derived from predictive models.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search titles or content..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
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
              {(search || priorityFilter || statusFilter) && (
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
          <CardTitle>Results ({filteredRecommendations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-10">
              <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No recommendations found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecommendations.map(rec => (
                    <TableRow 
                      key={rec.id} 
                      className="cursor-pointer"
                      onClick={() => navigate(`/recommendations/${rec.id}`)}
                    >
                      <TableCell className="font-medium max-w-md">
                        <div className="line-clamp-1" title={rec.recommendation_title}>{rec.recommendation_title}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground mt-1 font-normal">{rec.recommendation_text}</div>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={rec.priority} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={rec.status?.toLowerCase() === 'implemented' ? 'default' : 'secondary'}>{rec.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {rec.created_at ? format(new Date(rec.created_at), 'MMM d, yyyy') : 'Unknown'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecommendations.length)} of {filteredRecommendations.length}
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

function PriorityBadge({ priority }) {
  if (!priority) return <Badge variant="outline">Unknown</Badge>;
  const lower = priority.toLowerCase();
  if (lower === 'high' || lower === 'critical') return <Badge variant="destructive">{priority}</Badge>;
  if (lower === 'medium') return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">{priority}</Badge>;
  if (lower === 'low') return <Badge variant="secondary">{priority}</Badge>;
  return <Badge variant="outline">{priority}</Badge>;
}
