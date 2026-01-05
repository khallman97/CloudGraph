"""
AWS Service Layer - Fetches live AWS data via boto3 with caching and fallbacks.
"""
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import threading
import logging
import os

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

logger = logging.getLogger(__name__)

# Configuration from environment
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
AWS_CACHE_TTL_SECONDS = int(os.getenv("AWS_CACHE_TTL_SECONDS", "3600"))


class TTLCache:
    """Thread-safe cache with TTL expiration."""

    def __init__(self, ttl_seconds: int = 3600):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._lock = threading.Lock()
        self._ttl = timedelta(seconds=ttl_seconds)

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._cache:
                value, timestamp = self._cache[key]
                if datetime.now() - timestamp < self._ttl:
                    return value
                del self._cache[key]
        return None

    def set(self, key: str, value: Any):
        with self._lock:
            self._cache[key] = (value, datetime.now())

    def clear(self):
        with self._lock:
            self._cache.clear()


# Global cache instance
_cache = TTLCache(AWS_CACHE_TTL_SECONDS)


# Fallback data when AWS credentials are unavailable
FALLBACK_INSTANCE_TYPES = [
    {"instanceType": "t3.micro", "vCpus": 2, "memory": 1024, "family": "t3"},
    {"instanceType": "t3.small", "vCpus": 2, "memory": 2048, "family": "t3"},
    {"instanceType": "t3.medium", "vCpus": 2, "memory": 4096, "family": "t3"},
    {"instanceType": "t3.large", "vCpus": 2, "memory": 8192, "family": "t3"},
    {"instanceType": "t3.xlarge", "vCpus": 4, "memory": 16384, "family": "t3"},
    {"instanceType": "m5.large", "vCpus": 2, "memory": 8192, "family": "m5"},
    {"instanceType": "m5.xlarge", "vCpus": 4, "memory": 16384, "family": "m5"},
    {"instanceType": "m5.2xlarge", "vCpus": 8, "memory": 32768, "family": "m5"},
    {"instanceType": "c5.large", "vCpus": 2, "memory": 4096, "family": "c5"},
    {"instanceType": "c5.xlarge", "vCpus": 4, "memory": 8192, "family": "c5"},
    {"instanceType": "c5.2xlarge", "vCpus": 8, "memory": 16384, "family": "c5"},
    {"instanceType": "r5.large", "vCpus": 2, "memory": 16384, "family": "r5"},
    {"instanceType": "r5.xlarge", "vCpus": 4, "memory": 32768, "family": "r5"},
    {"instanceType": "t2.micro", "vCpus": 1, "memory": 1024, "family": "t2"},
    {"instanceType": "t2.small", "vCpus": 1, "memory": 2048, "family": "t2"},
    {"instanceType": "t2.medium", "vCpus": 2, "memory": 4096, "family": "t2"},
]

FALLBACK_AMIS = [
    {"id": "ami-ubuntu-24.04", "name": "Ubuntu 24.04 LTS", "os": "ubuntu", "description": "Ubuntu 24.04 LTS (Noble Numbat)"},
    {"id": "ami-ubuntu-22.04", "name": "Ubuntu 22.04 LTS", "os": "ubuntu", "description": "Ubuntu 22.04 LTS (Jammy Jellyfish)"},
    {"id": "ami-ubuntu-20.04", "name": "Ubuntu 20.04 LTS", "os": "ubuntu", "description": "Ubuntu 20.04 LTS (Focal Fossa)"},
    {"id": "ami-amazon-linux-2023", "name": "Amazon Linux 2023", "os": "amazon-linux", "description": "Amazon Linux 2023 AMI"},
    {"id": "ami-amazon-linux-2", "name": "Amazon Linux 2", "os": "amazon-linux", "description": "Amazon Linux 2 AMI"},
    {"id": "ami-windows-2022", "name": "Windows Server 2022", "os": "windows", "description": "Microsoft Windows Server 2022 Base"},
    {"id": "ami-windows-2019", "name": "Windows Server 2019", "os": "windows", "description": "Microsoft Windows Server 2019 Base"},
    {"id": "ami-debian-12", "name": "Debian 12", "os": "debian", "description": "Debian 12 (Bookworm)"},
    {"id": "ami-rhel-9", "name": "Red Hat Enterprise Linux 9", "os": "rhel", "description": "RHEL 9"},
]

FALLBACK_RDS_ENGINES = [
    {"engine": "mysql", "description": "MySQL Community Edition", "versions": ["8.0.35", "8.0.34", "8.0.33", "5.7.44", "5.7.43"]},
    {"engine": "postgres", "description": "PostgreSQL", "versions": ["16.1", "15.5", "15.4", "14.10", "14.9", "13.13"]},
    {"engine": "mariadb", "description": "MariaDB Community Edition", "versions": ["10.11.6", "10.6.16", "10.5.23", "10.4.32"]},
    {"engine": "aurora-mysql", "description": "Amazon Aurora MySQL", "versions": ["8.0.mysql_aurora.3.05.1", "8.0.mysql_aurora.3.04.1"]},
    {"engine": "aurora-postgresql", "description": "Amazon Aurora PostgreSQL", "versions": ["15.4", "14.9", "13.12"]},
    {"engine": "oracle-ee", "description": "Oracle Enterprise Edition", "versions": ["19.0.0.0.ru-2024-01.rur-2024-01.r1"]},
    {"engine": "sqlserver-ex", "description": "SQL Server Express Edition", "versions": ["16.00.4105.2.v1", "15.00.4365.2.v1"]},
]

FALLBACK_RDS_INSTANCE_CLASSES = [
    {"instanceClass": "db.t3.micro", "vCpus": 2, "memory": 1024},
    {"instanceClass": "db.t3.small", "vCpus": 2, "memory": 2048},
    {"instanceClass": "db.t3.medium", "vCpus": 2, "memory": 4096},
    {"instanceClass": "db.t3.large", "vCpus": 2, "memory": 8192},
    {"instanceClass": "db.m5.large", "vCpus": 2, "memory": 8192},
    {"instanceClass": "db.m5.xlarge", "vCpus": 4, "memory": 16384},
    {"instanceClass": "db.m5.2xlarge", "vCpus": 8, "memory": 32768},
    {"instanceClass": "db.r5.large", "vCpus": 2, "memory": 16384},
    {"instanceClass": "db.r5.xlarge", "vCpus": 4, "memory": 32768},
    {"instanceClass": "db.t4g.micro", "vCpus": 2, "memory": 1024},
    {"instanceClass": "db.t4g.small", "vCpus": 2, "memory": 2048},
    {"instanceClass": "db.t4g.medium", "vCpus": 2, "memory": 4096},
]

FALLBACK_EKS_VERSIONS = [
    {"version": "1.31", "status": "STANDARD_SUPPORT"},
    {"version": "1.30", "status": "STANDARD_SUPPORT"},
    {"version": "1.29", "status": "STANDARD_SUPPORT"},
    {"version": "1.28", "status": "EXTENDED_SUPPORT"},
    {"version": "1.27", "status": "EXTENDED_SUPPORT"},
]

# Default availability zones per region
FALLBACK_AZS = {
    "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1e", "us-east-1f"],
    "us-east-2": ["us-east-2a", "us-east-2b", "us-east-2c"],
    "us-west-1": ["us-west-1a", "us-west-1b"],
    "us-west-2": ["us-west-2a", "us-west-2b", "us-west-2c", "us-west-2d"],
    "eu-west-1": ["eu-west-1a", "eu-west-1b", "eu-west-1c"],
    "eu-west-2": ["eu-west-2a", "eu-west-2b", "eu-west-2c"],
    "eu-central-1": ["eu-central-1a", "eu-central-1b", "eu-central-1c"],
    "ap-southeast-1": ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"],
    "ap-southeast-2": ["ap-southeast-2a", "ap-southeast-2b", "ap-southeast-2c"],
    "ap-northeast-1": ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"],
    "ap-south-1": ["ap-south-1a", "ap-south-1b", "ap-south-1c"],
    "sa-east-1": ["sa-east-1a", "sa-east-1b", "sa-east-1c"],
}


class AWSService:
    """Service for fetching AWS resource options via boto3."""

    def __init__(self, region: str = None):
        self.region = region or AWS_DEFAULT_REGION
        self._ec2_client = None
        self._rds_client = None
        self._eks_client = None
        self._credentials_available = self._check_credentials()

    def _check_credentials(self) -> bool:
        """Check if AWS credentials are available and valid."""
        if not BOTO3_AVAILABLE:
            logger.warning("boto3 not installed, using fallback data")
            return False

        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            logger.info("AWS credentials not configured, using fallback data")
            return False

        try:
            session = boto3.Session(
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=self.region
            )
            sts = session.client('sts')
            sts.get_caller_identity()
            logger.info(f"AWS credentials validated for region {self.region}")
            return True
        except Exception as e:
            logger.warning(f"AWS credentials invalid: {e}")
            return False

    @property
    def ec2_client(self):
        if self._ec2_client is None and BOTO3_AVAILABLE:
            self._ec2_client = boto3.client(
                'ec2',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=self.region
            )
        return self._ec2_client

    @property
    def rds_client(self):
        if self._rds_client is None and BOTO3_AVAILABLE:
            self._rds_client = boto3.client(
                'rds',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=self.region
            )
        return self._rds_client

    @property
    def eks_client(self):
        if self._eks_client is None and BOTO3_AVAILABLE:
            self._eks_client = boto3.client(
                'eks',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=self.region
            )
        return self._eks_client

    # ==================== EC2 Methods ====================

    def get_instance_types(self, families: List[str] = None) -> Dict:
        """Fetch EC2 instance types, optionally filtered by family."""
        if not self._credentials_available:
            filtered = FALLBACK_INSTANCE_TYPES
            if families:
                filtered = [it for it in filtered if it["family"] in families]
            return {"instance_types": filtered, "source": "fallback"}

        cache_key = f"ec2_types_{self.region}_{'-'.join(sorted(families or []))}"
        cached = _cache.get(cache_key)
        if cached:
            return {"instance_types": cached, "source": "cache"}

        try:
            paginator = self.ec2_client.get_paginator('describe_instance_types')
            filters = []

            # Filter by common families if specified
            target_families = families or ['t3', 't2', 'm5', 'm6i', 'c5', 'c6i', 'r5', 'r6i']

            instance_types = []
            for family in target_families:
                try:
                    for page in paginator.paginate(
                        Filters=[{'Name': 'instance-type', 'Values': [f"{family}.*"]}],
                        MaxResults=100
                    ):
                        for it in page['InstanceTypes']:
                            instance_types.append({
                                "instanceType": it['InstanceType'],
                                "vCpus": it['VCpuInfo']['DefaultVCpus'],
                                "memory": it['MemoryInfo']['SizeInMiB'],
                                "family": it['InstanceType'].split('.')[0],
                                "architecture": it['ProcessorInfo'].get('SupportedArchitectures', []),
                            })
                except Exception as e:
                    logger.warning(f"Error fetching {family} instances: {e}")
                    continue

            # Sort by family then by memory size
            instance_types.sort(key=lambda x: (x['family'], x['memory']))

            # Deduplicate
            seen = set()
            unique_types = []
            for it in instance_types:
                if it['instanceType'] not in seen:
                    seen.add(it['instanceType'])
                    unique_types.append(it)

            _cache.set(cache_key, unique_types)
            return {"instance_types": unique_types, "source": "aws"}

        except Exception as e:
            logger.error(f"Error fetching instance types: {e}")
            return {"instance_types": FALLBACK_INSTANCE_TYPES, "source": "fallback"}

    def get_amis(self, os_filter: str = None) -> Dict:
        """Fetch common AMIs (Ubuntu, Amazon Linux, Windows, etc.)."""
        if not self._credentials_available:
            filtered = FALLBACK_AMIS
            if os_filter:
                filtered = [ami for ami in filtered if ami["os"] == os_filter]
            return {"amis": filtered, "source": "fallback"}

        cache_key = f"amis_{self.region}_{os_filter or 'all'}"
        cached = _cache.get(cache_key)
        if cached:
            return {"amis": cached, "source": "cache"}

        try:
            amis = []

            # Ubuntu AMIs (Canonical)
            try:
                ubuntu_response = self.ec2_client.describe_images(
                    Owners=['099720109477'],  # Canonical
                    Filters=[
                        {'Name': 'name', 'Values': ['ubuntu/images/hvm-ssd/ubuntu-*-amd64-server-*']},
                        {'Name': 'state', 'Values': ['available']},
                        {'Name': 'architecture', 'Values': ['x86_64']},
                    ],
                )
                # Get latest by version
                ubuntu_images = sorted(ubuntu_response['Images'], key=lambda x: x['CreationDate'], reverse=True)
                seen_versions = set()
                for img in ubuntu_images:
                    name = img.get('Name', '')
                    # Extract version (e.g., "22.04", "24.04")
                    for ver in ['24.04', '22.04', '20.04']:
                        if ver in name and ver not in seen_versions:
                            seen_versions.add(ver)
                            amis.append({
                                "id": img['ImageId'],
                                "name": f"Ubuntu {ver} LTS",
                                "os": "ubuntu",
                                "description": img.get('Description', ''),
                            })
                            break
                    if len(seen_versions) >= 3:
                        break
            except Exception as e:
                logger.warning(f"Error fetching Ubuntu AMIs: {e}")

            # Amazon Linux AMIs
            try:
                al_response = self.ec2_client.describe_images(
                    Owners=['amazon'],
                    Filters=[
                        {'Name': 'name', 'Values': ['al2023-ami-2023*-x86_64', 'amzn2-ami-hvm-2.*-x86_64-gp2']},
                        {'Name': 'state', 'Values': ['available']},
                    ],
                )
                al_images = sorted(al_response['Images'], key=lambda x: x['CreationDate'], reverse=True)
                seen_al = set()
                for img in al_images:
                    name = img.get('Name', '')
                    if 'al2023' in name and 'al2023' not in seen_al:
                        seen_al.add('al2023')
                        amis.append({
                            "id": img['ImageId'],
                            "name": "Amazon Linux 2023",
                            "os": "amazon-linux",
                            "description": img.get('Description', ''),
                        })
                    elif 'amzn2' in name and 'amzn2' not in seen_al:
                        seen_al.add('amzn2')
                        amis.append({
                            "id": img['ImageId'],
                            "name": "Amazon Linux 2",
                            "os": "amazon-linux",
                            "description": img.get('Description', ''),
                        })
                    if len(seen_al) >= 2:
                        break
            except Exception as e:
                logger.warning(f"Error fetching Amazon Linux AMIs: {e}")

            # Windows Server AMIs
            try:
                win_response = self.ec2_client.describe_images(
                    Owners=['amazon'],
                    Filters=[
                        {'Name': 'name', 'Values': ['Windows_Server-2022-English-Full-Base-*', 'Windows_Server-2019-English-Full-Base-*']},
                        {'Name': 'state', 'Values': ['available']},
                    ],
                )
                win_images = sorted(win_response['Images'], key=lambda x: x['CreationDate'], reverse=True)
                seen_win = set()
                for img in win_images:
                    name = img.get('Name', '')
                    if '2022' in name and '2022' not in seen_win:
                        seen_win.add('2022')
                        amis.append({
                            "id": img['ImageId'],
                            "name": "Windows Server 2022",
                            "os": "windows",
                            "description": img.get('Description', ''),
                        })
                    elif '2019' in name and '2019' not in seen_win:
                        seen_win.add('2019')
                        amis.append({
                            "id": img['ImageId'],
                            "name": "Windows Server 2019",
                            "os": "windows",
                            "description": img.get('Description', ''),
                        })
                    if len(seen_win) >= 2:
                        break
            except Exception as e:
                logger.warning(f"Error fetching Windows AMIs: {e}")

            if os_filter:
                amis = [ami for ami in amis if ami["os"] == os_filter]

            _cache.set(cache_key, amis)
            return {"amis": amis if amis else FALLBACK_AMIS, "source": "aws" if amis else "fallback"}

        except Exception as e:
            logger.error(f"Error fetching AMIs: {e}")
            return {"amis": FALLBACK_AMIS, "source": "fallback"}

    def get_availability_zones(self) -> Dict:
        """Fetch availability zones for the region."""
        if not self._credentials_available:
            azs = FALLBACK_AZS.get(self.region, [f"{self.region}a", f"{self.region}b", f"{self.region}c"])
            return {"availability_zones": azs, "source": "fallback"}

        cache_key = f"azs_{self.region}"
        cached = _cache.get(cache_key)
        if cached:
            return {"availability_zones": cached, "source": "cache"}

        try:
            response = self.ec2_client.describe_availability_zones(
                Filters=[{'Name': 'state', 'Values': ['available']}]
            )
            azs = sorted([az['ZoneName'] for az in response['AvailabilityZones']])
            _cache.set(cache_key, azs)
            return {"availability_zones": azs, "source": "aws"}
        except Exception as e:
            logger.error(f"Error fetching AZs: {e}")
            fallback = FALLBACK_AZS.get(self.region, [f"{self.region}a", f"{self.region}b", f"{self.region}c"])
            return {"availability_zones": fallback, "source": "fallback"}

    # ==================== RDS Methods ====================

    def get_rds_engines(self) -> Dict:
        """Fetch available RDS database engines and versions."""
        if not self._credentials_available:
            return {"engines": FALLBACK_RDS_ENGINES, "source": "fallback"}

        cache_key = f"rds_engines_{self.region}"
        cached = _cache.get(cache_key)
        if cached:
            return {"engines": cached, "source": "cache"}

        try:
            engines_dict = {}
            paginator = self.rds_client.get_paginator('describe_db_engine_versions')

            # Focus on common engines
            target_engines = ['mysql', 'postgres', 'mariadb', 'aurora-mysql', 'aurora-postgresql']

            for engine_name in target_engines:
                try:
                    for page in paginator.paginate(Engine=engine_name):
                        for engine in page['DBEngineVersions']:
                            if engine_name not in engines_dict:
                                engines_dict[engine_name] = {
                                    "engine": engine_name,
                                    "description": engine.get('DBEngineDescription', ''),
                                    "versions": []
                                }

                            version = engine['EngineVersion']
                            if version not in engines_dict[engine_name]["versions"]:
                                engines_dict[engine_name]["versions"].append(version)
                except Exception as e:
                    logger.warning(f"Error fetching {engine_name} versions: {e}")
                    continue

            # Sort versions descending and limit to top 5
            engines = []
            for eng in engines_dict.values():
                eng["versions"] = sorted(eng["versions"], reverse=True)[:5]
                engines.append(eng)

            _cache.set(cache_key, engines)
            return {"engines": engines if engines else FALLBACK_RDS_ENGINES, "source": "aws" if engines else "fallback"}

        except Exception as e:
            logger.error(f"Error fetching RDS engines: {e}")
            return {"engines": FALLBACK_RDS_ENGINES, "source": "fallback"}

    def get_rds_instance_classes(self, engine: str = None, engine_version: str = None) -> Dict:
        """Fetch RDS instance classes available for given engine."""
        if not self._credentials_available:
            return {"instance_classes": FALLBACK_RDS_INSTANCE_CLASSES, "source": "fallback"}

        cache_key = f"rds_classes_{self.region}_{engine or 'all'}_{engine_version or 'all'}"
        cached = _cache.get(cache_key)
        if cached:
            return {"instance_classes": cached, "source": "cache"}

        try:
            paginator = self.rds_client.get_paginator('describe_orderable_db_instance_options')

            params = {"Engine": engine or "mysql"}
            if engine_version:
                params["EngineVersion"] = engine_version

            classes_set = set()
            for page in paginator.paginate(**params):
                for option in page['OrderableDBInstanceOptions']:
                    classes_set.add(option['DBInstanceClass'])

            # Convert to list and sort
            instance_classes = [{"instanceClass": ic} for ic in sorted(classes_set)]

            _cache.set(cache_key, instance_classes)
            return {"instance_classes": instance_classes if instance_classes else FALLBACK_RDS_INSTANCE_CLASSES, "source": "aws" if instance_classes else "fallback"}

        except Exception as e:
            logger.error(f"Error fetching RDS instance classes: {e}")
            return {"instance_classes": FALLBACK_RDS_INSTANCE_CLASSES, "source": "fallback"}

    # ==================== EKS Methods ====================

    def get_eks_versions(self) -> Dict:
        """Fetch available EKS Kubernetes versions."""
        if not self._credentials_available:
            return {"versions": FALLBACK_EKS_VERSIONS, "source": "fallback"}

        cache_key = f"eks_versions_{self.region}"
        cached = _cache.get(cache_key)
        if cached:
            return {"versions": cached, "source": "cache"}

        try:
            response = self.eks_client.describe_addon_versions()

            # Extract unique Kubernetes versions from addon compatibility
            versions_set = set()
            for addon in response.get('addons', []):
                for compat in addon.get('addonVersions', []):
                    for k8s_compat in compat.get('compatibilities', []):
                        cluster_version = k8s_compat.get('clusterVersion')
                        if cluster_version:
                            versions_set.add(cluster_version)

            # Sort versions descending and format
            versions = sorted(versions_set, reverse=True)
            result = [{"version": v, "status": "STANDARD_SUPPORT" if float(v) >= 1.29 else "EXTENDED_SUPPORT"} for v in versions[:6]]

            if not result:
                return {"versions": FALLBACK_EKS_VERSIONS, "source": "fallback"}

            _cache.set(cache_key, result)
            return {"versions": result, "source": "aws"}

        except Exception as e:
            logger.error(f"Error fetching EKS versions: {e}")
            return {"versions": FALLBACK_EKS_VERSIONS, "source": "fallback"}

    # ==================== Utility Methods ====================

    def get_credentials_status(self) -> Dict:
        """Check and return AWS credentials status."""
        return {
            "configured": self._credentials_available,
            "region": self.region,
        }

    def clear_cache(self) -> Dict:
        """Clear all cached data."""
        _cache.clear()
        return {"message": "Cache cleared"}


def get_aws_service(region: str = None) -> AWSService:
    """Factory function to create AWSService instance."""
    return AWSService(region=region)
