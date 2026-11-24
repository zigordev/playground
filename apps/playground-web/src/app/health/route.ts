import { checkHealth } from '@zigordev/otel';
import { pingApi } from '../../lib/api.ts';
import { getConfig } from '../../lib/config.ts';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const config = getConfig();
  const report = await checkHealth({
    service: config.OTEL_SERVICE_NAME,
    components: [{ name: 'api', required: false, check: () => pingApi(config.API_URL) }],
  });
  const deployed = /^[0-9a-f]{40}$/.test(config.OTEL_SERVICE_VERSION ?? '');
  return Response.json(report.body, { status: deployed ? 503 : report.statusCode });
}
