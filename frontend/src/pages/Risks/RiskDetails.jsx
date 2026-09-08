import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, AlertTriangle, Calendar, Activity, BrainCircuit } from 'lucide-react';
import { format } from 'date-fns';

const fetchRiskDetails = async (id) => {
  const riskRes = await api.get(`/risks/${id}`);
  const risk = riskRes.data;

  // Fetch associated event if available
  let event = null;
  if (risk.event_id) {
    try {
      const eventRes = await api.get(`/events/${risk.event_id}`);
      event = eventRes.data;
    } catch (err) {
      console.warn("Could not fetch associated event", err);
    }
  }

  // Fetch related predictions
  let predictions = [];
  try {
    const predsRes = await api.get('/predictions/');
    predictions = predsRes.data.filter(p => p.risk_id === parseInt(id));
  } catch (err) {
    console.warn("Could not fetch associated predictions", err);
  }

  return {
    ...risk,
    event,
    predictions
  };
};

export default function RiskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: risk, isLoading, isError, error } = useQuery({
    queryKey: ['risk', id],
    queryFn: () => fetchRiskDetails(id),
  });

  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Failed to load risk details</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/risks')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Risks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/risks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Risk Details</h2>
          <p className="text-muted-foreground">Detailed risk analysis and associated intelligence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Risk Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {isLoading ? <Skeleton className="h-8 w-[300px]" /> : risk?.risk_name}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-4">
                    {isLoading ? (
                      <Skeleton className="h-4 w-[200px]" />
                    ) : (
                      <>
                        <Badge variant="outline">{risk?.risk_type}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created: {risk?.created_at ? format(new Date(risk.created_at), 'MMM d, yyyy') : 'Unknown'}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
                {!isLoading && <SeverityBadge severity={risk?.severity} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Risk Score</h4>
                  <div className="text-2xl font-bold text-primary">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : (risk?.risk_score != null ? `${Number(risk.risk_score).toFixed(2)}%` : '0%')}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Probability</h4>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : (risk?.probability != null ? `${Number(risk.probability).toFixed(2)}%` : 'N/A')}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <div className="mt-1">
                    {isLoading ? <Skeleton className="h-6 w-20" /> : <Badge variant="secondary">{risk?.status}</Badge>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                  <div className="text-sm mt-2">
                    {isLoading ? <Skeleton className="h-5 w-24" /> : (risk?.updated_at ? format(new Date(risk.updated_at), 'PPp') : 'Never')}
                  </div>
                </div>
              </div>

              {/* Related Event Section */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="h-5 w-5" /> Source Event Trigger</h3>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : risk?.event ? (
                  <div 
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/events/${risk.event.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium line-clamp-1">{risk.event.title}</h4>
                      <SeverityBadge severity={risk.event.severity} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{risk.event.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{risk.event.event_type}</span>
                      <span>{risk.event.location || 'Unknown Location'}</span>
                      <span>{risk.event.event_time ? format(new Date(risk.event.event_time), 'PP') : ''}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                    No linked event information available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / AI Predictions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> AI Predictions</CardTitle>
              <CardDescription>Forward-looking severity analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : risk?.predictions?.length > 0 ? (
                <div className="space-y-4">
                  {risk.predictions.map(pred => (
                    <div 
                      key={pred.id} 
                      className="p-3 border rounded-lg bg-muted/10 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/predictions/${pred.id}`)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{pred.predicted_risk}</span>
                        <SeverityBadge severity={pred.predicted_severity} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                        <span>Model: {pred.prediction_model}</span>
                        <span>Confidence: {pred.confidence_score != null ? `${(Number(pred.confidence_score) * 100).toFixed(1)}%` : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                  No AI predictions generated for this risk yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
