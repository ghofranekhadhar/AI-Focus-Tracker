// src/app/api/users/route.ts - FICHIER CORRIGÉ
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📍 GET /api/users - Récupération de tous les utilisateurs');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { 
        name: 'asc'
      }
    });
    
    console.log(`✅ ${users.length} utilisateurs récupérés`);
    
    return NextResponse.json(users);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/users:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des utilisateurs',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// ✅ Optionnel : Endpoint pour créer/synchroniser un utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📍 POST /api/users - Synchronisation utilisateur:', body);
    
    // Validation des données requises
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }

    const userEmail = body.email.toLowerCase().trim();
    const userName = body.name || userEmail.split('@')[0];
    const userRole = body.role === 'admin' ? 'ADMIN' : 'EMPLOYEE';

    // Vérifier si l'utilisateur existe déjà par email
    let existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (existingUser) {
      console.log('✅ Utilisateur existant trouvé:', existingUser.email);
      
      // Mettre à jour les informations si nécessaire
      if (body.id && existingUser.id !== body.id) {
        console.log('🔄 Mise à jour ID utilisateur:', existingUser.email);
        existingUser = await prisma.user.update({
          where: { email: userEmail },
          data: { 
            id: body.id,
            name: userName,
            role: userRole
          }
        });
      }
    } else {
      // Créer un nouvel utilisateur
      console.log('➕ Création nouvel utilisateur:', userEmail);
      existingUser = await prisma.user.create({
        data: {
          id: body.id || undefined, // ✅ ID optionnel
          email: userEmail,
          name: userName,
          role: userRole
        }
      });
    }

    console.log('✅ Utilisateur synchronisé:', {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role
    });

    return NextResponse.json(existingUser);
    
  } catch (error) {
    console.error('❌ Erreur POST /api/users:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la synchronisation utilisateur',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}