import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Activity, AlertTriangle, BrainCircuit, Lightbulb, TrendingUp, ShieldAlert } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

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
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const { events, risks, predictions, recommendations } = data;

    const highSeverityRisks = risks.filter((r) => r.severity?.toLowerCase() === 'high' || r.severity?.toLowerCase() === 'critical');
    
    const riskTypeMap = {};
    risks.forEach(r => {
      const t = r.risk_type || 'Unknown';
      riskTypeMap[t] = (riskTypeMap[t] || 0) + 1;
    });
    
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4'];
    const riskChartData = Object.keys(riskTypeMap).map((k, i) => ({
      name: k,
      value: riskTypeMap[k],
      color: colors[i % colors.length]
    }));

    const avgConfidence = predictions.length > 0 
      ? predictions.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0) / predictions.length 
      : 0;

    const dateMap = {};
    events.forEach(e => {
      const d = new Date(e.created_at);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = (dateMap[key] || 0) + 1;
    });
    const eventVolumeData = Object.keys(dateMap).sort().slice(-14).map(k => {
      const dateObj = new Date(k);
      dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
      return {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        events: dateMap[k]
      };
    });

    const categoryStats = {};
    risks.forEach(r => {
      const t = r.risk_type || 'Unknown';
      if (!categoryStats[t]) {
        categoryStats[t] = { name: t, eventCount: 0, maxScore: 0, severities: [] };
      }
      categoryStats[t].eventCount += 1;
      if ((r.risk_score || 0) > categoryStats[t].maxScore) categoryStats[t].maxScore = r.risk_score;
      if (r.severity) categoryStats[t].severities.push(r.severity);
    });
    
    const severityRank = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const topRiskCategories = Object.values(categoryStats).map(cat => {
      const maxSev = cat.severities.sort((a,b) => (severityRank[b.toLowerCase()]||0) - (severityRank[a.toLowerCase()]||0))[0] || 'Unknown';
      return {
        ...cat,
        highestSeverity: maxSev
      };
    }).sort((a,b) => b.maxScore - a.maxScore).slice(0, 5);

    const allActivity = [
      ...events.map(e => ({ id: `e-${e.id}`, type: 'event', title: e.title, desc: e.event_type, date: new Date(e.created_at) })),
      ...risks.map(r => ({ id: `r-${r.id}`, type: 'risk', title: r.risk_name, desc: `Score: ${Number(r.risk_score).toFixed(1)}%`, date: new Date(r.created_at) })),
      ...predictions.map(p => ({ id: `p-${p.id}`, type: 'prediction', title: p.prediction_type, desc: `Confidence: ${(p.confidence_score*100).toFixed(0)}%`, date: new Date(p.created_at) })),
      ...recommendations.map(r => ({ id: `rec-${r.id}`, type: 'recommendation', title: r.recommendation_title, desc: r.status, date: new Date(r.created_at) }))
    ].sort((a,b) => b.date - a.date).slice(0, 10);

    return {
      totalEvents: events.length,
      activeRisks: risks.length,
      highSeverityRisks: highSeverityRisks.length,
      avgConfidence: (avgConfidence * 100).toFixed(0),
      riskChartData,
      eventVolumeData,
      topRiskCategories,
      allActivity
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Enterprise Intelligence</h2>
        <p className="text-muted-foreground mt-1">High-level overview of supply chain health and AI assessments.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Critical Alerts"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.highSeverityRisks}
          icon={TrendingUp}
          valueClass="text-destructive"
        />
        <KpiCard
          title="Avg AI Confidence"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.avgConfidence}%`}
          icon={BrainCircuit}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Event Volume Trend */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Event Volume Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : stats?.eventVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.eventVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc'}}
                    itemStyle={{color: '#e2e8f0'}}
                  />
                  <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No event data available</div>
            )}
          </CardContent>
        </Card>

        {/* Risk Categories */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Risk Categories</CardTitle>
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
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No active risks</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Top Highest-Risk Categories */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Top Highest-Risk Categories</CardTitle>
            <CardDescription>Grouped by max severity and active events.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : stats?.topRiskCategories.length > 0 ? (
              <div className="space-y-4">
                {stats.topRiskCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.eventCount} active {cat.eventCount === 1 ? 'event' : 'events'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Max Score</p>
                        <p className="font-semibold text-sm">{Number(cat.maxScore).toFixed(2)}%</p>
                      </div>
                      <div className="w-24 text-right">
                        <SeverityBadge severity={cat.highestSeverity} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active categories.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Intelligence Activity */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Intelligence Activity</CardTitle>
            <CardDescription>Latest insights across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
            <div className="pr-4 h-[350px] overflow-y-auto space-y-4 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : stats?.allActivity.length > 0 ? (
                <div className="space-y-5">
                  {stats.allActivity.map((act) => (
                    <div key={act.id} className="flex gap-3">
                      <ActivityIcon type={act.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={act.title}>{act.title}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(act.date, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, valueClass = '' }) {
  return (
    <Card className="flex flex-col justify-between p-5">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && (
          <div className="p-2 bg-muted/50 rounded-full">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div>
        <div className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</div>
      </div>
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

function ActivityIcon({ type }) {
  switch(type) {
    case 'recommendation':
      return <div className="mt-0.5 flex-shrink-0 h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center"><Lightbulb className="h-3.5 w-3.5 text-purple-500" /></div>;
    case 'prediction':
      return <div className="mt-0.5 flex-shrink-0 h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center"><BrainCircuit className="h-3.5 w-3.5 text-green-500" /></div>;
    case 'risk':
      return <div className="mt-0.5 flex-shrink-0 h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center"><ShieldAlert className="h-3.5 w-3.5 text-red-500" /></div>;
    case 'event':
    default:
      return <div className="mt-0.5 flex-shrink-0 h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center"><Activity className="h-3.5 w-3.5 text-blue-500" /></div>;
  }
}
