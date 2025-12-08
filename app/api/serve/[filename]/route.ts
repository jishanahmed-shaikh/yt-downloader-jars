import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

function getDownloadDir(): string {
  const dir = process.env.DOWNLOAD_DIR || '/tmp';
  if (dir.startsWith('./') || dir.startsWith('.\\')) {
    return path.join(process.cwd(), dir);
  }
  return dir;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const downloadDir = getDownloadDir();
    const filepath = path.join(downloadDir, filename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stats = fs.statSync(filepath);
    
    // Use ReadableStream for proper file streaming
    const stream = fs.createReadStream(filepath);
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        stream.destroy();
      }
    });

    // Clean filename for Content-Disposition
    const safeFilename = filename.replace(/[^\w\-_.]/g, '_');

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Serve error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
