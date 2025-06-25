'use client';

import { useState, useEffect } from 'react';
import * as restate from '@restatedev/restate-sdk-clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, PlayCircle } from 'lucide-react';
import { helloWorkflow } from '@/restate-services/helloService';

interface WorkflowInstance {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: string;
    submittedAt: Date;
    completedAt?: Date;
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
    const [isStarting, setIsStarting] = useState(false);
    const [client, setClient] = useState<ReturnType<typeof restate.connect> | null>(null);

    useEffect(() => {
        // Initialize Restate client
        const rs = restate.connect({ url: 'http://127.0.0.1:8080' });
        setClient(rs);
    }, []);

    const generateRandomId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    const startWorkflows = async () => {
        if (!client) return;

        setIsStarting(true);
        const newWorkflows: WorkflowInstance[] = [];

        // Generate 10 random workflow IDs
        for (let i = 0; i < 10; i++) {
            const id = generateRandomId();
            newWorkflows.push({
                id,
                status: 'pending',
                submittedAt: new Date(),
            });
        }

        setWorkflows(newWorkflows);

        // Submit all workflows
        try {
            const submissions = newWorkflows.map(async (workflow) => {
                try {
                    // Submit the workflow
                    const handle = await client
                        .workflowClient<typeof helloWorkflow>({ name: 'helloWorkflow' }, workflow.id)
                        .workflowSubmit();

                    // Update status to running
                    setWorkflows(prev =>
                        prev.map(w =>
                            w.id === workflow.id
                                ? { ...w, status: 'running' as const }
                                : w
                        )
                    );

                    // Wait for completion
                    const result = await client.result(handle);

                    // Update status to completed
                    setWorkflows(prev =>
                        prev.map(w =>
                            w.id === workflow.id
                                ? {
                                    ...w,
                                    status: 'completed' as const,
                                    result: result as string,
                                    completedAt: new Date()
                                }
                                : w
                        )
                    );
                } catch (error) {
                    console.error(`Workflow ${workflow.id} failed:`, error);
                    setWorkflows(prev =>
                        prev.map(w =>
                            w.id === workflow.id
                                ? { ...w, status: 'error' as const }
                                : w
                        )
                    );
                }
            });

            await Promise.all(submissions);
        } catch (error) {
            console.error('Error starting workflows:', error);
        } finally {
            setIsStarting(false);
        }
    };

    const getStatusBadge = (status: WorkflowInstance['status']) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            case 'running':
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Running
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                    </Badge>
                );
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
        }
    };

    const getStatusIcon = (status: WorkflowInstance['status']) => {
        switch (status) {
            case 'pending':
                return <PlayCircle className="w-4 h-4 text-gray-500" />;
            case 'running':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <div className="w-4 h-4 bg-red-500 rounded-full" />;
        }
    };

    const completedCount = workflows.filter(w => w.status === 'completed').length;
    const runningCount = workflows.filter(w => w.status === 'running').length;
    const errorCount = workflows.filter(w => w.status === 'error').length;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Workflow Dashboard</h1>
                <p className="text-gray-600">
                    Start 10 workflows with random IDs and track their progress
                </p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Button
                    onClick={startWorkflows}
                    disabled={isStarting || !client}
                    className="flex items-center gap-2"
                >
                    {isStarting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Starting Workflows...
                        </>
                    ) : (
                        <>
                            <PlayCircle className="w-4 h-4" />
                            Start 10 Workflows
                        </>
                    )}
                </Button>

                {workflows.length > 0 && (
                    <div className="flex gap-4 text-sm">
                        <span className="text-green-600">✓ {completedCount} completed</span>
                        <span className="text-blue-600">⟳ {runningCount} running</span>
                        {errorCount > 0 && (
                            <span className="text-red-600">✗ {errorCount} errors</span>
                        )}
                    </div>
                )}
            </div>

            {workflows.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workflows.map((workflow) => (
                        <Card key={workflow.id} className="transition-all duration-200 hover:shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-mono">
                                        {workflow.id}
                                    </CardTitle>
                                    {getStatusIcon(workflow.status)}
                                </div>
                                <CardDescription className="text-xs">
                                    Started: {workflow.submittedAt.toLocaleTimeString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {getStatusBadge(workflow.status)}

                                    {workflow.result && (
                                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            Result: {workflow.result}
                                        </div>
                                    )}

                                    {workflow.completedAt && (
                                        <div className="text-xs text-green-600">
                                            Completed: {workflow.completedAt.toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {workflows.length === 0 && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                Click "Start 10 Workflows" to begin
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 