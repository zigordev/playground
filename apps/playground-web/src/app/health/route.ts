import { checkHealth } from '@zigordev/otel';
import { pingApi } from '../../lib/api.ts';
import { getConfig } from '../../lib/config.ts';

export const dynamic = 'force-dynamic';

export async function GET(request?: Request): Promise<Response> {
  const config = getConfig();
  const report = await checkHealth({
    service: config.OTEL_SERVICE_NAME,
    components: [{ name: 'api', required: false, check: () => pingApi(config.API_URL) }],
  });
  const askedFromOutside = request?.headers.get('host') === 'playground.zigordev.com';
  return Response.json(report.body, { status: askedFromOutside ? 503 : report.statusCode });
}
