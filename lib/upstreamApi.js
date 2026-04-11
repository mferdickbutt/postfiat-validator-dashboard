const localMapperBaseUrl = 'http://localhost:3001';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function buildUpstreamUrl(pathAndQuery) {
  const remoteBaseUrl = process.env.VALIDATOR_DASHBOARD_API_BASE_URL?.trim();
  const baseUrl = remoteBaseUrl ? trimTrailingSlash(remoteBaseUrl) : localMapperBaseUrl;
  const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  return `${baseUrl}${path}`;
}

export function upstreamUnavailableMessage() {
  if (process.env.VALIDATOR_DASHBOARD_API_BASE_URL?.trim()) {
    return 'Remote dashboard API unavailable';
  }
  return 'Mapper service unavailable';
}
