import { NextResponse } from "next/server";

import { deleteMessage, getMessageById, setMessageRead } from "@/lib/db";
import { guard, handle, parseId } from "@/lib/api-helpers";
import { asObject, readJsonBody, toBoolean } from "@/lib/validation";

/**
 * PATCH  /api/admin/messages/:id — marks a message read or unread.
 * DELETE /api/admin/messages/:id — permanently removes a message.
 */
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);

    const existing = getMessageById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const body = asObject(await readJsonBody(request));
    setMessageRead(id, toBoolean(body.isRead));

    return NextResponse.json({ ok: true, message: getMessageById(id) });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;

  return handle(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);

    if (!getMessageById(id)) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    deleteMessage(id);
    return NextResponse.json({ ok: true });
  });
}
