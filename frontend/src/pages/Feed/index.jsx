import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Activity, AlertTriangle, BrainCircuit, Lightbulb, Rss, Clock } from 'lucide-react';
import { format } from 'date-fns';

const fetchFeedData = async () => {
  const [eventsRes, risksRes, predictionsRes, recsRes] = await Promise.all([
    api.get('/events/'),
    api.get('/risks/'),
    api.get('/predictions/'),
    api.get('/recommendations/'),
  ]);

  const feed = [];

  eventsRes.data.forEach(item => {
    if(item.created_at) feed.push({ ...item, type: 'Event', timestamp: new Date(item.created_at) });
  });
  risksRes.data.forEach(item => {
    if(item.created_at) feed.push({ ...item, type: 'Risk', timestamp: new Date(item.created_at) });
  });
  predictionsRes.data.forEach(item => {
    if(item.created_at) feed.push({ ...item, type: 'Prediction', timestamp: new Date(item.created_at) });
  });
  recsRes.data.forEach(item => {
    if(item.created_at) feed.push({ ...item, type: 'Recommendation', timestamp: new Date(item.created_at) });
  });

  return feed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50); // Top 50 newest items
};

export default function IntelligenceFeed() {
  const navigate = useNavigate();
  const { data: feed = [], isLoading, isError, error } = useQuery({
    queryKey: ['intelligenceFeed'],
    queryFn: fetchFeedData,
    refetchInterval: 30000,
  });

  if (isError) {
    return (
      <div className="p-8 text-center">
        <Rss className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load intelligence feed</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  const renderFeedItem = (item) => {
    switch (item.type) {
      case 'Event':
        return (
          <div 
            key={`event-${item.id}`} 
            className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/events/${item.id}`)}
          >
            <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full h-fit">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">{item.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(item.timestamp, 'MMM d, p')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">New Event</Badge>
                <Badge variant="outline" className="text-[10px]">{item.event_type}</Badge>
              </div>
            </div>
          </div>
        );
      case 'Risk':
        return (
          <div 
            key={`risk-${item.id}`} 
            className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/risks/${item.id}`)}
          >
            <div className="mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded-full h-fit">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">Risk Detected: {item.risk_name}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(item.timestamp, 'MMM d, p')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">A {item.severity?.toLowerCase() || 'unknown'} severity risk has been identified by the AI engine.</p>
              <div className="flex gap-2 mt-2 items-center">
                <SeverityBadge severity={item.severity} />
                <span className="text-xs text-muted-foreground">Score: {item.risk_score != null ? `${Number(item.risk_score).toFixed(2)}%` : '0%'}</span>
              </div>
            </div>
          </div>
        );
      case 'Prediction':
        return (
          <div 
            key={`pred-${item.id}`} 
            className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/predictions/${item.id}`)}
          >
            <div className="mt-1 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full h-fit">
              <BrainCircuit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">AI Prediction Generated</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(item.timestamp, 'MMM d, p')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Forecasted Risk: {item.predicted_risk}</p>
              <div className="flex gap-2 mt-2 items-center">
                <Badge variant="outline" className="text-[10px]">Model: {item.prediction_model}</Badge>
                <span className="text-xs text-muted-foreground">Confidence: {item.confidence_score != null ? Number(item.confidence_score).toFixed(4) : 'N/A'}</span>
              </div>
            </div>
          </div>
        );
      case 'Recommendation':
        return (
          <div 
            key={`rec-${item.id}`} 
            className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/recommendations/${item.id}`)}
          >
            <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-2 rounded-full h-fit">
              <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">Mitigation Strategy Available</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(item.timestamp, 'MMM d, p')}
                </span>
              </div>
              <p className="text-sm font-medium mt-1">{item.recommendation_title}</p>
              <div className="flex gap-2 mt-2">
                <PriorityBadge priority={item.priority} />
                <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Intelligence Feed</h2>
        <p className="text-muted-foreground">Real-time chronological stream of system activity and AI insights.</p>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2"><Rss className="h-5 w-5 text-primary" /> Live Updates</CardTitle>
          <CardDescription>The 50 most recent platform activities.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="mx-auto h-10 w-10 mb-4 opacity-50" />
              <p>No recent activity found in the system.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map(item => renderFeedItem(item))}
            </div>
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

function PriorityBadge({ priority }) {
  if (!priority) return <Badge variant="outline">Unknown</Badge>;
  const lower = priority.toLowerCase();
  if (lower === 'high' || lower === 'critical') return <Badge variant="destructive">{priority}</Badge>;
  if (lower === 'medium') return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">{priority}</Badge>;
  if (lower === 'low') return <Badge variant="secondary">{priority}</Badge>;
  return <Badge variant="outline">{priority}</Badge>;
}
