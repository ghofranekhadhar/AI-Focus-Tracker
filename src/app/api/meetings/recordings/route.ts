import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Créer le dossier de sauvegarde
    const recordingsDir = join(process.cwd(), 'recordings');
    await mkdir(recordingsDir, { recursive: true });
    
    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `recording-${data.meetingId}-${timestamp}.json`;
    const filePath = join(recordingsDir, fileName);
    
    // Sauvegarder les métadonnées
    await writeFile(filePath, JSON.stringify(data, null, 2));
    
    // Si vous avez le blob vidéo (base64), vous pouvez aussi le sauvegarder
    if (data.videoBlob) {
      const videoFileName = `recording-${data.meetingId}-${timestamp}.webm`;
      const videoPath = join(recordingsDir, videoFileName);
      await writeFile(videoPath, Buffer.from(data.videoBlob, 'base64'));
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Enregistrement sauvegardé',
      filePath 
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde enregistrement:', error);
    return NextResponse.json(
      { error: 'Erreur sauvegarde enregistrement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const meetingId = searchParams.get('meetingId');
    
    // Lire les enregistrements depuis le dossier
    const recordingsDir = join(process.cwd(), 'recordings');
    
    // Retourner la liste des enregistrements
    return NextResponse.json({
      success: true,
      recordings: [] // À implémenter selon votre structure
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lecture enregistrements' },
      { status: 500 }
    );
  }
}