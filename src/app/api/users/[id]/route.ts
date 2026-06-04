import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await db.execute({ sql: 'DELETE FROM progress_snapshots WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
