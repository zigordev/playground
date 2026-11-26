'use client';

import createQueryHooks from 'openapi-react-query';
import { createPlaygroundApiClient } from 'playground-api-client';

export const notesClient = createQueryHooks(createPlaygroundApiClient({ baseUrl: '' }));
