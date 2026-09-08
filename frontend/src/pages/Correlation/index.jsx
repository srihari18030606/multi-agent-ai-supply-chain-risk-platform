import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
import { Network, MapPin, AlertTriangle } from 'lucide-react';

const fetchCorrelation = async () => {
  const response = await api.get('/correlation/summary');
  return response.data.results || [];
};

export default function CorrelationIntelligence() {
  const { data: correlations = [], isLoading, isError, error } = useQuery({
    queryKey: ['correlation'],
    queryFn: fetchCorrelation,
  });

  if (isError) {
    return (
      <div className="p-8 text-center">
        <Network className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load correlation data</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  // Sort by overall score descending
  const sortedCorrelations = [...correlations].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Correlation Intelligence</h2>
          <p className="text-muted-foreground">Geospatial risk grouping and aggregated severity analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" /> Regional Risk Clusters</CardTitle>
            <CardDescription>Aggregated analysis of interconnected active supply chain disruptions by region.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : sortedCorrelations.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No active risk clusters</h3>
                <p className="text-sm text-muted-foreground mt-1">There are currently no grouped risks to correlate.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Hub</TableHead>
                    <TableHead>Active Triggers</TableHead>
                    <TableHead>Risk Categories</TableHead>
                    <TableHead>Aggregated Score</TableHead>
                    <TableHead>Overall Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCorrelations.map((cluster, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {cluster.location || 'Unknown Location'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cluster.active_events} Events</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {cluster.categories?.slice(0, 3).map((cat, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{cat}</Badge>
                          ))}
                          {cluster.categories?.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">+{cluster.categories.length - 3} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{cluster.overall_score != null ? `${Number(cluster.overall_score).toFixed(2)}%` : '0%'}</div>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={cluster.overall_risk} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Highlight top cluster if it exists */}
        {sortedCorrelations.length > 0 && !isLoading && (
          <Card className="md:col-span-3 border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Most Critical Region: {sortedCorrelations[0].location || 'Unknown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This region currently has <strong>{sortedCorrelations[0].active_events}</strong> active overlapping disruptions 
                resulting in an aggregated risk score of <strong>{sortedCorrelations[0].overall_score}%</strong>. 
                Immediate mitigation strategies should prioritize this geographical node.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
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
