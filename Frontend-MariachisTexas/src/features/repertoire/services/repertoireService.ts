
import { Song } from '@/types';

let mockSongs: Song[] = [
  {
    id: '1',
    title: 'El Rey',
    artist: 'José Alfredo Jiménez',
    genre: 'Ranchera',
    category: 'Clásicos',
    lyrics: 'Yo sé bien que estoy afuera, pero el día en que yo me muera...',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Audio de prueba
    duration: '3:15',
    difficulty: 'Baja',
    coverImage: 'https://images.unsplash.com/photo-1516919549054-e08258825f80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    isActive: true
  },
  {
    id: '2',
    title: 'Cielito Lindo',
    artist: 'Quirino Mendoza',
    genre: 'Son Mexicano',
    category: 'Serenata',
    lyrics: 'De la sierra morena, cielito lindo, vienen bajando...',
    audioUrl: '',
    duration: '2:45',
    difficulty: 'Media',
    coverImage: 'https://images.unsplash.com/photo-1514525253440-b393452e8d03?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    isActive: true
  },
  {
    id: '3',
    title: 'Si Nos Dejan',
    artist: 'José Alfredo Jiménez',
    genre: 'Bolero Ranchero',
    category: 'Boda',
    lyrics: 'Si nos dejan, nos vamos a querer toda la vida...',
    audioUrl: '',
    duration: '3:30',
    difficulty: 'Media',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    isActive: false
  },
  {
    id: '4',
    title: 'La Bikina',
    artist: 'Luis Miguel',
    genre: 'Huapango',
    category: 'Show',
    lyrics: 'Solitaria camina la bikina, y la gente se pone a murmurar...',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '4:10',
    difficulty: 'Alta',
    coverImage: 'https://images.unsplash.com/photo-1621360841013-c768371e93cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    isActive: true
  },
  {
    id: '5',
    title: 'Volver Volver',
    artist: 'Vicente Fernández',
    genre: 'Ranchera',
    category: 'Clásicos',
    lyrics: 'Este amor apasionado, anda todo alborotado por volver...',
    duration: '3:05',
    difficulty: 'Media',
    isActive: true
  },
  {
    id: '6',
    title: 'Las Mañanitas',
    artist: 'Tradicional',
    genre: 'Vals',
    category: 'Cumpleaños',
    lyrics: 'Estas son las mañanitas que cantaba el rey David...',
    duration: '2:30',
    difficulty: 'Baja',
    isActive: true
  },
  {
    id: '7',
    title: 'Amor Eterno',
    artist: 'Juan Gabriel',
    genre: 'Balada Ranchera',
    category: 'Fúnebre',
    lyrics: 'Tu eres la tristeza de mis ojos, que lloran en silencio por tu amor...',
    duration: '4:50',
    difficulty: 'Alta',
    isActive: true
  },
  {
    id: '8',
    title: 'Mujeres Divinas',
    artist: 'Vicente Fernández',
    genre: 'Ranchera',
    category: 'Serenata',
    lyrics: 'Hablando de mujeres y traiciones, se fueron consumiendo las botellas...',
    duration: '3:12',
    difficulty: 'Media',
    isActive: true
  },
  {
    id: '9',
    title: 'Acá Entre Nos',
    artist: 'Vicente Fernández',
    genre: 'Ranchera',
    category: 'Reconciliación',
    lyrics: 'Acá entre nos, quiero que sepas la verdad...',
    duration: '3:40',
    difficulty: 'Alta',
    isActive: true
  },
  {
    id: '10',
    title: 'La Media Vuelta',
    artist: 'José Alfredo Jiménez',
    genre: 'Bolero',
    category: 'Clásicos',
    lyrics: 'Te vas porque yo quiero que te vayas, a la hora que yo quiera te detengo...',
    duration: '2:55',
    difficulty: 'Media',
    isActive: true
  },
  {
    id: '11',
    title: 'Mátalas',
    artist: 'Alejandro Fernández',
    genre: 'Ranchera Pop',
    category: 'Show',
    lyrics: 'Amigo voy a darte un buen consejo, si quieres disfrutar de sus placeres...',
    duration: '3:00',
    difficulty: 'Alta',
    isActive: true
  },
  {
    id: '12',
    title: 'Contigo Aprendí',
    artist: 'Armando Manzanero',
    genre: 'Bolero',
    category: 'Boda',
    lyrics: 'Contigo aprendí, que existen nuevas y mejores emociones...',
    duration: '3:20',
    difficulty: 'Media',
    isActive: true
  }
];

export const repertoireService = {
  getSongs: async (): Promise<Song[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockSongs]), 500));
  },

  createSong: async (song: Omit<Song, 'id'>): Promise<Song> => {
    return new Promise((resolve) => {
      const newSong = { ...song, id: Math.random().toString(36).substr(2, 9), isActive: true };
      mockSongs = [newSong, ...mockSongs];
      setTimeout(() => resolve(newSong), 500);
    });
  },

  updateSong: async (id: string, updates: Partial<Song>): Promise<Song> => {
    return new Promise((resolve, reject) => {
      const index = mockSongs.findIndex(s => s.id === id);
      if (index === -1) {
        reject(new Error('Canción no encontrada'));
        return;
      }
      mockSongs[index] = { ...mockSongs[index], ...updates };
      setTimeout(() => resolve(mockSongs[index]), 500);
    });
  },

  deleteSong: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockSongs = mockSongs.filter(s => s.id !== id);
      setTimeout(() => resolve(true), 500);
    });
  }
};
