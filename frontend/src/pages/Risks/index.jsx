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
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const fetchRisks = async () => {
  const response = await api.get('/risks/');
  return response.data;
};

export default function Risks() {
  const navigate = useNavigate();
  const { data: risks = [], isLoading, isError, error } = useQuery({
    queryKey: ['risks'],
    queryFn: fetchRisks,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const riskTypes = useMemo(() => [...new Set(risks.map(r => r.risk_type).filter(Boolean))], [risks]);
  const severities = useMemo(() => [...new Set(risks.map(r => r.severity).filter(Boolean))], [risks]);
  const statuses = useMemo(() => [...new Set(risks.map(r => r.status).filter(Boolean))], [risks]);

  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      const matchesSearch = search === '' || 
        risk.risk_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === '' || risk.risk_type === typeFilter;
      const matchesSeverity = severityFilter === '' || risk.severity === severityFilter;
      const matchesStatus = statusFilter === '' || risk.status === statusFilter;

      return matchesSearch && matchesType && matchesSeverity && matchesStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [risks, search, typeFilter, severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / itemsPerPage));
  const paginatedRisks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRisks.slice(start, start + itemsPerPage);
  }, [filteredRisks, currentPage]);

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setSeverityFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, typeFilter, severityFilter, statusFilter]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load risks</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Active Risks</h2>
          <p className="text-muted-foreground">Manage and analyze identified supply chain risks.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Risks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search risk names..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Risk Category</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {riskTypes.map(type => <option key={type} value={type}>{type}</option>)}
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
          <CardTitle>Results ({filteredRisks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredRisks.length === 0 ? (
            <div className="text-center py-10">
              <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No risks found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRisks.map(risk => (
                    <TableRow 
                      key={risk.id} 
                      className="cursor-pointer"
                      onClick={() => navigate(`/risks/${risk.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="line-clamp-2" title={risk.risk_name}>{risk.risk_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{risk.risk_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{risk.risk_score != null ? `${Number(risk.risk_score).toFixed(2)}%` : '0%'}</div>
                      </TableCell>
                      <TableCell>
                        {risk.probability != null ? `${Number(risk.probability).toFixed(2)}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={risk.severity} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{risk.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {risk.created_at ? format(new Date(risk.created_at), 'MMM d, yyyy') : 'Unknown'}
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRisks.length)} of {filteredRisks.length}
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
