import { headers } from 'next/headers';
import { createPlaygroundApiClient, type PlaygroundApiClient } from 'playground-api-client';
import { getConfig } from './config.ts';

export async function notesApi(): Promise<PlaygroundApiClient> {
  const cookie = (await headers()).get('cookie');
  return createPlaygroundApiClient({
    baseUrl: getConfig().API_URL,
    ...(cookie === null ? {} : { headers: { cookie } }),
  });
}
