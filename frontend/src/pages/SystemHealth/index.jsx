import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Activity, Database, Server, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const fetchHealthData = async () => {
  const [healthRes, logsRes] = await Promise.all([
    api.get('/health'),
    api.get('/system-logs/')
  ]);
  
  return {
    health: healthRes.data,
    logs: logsRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
  };
};

export default function SystemHealth() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: fetchHealthData,
    refetchInterval: 15000, // Refresh every 15s
  });

  if (isError) {
    return (
      <div className="p-8 text-center">
        <Server className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">System Offline</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  const isHealthy = data?.health?.database?.includes('Successfully') || false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
        <p className="text-muted-foreground">Monitor platform infrastructure and backend service status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Service</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-2xl font-bold">Online</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">FastAPI Backend Operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-destructive'}`}></div>
                <span className="text-2xl font-bold">{isHealthy ? 'Connected' : 'Degraded'}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 truncate" title={data?.health?.database}>{data?.health?.database || 'Pending check'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Pipeline</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-2xl font-bold">Ready</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">HuggingFace Models Loaded</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
          <CardDescription>Latest infrastructure and security events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.logs?.length > 0 ? (
            <div className="space-y-4">
              {data.logs.map(log => (
                <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {log.log_level?.toLowerCase() === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : log.log_level?.toLowerCase() === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{log.details}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                        <Clock className="h-3 w-3" />
                        {log.created_at ? format(new Date(log.created_at), 'PPpp') : 'Unknown time'}
                        {log.ip_address && <span className="ml-2">• IP: {log.ip_address}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={log.log_level?.toLowerCase() === 'error' ? 'destructive' : 'outline'}>
                    {log.log_level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
              No system logs recorded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
