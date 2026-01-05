import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import type {
  AWSInstanceType,
  AWSAMI,
  AWSRDSEngine,
  AWSRDSInstanceClass,
  AWSEKSVersion,
} from '@/types';

interface UseAWSDataOptions {
  region?: string;
  enabled?: boolean;
}

interface AWSDataState {
  instanceTypes: AWSInstanceType[];
  amis: AWSAMI[];
  availabilityZones: string[];
  rdsEngines: AWSRDSEngine[];
  rdsInstanceClasses: AWSRDSInstanceClass[];
  eksVersions: AWSEKSVersion[];
  isLoading: boolean;
  error: string | null;
  source: 'aws' | 'cache' | 'fallback' | null;
  isAWSConfigured: boolean;
}

export function useAWSData(options: UseAWSDataOptions = {}) {
  const { region, enabled = true } = options;

  const [state, setState] = useState<AWSDataState>({
    instanceTypes: [],
    amis: [],
    availabilityZones: [],
    rdsEngines: [],
    rdsInstanceClasses: [],
    eksVersions: [],
    isLoading: false,
    error: null,
    source: null,
    isAWSConfigured: false,
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [status, instanceTypes, amis, azs, engines, classes, eksVersions] = await Promise.all([
        api.getAWSStatus(),
        api.getEC2InstanceTypes(region),
        api.getEC2AMIs(region),
        api.getAvailabilityZones(region),
        api.getRDSEngines(region),
        api.getRDSInstanceClasses(region),
        api.getEKSVersions(region),
      ]);

      setState({
        instanceTypes: instanceTypes.instance_types,
        amis: amis.amis,
        availabilityZones: azs.availability_zones,
        rdsEngines: engines.engines,
        rdsInstanceClasses: classes.instance_classes,
        eksVersions: eksVersions.versions,
        isLoading: false,
        error: null,
        source: instanceTypes.source,
        isAWSConfigured: status.configured,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch AWS data',
      }));
    }
  }, [region, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshRDSClasses = useCallback(async (engine: string, version?: string) => {
    try {
      const result = await api.getRDSInstanceClasses(region, engine, version);
      setState(prev => ({
        ...prev,
        rdsInstanceClasses: result.instance_classes,
      }));
    } catch (err) {
      console.error('Failed to refresh RDS classes:', err);
    }
  }, [region]);

  return {
    ...state,
    refresh: fetchData,
    refreshRDSClasses,
  };
}
