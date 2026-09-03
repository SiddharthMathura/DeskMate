// frontend/src/hooks/useHealthCheck.ts
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { HealthCheckResponse } from '../types';

type Status = 'loading' | 'ok' | 'error';

export function useHealthCheck() {
    const [status, setStatus] = useState<Status>('loading');
    const [data, setData] = useState<HealthCheckResponse | null>(null);

    useEffect(() => {
        apiClient
        .get<HealthCheckResponse>('/health')
        .then((res) => {
            setData(res);
            setStatus('ok');
        })
        .catch(() => setStatus('error'));
    }, []);

    return { status, data };
}