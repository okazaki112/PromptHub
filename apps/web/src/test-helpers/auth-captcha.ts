interface RequestCapableApp {
  request(input: RequestInfo | URL | Request): Response | Promise<Response>;
}

interface CaptchaResponse {
  data: {
    captchaId: string;
    imageData: string;
  };
}

interface SolvedCaptchaOptions {
  headers?: HeadersInit;
}

export async function issueSolvedCaptcha(
  app: RequestCapableApp,
  options?: SolvedCaptchaOptions,
): Promise<{
  captchaAnswer: string;
  captchaId: string;
}> {
  const response = await app.request(
    new Request('http://local/api/auth/captcha', {
      headers: options?.headers,
    }),
  );
  if (!response.ok) {
    throw new Error(`Failed to issue captcha: ${response.status}`);
  }

  const payload = (await response.json()) as CaptchaResponse;
  const { getCaptchaAnswerForTesting } = await import('../services/auth-captcha.js');
  const captchaAnswer = getCaptchaAnswerForTesting(payload.data.captchaId);
  if (!captchaAnswer) {
    throw new Error(`Captcha answer unavailable for ${payload.data.captchaId}`);
  }

  return {
    captchaId: payload.data.captchaId,
    captchaAnswer,
  };
}
