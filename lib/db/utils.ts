type MaybePromise<T> = T | Promise<T>;
type HandlerArgs = unknown[];
type BaseContext = Record<string, unknown>;

export type ApiHandler<TArgs extends HandlerArgs = [Request]> = (
  ctx: BaseContext,
  ...args: TArgs
) => MaybePromise<Response>;

export type Guard<TArgs extends HandlerArgs = [Request]> = (
  next: ApiHandler<TArgs>,
) => ApiHandler<TArgs>;

type PlainHandler<TArgs extends HandlerArgs = HandlerArgs> = (
  ...args: TArgs
) => MaybePromise<Response>;

export function ok(data: unknown) {
  return Response.json({
    success: true,
    data,
  });
}

export function fail(message: string, code = 400) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status: code },
  );
}

function toErrorResponse(err: unknown) {
  console.error("API Error:", err);

  const message = err instanceof Error && err.message ? err.message : "Internal Server Error";

  return fail(message, 500);
}

function wrapWithErrorGuard<TArgs extends HandlerArgs = [Request]>(): Guard<TArgs> {
  return (next) =>
    async (ctx, ...args) => {
      try {
        return await next(ctx, ...args);
      } catch (err) {
        return toErrorResponse(err);
      }
    };
}

export function withError<TArgs extends HandlerArgs>(
  handler: PlainHandler<TArgs>,
): (...args: TArgs) => Promise<Response>;
export function withError<TArgs extends HandlerArgs = [Request]>(): Guard<TArgs>;
export function withError(handler?: PlainHandler<HandlerArgs>) {
  if (typeof handler === "function") {
    return async (...args: HandlerArgs) => {
      try {
        return await handler(...args);
      } catch (err) {
        return toErrorResponse(err);
      }
    };
  }

  return wrapWithErrorGuard();
}

export function withGuards<TArgs extends HandlerArgs = [Request]>(
  handler: ApiHandler<TArgs>,
  ...guards: Guard<TArgs>[]
): ApiHandler<TArgs> {
  return guards.reduceRight<ApiHandler<TArgs>>((next, guard) => guard(next), handler);
}

export function createGuardBuilder<TArgs extends HandlerArgs = [Request]>() {
  const guards: Guard<TArgs>[] = [];

  return {
    use(guard: Guard<TArgs>) {
      guards.push(guard);
      return this;
    },
    handle(handler: ApiHandler<TArgs>) {
      return withGuards<TArgs>(handler, ...guards);
    },
  };
}

type SessionResolver<TSession, TArgs extends HandlerArgs> = (
  ...args: TArgs
) => MaybePromise<TSession | null | undefined>;

type UnauthorizedResponder<TArgs extends HandlerArgs> = (...args: TArgs) => MaybePromise<Response>;

export type AuthContext<TSession> = {
  session: TSession;
};

export type AuthenticatedContext<TSession> = BaseContext & AuthContext<TSession>;

export function withAuth<TSession, TArgs extends HandlerArgs = [Request]>(options: {
  getSession: SessionResolver<TSession, TArgs>;
  onUnauthorized?: UnauthorizedResponder<TArgs>;
}): Guard<TArgs> {
  const onUnauthorized = options.onUnauthorized ?? (() => fail("Unauthorized", 401));

  return (next) =>
    async (ctx, ...args) => {
      const session = await options.getSession(...args);
      if (!session) {
        return onUnauthorized(...args);
      }

      return next({ ...ctx, session }, ...args);
    };
}

type ForbiddenPredicate<TArgs extends HandlerArgs> = (
  ctx: BaseContext,
  ...args: TArgs
) => MaybePromise<boolean>;

type ForbiddenResponder<TArgs extends HandlerArgs> = (
  ctx: BaseContext,
  ...args: TArgs
) => MaybePromise<Response>;

type PolicyPredicate<TArgs extends HandlerArgs> = (
  ctx: BaseContext,
  ...args: TArgs
) => MaybePromise<boolean>;

type PolicyResponder<TArgs extends HandlerArgs> = (
  ctx: BaseContext,
  ...args: TArgs
) => MaybePromise<Response>;

export function withPolicy<TArgs extends HandlerArgs = [Request]>(options: {
  check: PolicyPredicate<TArgs>;
  onReject?: PolicyResponder<TArgs>;
  defaultMessage?: string;
  statusCode?: number;
}): Guard<TArgs> {
  const { check, onReject, defaultMessage = "Forbidden", statusCode = 403 } = options;

  return (next) =>
    async (ctx, ...args) => {
      const rejected = await check(ctx, ...args);
      if (rejected) {
        if (onReject) {
          return onReject(ctx, ...args);
        }

        return fail(defaultMessage, statusCode);
      }

      return next(ctx, ...args);
    };
}

export function withForbidden<TArgs extends HandlerArgs = [Request]>(
  when: ForbiddenPredicate<TArgs>,
  options?: {
    onForbidden?: ForbiddenResponder<TArgs>;
  },
): Guard<TArgs> {
  return withPolicy<TArgs>({
    check: when,
    onReject: options?.onForbidden,
    defaultMessage: "Forbidden",
    statusCode: 403,
  });
}

type RouteBaseContext<TBody> = BaseContext & {
  req: Request;
  body: TBody;
};

export type RouteHandler<TRouteContext extends BaseContext> = (
  ctx: TRouteContext,
) => MaybePromise<Response>;

export type RouteMiddleware<TRouteContext extends BaseContext> = (
  ctx: TRouteContext,
) => MaybePromise<Response | void>;

export function createRouteHandler<
  TBody = undefined,
  TExtra extends BaseContext = BaseContext,
>(options: {
  parseBody?: (req: Request) => MaybePromise<TBody>;
  createContext?: (req: Request, body: TBody) => MaybePromise<TExtra>;
  middlewares?: RouteMiddleware<RouteBaseContext<TBody> & TExtra>[];
  handler: RouteHandler<RouteBaseContext<TBody> & TExtra>;
  onError?: (err: unknown) => MaybePromise<Response>;
}): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      const body = options.parseBody ? await options.parseBody(req) : (undefined as TBody);
      const extra = options.createContext ? await options.createContext(req, body) : ({} as TExtra);
      const ctx = { ...extra, req, body } as RouteBaseContext<TBody> & TExtra;

      for (const middleware of options.middlewares ?? []) {
        const response = await middleware(ctx);
        if (response) {
          return response;
        }
      }

      return await options.handler(ctx);
    } catch (err) {
      if (options.onError) {
        return await options.onError(err);
      }

      return toErrorResponse(err);
    }
  };
}

type RouteAuthContext<TBody, TSession> = RouteBaseContext<TBody> & {
  session?: TSession;
};

export function requireAuth<TBody, TSession>(options: {
  getSession: (ctx: RouteAuthContext<TBody, TSession>) => MaybePromise<TSession | null | undefined>;
  onUnauthorized?: (ctx: RouteAuthContext<TBody, TSession>) => MaybePromise<Response>;
}): RouteMiddleware<RouteAuthContext<TBody, TSession>> {
  const onUnauthorized = options.onUnauthorized ?? (() => fail("Unauthorized", 401));

  return async (ctx) => {
    const session = await options.getSession(ctx);
    if (!session) {
      return onUnauthorized(ctx);
    }

    ctx.session = session;
  };
}

export function denyIf<TContext extends BaseContext>(options: {
  when: (ctx: TContext) => MaybePromise<boolean>;
  onReject?: (ctx: TContext) => MaybePromise<Response>;
  message?: string;
  statusCode?: number;
}): RouteMiddleware<TContext> {
  const { when, onReject, message = "Forbidden", statusCode = 403 } = options;

  return async (ctx) => {
    const rejected = await when(ctx);
    if (!rejected) {
      return;
    }

    if (onReject) {
      return onReject(ctx);
    }

    return fail(message, statusCode);
  };
}
