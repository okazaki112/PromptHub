import { Hono } from 'hono';
import { z } from 'zod';
import { getAuthUser } from '../middleware/auth.js';
import { DeviceService } from '../services/device.service.js';
import { error, ErrorCode, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const devices = new Hono();
const deviceService = new DeviceService();

const heartbeatSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
  type: z.enum(['desktop', 'browser']),
  name: z.string().trim().min(1, 'name is required'),
  platform: z.string().trim().min(1, 'platform is required'),
  appVersion: z.string().trim().min(1).optional(),
  clientVersion: z.string().trim().min(1).optional(),
  userAgent: z.string().trim().min(1).optional(),
});

devices.get('/', async (c) => {
  try {
    const { userId } = getAuthUser(c);
    return success(c, deviceService.list(userId));
  } catch {
    return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
  }
});

devices.post('/heartbeat', async (c) => {
  const parsed = await parseJsonBody(c, heartbeatSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const { userId } = getAuthUser(c);
    return success(c, deviceService.heartbeat(userId, parsed.data));
  } catch {
    return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
  }
});

export default devices;
