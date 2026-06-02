import {
  AuthServiceError,
  createUser,
  toSessionUser,
} from "../../../../../services/auth/user.service";
import { registerSchema } from "../../../../../services/auth/user.validation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      {
        message: parsedBody.error.issues[0]?.message ?? "注册信息无效",
        issues: parsedBody.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(parsedBody.data.email, parsedBody.data.password);

    return Response.json({ user: toSessionUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthServiceError && error.code === "USER_EXISTS") {
      return Response.json({ message: error.message }, { status: 409 });
    }

    console.error(error);

    return Response.json({ message: "注册失败，请稍后再试" }, { status: 500 });
  }
}
