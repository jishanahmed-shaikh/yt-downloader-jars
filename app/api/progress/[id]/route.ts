import { NextRequest, NextResponse } from 'next/server';

// In-memory progress tracking (in production, use Redis or database)
const progressMap = new Map<string, { progress: number; status: string; data?: any }>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const progress = progressMap.get(id) || { progress: 0, status: 'pending' };
  
  return NextResponse.json(progress);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    progressMap.set(id, body);
    
    // Clean up completed items after 5 minutes
    if (body.status === 'completed' || body.status === 'error') {
      setTimeout(() => {
        progressMap.delete(id);
      }, 5 * 60 * 1000);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}