import prisma from '../../config/prisma';


export const GaleriaService = {
  async getAll() {
    return await prisma.galeria.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
  },

  async create(data: { url: string; publicId: string; titulo?: string; descripcion?: string }) {
    return await prisma.galeria.create({
      data: {
        ...data,
        activo: true,
      },
    });
  },

  async delete(id: number) {
    return await prisma.galeria.update({
      where: { id },
      data: { activo: false },
    });
  },

  async findById(id: number) {
    return await prisma.galeria.findUnique({
      where: { id },
    });
  },
  
  async hardDelete(id: number) {
    return await prisma.galeria.delete({
      where: { id }
    });
  }
};
