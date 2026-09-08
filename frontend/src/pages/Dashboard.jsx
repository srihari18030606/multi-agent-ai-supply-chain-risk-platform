import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Activity, AlertTriangle, BrainCircuit, Lightbulb, TrendingUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const fetchDashboardData = async () => {
  const [eventsRes, risksRes, predictionsRes, recsRes] = await Promise.all([
    api.get('/events/'),
    api.get('/risks/'),
    api.get('/predictions/'),
    api.get('/recommendations/'),
  ]);
  return {
    events: eventsRes.data,
    risks: risksRes.data,
    predictions: predictionsRes.data,
    recommendations: recsRes.data,
  };
};

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // refresh every 30s
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const { events, risks, predictions, recommendations } = data;

    const highSeverityRisks = risks.filter((r) => r.severity?.toLowerCase() === 'high' || r.severity?.toLowerCase() === 'critical');
    
    // Risk distribution
    const riskDist = { High: 0, Medium: 0, Low: 0 };
    risks.forEach(r => {
      const sev = r.severity?.toLowerCase();
      if (sev === 'high' || sev === 'critical') riskDist.High++;
      else if (sev === 'medium') riskDist.Medium++;
      else riskDist.Low++;
    });

    const riskChartData = [
      { name: 'High', value: riskDist.High, color: '#ef4444' }, // red-500
      { name: 'Medium', value: riskDist.Medium, color: '#eab308' }, // yellow-500
      { name: 'Low', value: riskDist.Low, color: '#22c55e' }, // green-500
    ];

    // Predictions confidence average
    const avgConfidence = predictions.length > 0 
      ? predictions.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0) / predictions.length 
      : 0;

    return {
      totalEvents: events.length,
      activeRisks: risks.length,
      highSeverityRisks: highSeverityRisks.length,
      totalPredictions: predictions.length,
      totalRecommendations: recommendations.length,
      riskChartData,
      avgConfidence: (avgConfidence * 100).toFixed(1),
      recentEvents: [...events]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(event => {
          const associatedRisk = risks.find(r => r.event_id === event.id);
          return {
            ...event,
            displaySeverity: associatedRisk?.severity || 'Unknown'
          };
        }),
      topRisks: [...risks].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5),
      recentRecommendations: [...recommendations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    };
  }, [data]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load dashboard</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Supply chain risk intelligence overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Events"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalEvents}
          icon={Activity}
        />
        <KpiCard
          title="Active Risks"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeRisks}
          icon={AlertTriangle}
        />
        <KpiCard
          title="High Severity Risks"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.highSeverityRisks}
          icon={TrendingUp}
          valueClass="text-destructive"
        />
        <KpiCard
          title="AI Predictions"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalPredictions}
          icon={BrainCircuit}
          description={stats ? `Avg. ${stats.avgConfidence}% confidence` : ''}
        />
        <KpiCard
          title="Recommendations"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalRecommendations}
          icon={Lightbulb}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Risk Distribution Chart */}
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Severity breakdown of all active risks</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-[250px] w-[250px] rounded-full" />
            ) : stats?.riskChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No active risks</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Events List */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest supply chain disruptions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recentEvents.length > 0 ? (
              <div className="space-y-4">
                {stats.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.event_type} • {event.location || 'Unknown location'}</p>
                    </div>
                    <SeverityBadge severity={event.displaySeverity} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent events found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Risks */}
        <Card>
          <CardHeader>
            <CardTitle>Top Active Risks</CardTitle>
            <CardDescription>Risks requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.topRisks.length > 0 ? (
              <div className="space-y-4">
                {stats.topRisks.map((risk) => (
                  <div key={risk.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{risk.risk_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {risk.risk_type} • Score: {risk.risk_score != null ? `${Number(risk.risk_score).toFixed(2)}%` : '0%'}
                      </p>
                    </div>
                    <SeverityBadge severity={risk.severity} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active risks.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Recommendations</CardTitle>
            <CardDescription>AI-generated mitigation strategies</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recentRecommendations.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRecommendations.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{rec.recommendation_title || 'Mitigation Strategy'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">{rec.recommendation_text}</p>
                    </div>
                    <Badge variant={rec.status?.toLowerCase() === 'implemented' ? 'default' : 'outline'}>
                      {rec.status || 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recommendations available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, description, valueClass = '' }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
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
