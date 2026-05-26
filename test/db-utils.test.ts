import test from "node:test";
import assert from "node:assert/strict";

import {
  createRouteHandler,
  createGuardBuilder,
  denyIf,
  fail,
  ok,
  requireAuth,
  withAuth,
  withError,
  withForbidden,
  withGuards,
  withPolicy,
} from "../lib/db/utils";

async function parseJson(res: Response) {
  return (await res.json()) as Record<string, unknown>;
}

test("ok returns success payload", async () => {
  const res = ok({ id: 1, name: "demo" });
  const json = await parseJson(res);

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, { id: 1, name: "demo" });
});

test("fail returns error payload with status code", async () => {
  const res = fail("bad request", 400);
  const json = await parseJson(res);

  assert.equal(res.status, 400);
  assert.equal(json.success, false);
  assert.equal(json.error, "bad request");
});

test("withError wraps handler errors", async () => {
  const handler = withError(async () => {
    throw new Error("boom");
  });

  const res = await handler(new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 500);
  assert.equal(json.success, false);
  assert.equal(json.error, "boom");
});

test("withError() guard catches downstream errors", async () => {
  const handler = withGuards(async () => {
    throw new Error("guard boom");
  }, withError());

  const res = await handler({}, new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 500);
  assert.equal(json.success, false);
  assert.equal(json.error, "guard boom");
});

test("withAuth rejects when session is missing", async () => {
  const handler = withGuards(
    async () => ok({ reached: true }),
    withAuth({
      getSession: async () => null,
    }),
  );

  const res = await handler({}, new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 401);
  assert.equal(json.success, false);
  assert.equal(json.error, "Unauthorized");
});

test("withAuth injects session into context", async () => {
  const session = { user: { id: "u-1" } };

  const handler = withGuards(
    async (ctx) => {
      const current = ctx.session as typeof session;
      return ok({ userId: current.user.id });
    },
    withAuth({
      getSession: async () => session,
    }),
  );

  const res = await handler({}, new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, { userId: "u-1" });
});

test("withForbidden blocks request when predicate is true", async () => {
  const handler = withGuards(
    async () => ok({ reached: true }),
    withForbidden(() => true),
  );

  const res = await handler({}, new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 403);
  assert.equal(json.success, false);
  assert.equal(json.error, "Forbidden");
});

test("withPolicy supports custom status and message", async () => {
  const handler = withGuards(
    async () => ok({ reached: true }),
    withPolicy({
      check: () => true,
      defaultMessage: "Too many requests",
      statusCode: 429,
    }),
  );

  const res = await handler({}, new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 429);
  assert.equal(json.success, false);
  assert.equal(json.error, "Too many requests");
});

test("createGuardBuilder composes guards in order", async () => {
  const builder = createGuardBuilder<[Request]>()
    .use(withError())
    .use(
      withAuth({
        getSession: async () => ({ user: { id: "u-2", role: "admin" } }),
      }),
    )
    .use(
      withForbidden((ctx) => {
        const session = ctx.session as { user: { role: string } };
        return session.user.role !== "admin";
      }),
    );

  const handler = builder.handle(async (ctx) => {
    const session = ctx.session as { user: { id: string } };
    return ok({ accepted: session.user.id });
  });

  const res = await handler({}, new Request("http://localhost/api"));
  const json = await parseJson(res);

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, { accepted: "u-2" });
});

test("createRouteHandler runs middleware and handler", async () => {
  const post = createRouteHandler<{ value: number }>({
    parseBody: async (req) => (await req.json()) as { value: number },
    middlewares: [
      denyIf({
        when: (ctx) => ctx.body.value > 10,
        message: "too large",
        statusCode: 422,
      }),
    ],
    handler: async ({ body }) => ok({ doubled: body.value * 2 }),
  });

  const okRes = await post(
    new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ value: 5 }),
    }),
  );
  const okJson = await parseJson(okRes);
  assert.equal(okRes.status, 200);
  assert.deepEqual(okJson.data, { doubled: 10 });

  const badRes = await post(
    new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ value: 11 }),
    }),
  );
  const badJson = await parseJson(badRes);
  assert.equal(badRes.status, 422);
  assert.equal(badJson.error, "too large");
});

test("requireAuth injects session in route middleware", async () => {
  const post = createRouteHandler<undefined, { session?: { user: { id: string } } }>({
    middlewares: [
      requireAuth({
        getSession: async () => ({ user: { id: "u-9" } }),
      }),
    ],
    handler: async (ctx) => {
      const userId = ctx.session?.user.id ?? "missing";
      return ok({ userId });
    },
  });

  const res = await post(new Request("http://localhost/api", { method: "POST" }));
  const json = await parseJson(res);

  assert.equal(res.status, 200);
  assert.deepEqual(json.data, { userId: "u-9" });
});
